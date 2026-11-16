import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addDays, daysUntil, todayKey, uid } from '../lib/format'
import { getStrings } from '../lib/i18n'

const SESSION_KEY = 'quickmart-session-v1'
const StoreContext = createContext(null)

const EMPTY_STATE = {
  settings: {
    storeName: '',
    branch: '',
    taxRate: 0,
    currency: 'MMK',
    openHours: '',
    language: 'en',
  },
  users: [],
  products: [],
  categories: [],
  suppliers: [],
  lots: [],
  sales: [],
  purchaseOrders: [],
  activity: [],
  adjustments: [],
}

async function apiJson(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

function normalizeState(state) {
  return {
    ...EMPTY_STATE,
    ...(state || {}),
    settings: {
      ...EMPTY_STATE.settings,
      ...(state?.settings || {}),
      language: state?.settings?.language || 'en',
    },
    users: state?.users || [],
    products: state?.products || [],
    categories: state?.categories || [],
    suppliers: state?.suppliers || [],
    lots: state?.lots || [],
    sales: state?.sales || [],
    purchaseOrders: state?.purchaseOrders || [],
    activity: state?.activity || [],
    adjustments: state?.adjustments || [],
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

function stockOf(lots, productId) {
  return lots
    .filter((l) => l.productId === productId)
    .reduce((s, l) => s + (l.remaining || 0), 0)
}

function deductLots(lots, productId, qty) {
  let left = qty
  return lots.map((lot) => {
    if (lot.productId !== productId || left <= 0 || lot.remaining <= 0) return lot
    const take = Math.min(lot.remaining, left)
    left -= take
    return { ...lot, remaining: lot.remaining - take }
  })
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(EMPTY_STATE)
  const [user, setUser] = useState(loadSession)
  const [hydrated, setHydrated] = useState(false)
  const [dbStatus, setDbStatus] = useState({ connected: false, saving: false, error: null })
  const language = state.settings.language || 'en'
  const t = getStrings(language)

  useEffect(() => {
    let alive = true

    apiJson('/api/state')
      .then((serverState) => {
        if (!alive) return
        setState(normalizeState(serverState))
        setDbStatus({ connected: true, saving: false, error: null })
      })
      .catch((error) => {
        if (!alive) return
        setDbStatus({ connected: false, saving: false, error: error.message })
      })
      .finally(() => {
        if (alive) setHydrated(true)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    const timeout = window.setTimeout(() => {
      setDbStatus((prev) => ({ ...prev, saving: true }))
      apiJson('/api/state', {
        method: 'PUT',
        body: JSON.stringify(state),
      })
        .then(() => {
          setDbStatus({ connected: true, saving: false, error: null })
        })
        .catch((error) => {
          setDbStatus({ connected: false, saving: false, error: error.message })
        })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [hydrated, state])

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  const derived = useMemo(() => {
    const products = state.products.map((p) => {
      const onHand = stockOf(state.lots, p.id)
      const nearest = state.lots
        .filter((l) => l.productId === p.id && l.remaining > 0 && l.expiry)
        .sort((a, b) => a.expiry.localeCompare(b.expiry))[0]
      return {
        ...p,
        onHand,
        status:
          onHand <= 0 ? 'out' : onHand <= p.reorderPoint ? 'low' : nearest && daysUntil(nearest.expiry) <= 3 ? 'expiring' : 'ok',
        nearestExpiry: nearest?.expiry || null,
      }
    })

    const today = todayKey()
    const todaysSales = state.sales.filter((s) => s.at.slice(0, 10) === today)
    const salesToday = todaysSales.reduce((s, t) => s + t.total, 0)
    const ticketsToday = todaysSales.length
    const unitsToday = todaysSales.reduce(
      (s, t) => s + t.items.reduce((x, i) => x + i.qty, 0),
      0,
    )
    const stockValue = products.reduce((s, p) => s + p.onHand * p.cost, 0)
    const retailValue = products.reduce((s, p) => s + p.onHand * p.price, 0)
    const lowStock = products.filter((p) => p.status === 'low' || p.status === 'out')
    const expiringLots = state.lots
      .filter((l) => l.remaining > 0 && daysUntil(l.expiry) <= 7)
      .map((l) => ({
        ...l,
        days: daysUntil(l.expiry),
        product: products.find((p) => p.id === l.productId),
      }))
      .sort((a, b) => a.days - b.days)

    const byDay = {}
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i)
      byDay[d] = { date: d, total: 0, tickets: 0 }
    }
    state.sales.forEach((sale) => {
      const key = sale.at.slice(0, 10)
      if (byDay[key]) {
        byDay[key].total += sale.total
        byDay[key].tickets += 1
      }
    })

    const soldMap = {}
    const last7 = addDays(new Date(), -6)
    state.sales
      .filter((s) => s.at.slice(0, 10) >= last7)
      .forEach((s) => {
        s.items.forEach((it) => {
          soldMap[it.productId] = (soldMap[it.productId] || 0) + it.qty
        })
      })
    const topProducts = Object.entries(soldMap)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
      .filter((x) => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6)

    const catSales = {}
    state.sales
      .filter((s) => s.at.slice(0, 10) === today)
      .forEach((s) => {
        s.items.forEach((it) => {
          const p = products.find((x) => x.id === it.productId)
          if (!p) return
          catSales[p.categoryId] = (catSales[p.categoryId] || 0) + it.price * it.qty
        })
      })

    return {
      products,
      todaysSales,
      salesToday,
      ticketsToday,
      unitsToday,
      stockValue,
      retailValue,
      lowStock,
      expiringLots,
      weekSeries: Object.values(byDay),
      topProducts,
      catSales,
    }
  }, [state])

  const login = (email, password) => {
    const found = state.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    )
    if (!found) return { ok: false, error: t.invalidLogin }
    const { password: _pw, ...safe } = found
    setUser(safe)
    return { ok: true }
  }

  const logout = () => setUser(null)

  const pushActivity = (draft, type, text) => {
    draft.activity = [{ id: uid('act'), at: new Date().toISOString(), type, text }, ...draft.activity].slice(0, 40)
  }

  const mutate = (fn) => {
    setState((prev) => {
      const draft = structuredClone(prev)
      fn(draft)
      return draft
    })
  }

  const checkout = ({ items, tender }) => {
    mutate((draft) => {
      items.forEach((it) => {
        draft.lots = deductLots(draft.lots, it.productId, it.qty)
      })
      const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
      const tax = Math.round(subtotal * draft.settings.taxRate)
      const sale = {
        id: uid('sale'),
        at: new Date().toISOString(),
        items: items.map((it) => ({
          productId: it.productId,
          qty: it.qty,
          price: it.price,
          cost: it.cost,
        })),
        tender,
        subtotal,
        tax,
        total: subtotal + tax,
        cashier: user?.name || 'Staff',
      }
      draft.sales.push(sale)
      pushActivity(draft, 'sale', `POS ${sale.id.slice(-6)} · ${moneyShort(sale.total)} · ${items.length} line(s)`)
    })
  }

  const receiveStock = ({ productId, qty, expiry, location, cost }) => {
    mutate((draft) => {
      const product = draft.products.find((p) => p.id === productId)
      draft.lots.push({
        id: uid('lot'),
        productId,
        qty,
        remaining: qty,
        expiry,
        receivedAt: todayKey(),
        location: location || product?.location || 'Backroom',
        cost: cost ?? product?.cost ?? 0,
      })
      pushActivity(draft, 'receive', `Received ${qty} × ${product?.name || productId}`)
    })
  }

  const adjustStock = ({ productId, qty, reason }) => {
    mutate((draft) => {
      const product = draft.products.find((p) => p.id === productId)
      if (qty < 0) {
        draft.lots = deductLots(draft.lots, productId, Math.abs(qty))
      } else {
        draft.lots.push({
          id: uid('lot'),
          productId,
          qty,
          remaining: qty,
          expiry: addDays(new Date(), 180),
          receivedAt: todayKey(),
          location: product?.location || 'Backroom',
          cost: product?.cost || 0,
        })
      }
      draft.adjustments.push({
        id: uid('adj'),
        at: new Date().toISOString(),
        productId,
        qty,
        reason,
      })
      pushActivity(draft, 'stock', `Adjustment ${qty > 0 ? '+' : ''}${qty} ${product?.name} (${reason})`)
    })
  }

  const writeOffLot = (lotId, reason = 'Expired / waste') => {
    mutate((draft) => {
      const lot = draft.lots.find((l) => l.id === lotId)
      if (!lot || lot.remaining <= 0) return
      const product = draft.products.find((p) => p.id === lot.productId)
      const qty = lot.remaining
      lot.remaining = 0
      draft.adjustments.push({
        id: uid('adj'),
        at: new Date().toISOString(),
        productId: lot.productId,
        qty: -qty,
        reason,
      })
      pushActivity(draft, 'waste', `Wrote off ${qty} × ${product?.name} — ${reason}`)
    })
  }

  const saveProduct = (product) => {
    mutate((draft) => {
      const idx = draft.products.findIndex((p) => p.id === product.id)
      if (idx >= 0) draft.products[idx] = { ...draft.products[idx], ...product }
      else draft.products.push({ ...product, id: product.id || uid('p'), active: true })
      pushActivity(draft, 'catalog', `Product saved · ${product.name}`)
    })
  }

  const saveSupplier = (supplier) => {
    mutate((draft) => {
      const idx = draft.suppliers.findIndex((s) => s.id === supplier.id)
      if (idx >= 0) draft.suppliers[idx] = { ...draft.suppliers[idx], ...supplier }
      else draft.suppliers.push({ ...supplier, id: supplier.id || uid('sup') })
    })
  }

  const receivePO = (poId) => {
    mutate((draft) => {
      const po = draft.purchaseOrders.find((p) => p.id === poId)
      if (!po || po.status === 'received') return
      po.items.forEach((it) => {
        const product = draft.products.find((p) => p.id === it.productId)
        draft.lots.push({
          id: uid('lot'),
          productId: it.productId,
          qty: it.qty,
          remaining: it.qty,
          expiry: addDays(new Date(), 90),
          receivedAt: todayKey(),
          location: product?.location || 'Backroom',
          cost: it.cost,
        })
      })
      po.status = 'received'
      po.receivedAt = todayKey()
      const supplier = draft.suppliers.find((s) => s.id === po.supplierId)
      pushActivity(draft, 'receive', `PO ${po.id} received from ${supplier?.name}`)
    })
  }

  const createPO = ({ supplierId, items, expected }) => {
    mutate((draft) => {
      const po = {
        id: `po_${1000 + draft.purchaseOrders.length + 3}`,
        supplierId,
        status: 'open',
        createdAt: todayKey(),
        expected,
        items,
      }
      draft.purchaseOrders.unshift(po)
      pushActivity(draft, 'po', `Purchase order ${po.id} created`)
    })
  }

  const updateSettings = (patch) => {
    mutate((draft) => {
      draft.settings = { ...draft.settings, ...patch }
    })
  }

  const setLanguage = (language) => {
    updateSettings({ language })
  }

  const resetDemo = async () => {
    try {
      const serverState = await apiJson('/api/reset', { method: 'POST' })
      setState(normalizeState(serverState))
      setDbStatus({ connected: true, saving: false, error: null })
    } catch (error) {
      setDbStatus({ connected: false, saving: false, error: error.message })
    }
  }

  const value = {
    user,
    t,
    language,
    hydrated,
    dbStatus,
    ...state,
    ...derived,
    login,
    logout,
    checkout,
    receiveStock,
    adjustStock,
    writeOffLot,
    saveProduct,
    saveSupplier,
    receivePO,
    createPO,
    updateSettings,
    setLanguage,
    resetDemo,
    demoUsers: state.users,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function moneyShort(n) {
  return `Ks ${Math.round(n).toLocaleString('en-US')}`
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
