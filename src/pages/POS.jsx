import { useMemo, useState } from 'react'
import { money } from '../lib/format'
import ProductPhoto from '../components/ProductPhoto'
import { useStore } from '../store/StoreContext'

export default function POS() {
  const { products, settings, checkout, t } = useStore()
  const [q, setQ] = useState('')
  const [cart, setCart] = useState([])
  const [done, setDone] = useState(null)

  const catalog = useMemo(() => {
    const s = q.toLowerCase()
    return products.filter((p) => `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(s) && p.onHand > 0)
  }, [products, q])

  const add = (p) => {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.productId === p.id)
      if (i >= 0) {
        const next = [...prev]
        const max = p.onHand
        next[i] = { ...next[i], qty: Math.min(max, next[i].qty + 1) }
        return next
      }
      return [...prev, { productId: p.id, name: p.name, emoji: p.emoji, image: p.image, qty: 1, price: p.price, cost: p.cost, onHand: p.onHand }]
    })
  }

  const setQty = (id, qty) => {
    setCart((prev) => prev.map((x) => (x.productId === id ? { ...x, qty: Math.max(1, Math.min(x.onHand, qty)) } : x)).filter((x) => x.qty > 0))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = Math.round(subtotal * settings.taxRate)
  const total = subtotal + tax

  const pay = (tender) => {
    if (!cart.length) return
    checkout({ items: cart, tender })
    setDone({ total, tender })
    setCart([])
  }

  return (
    <div className="pos">
      <div>
        <div className="toolbar">
          <input
            className="field"
            style={{ minWidth: 320 }}
            placeholder={t.scanSearch}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && catalog[0]) add(catalog[0])
            }}
          />
        </div>
        <div className="catalog">
          {catalog.slice(0, 18).map((p) => (
            <button key={p.id} className="tile" onClick={() => add(p)}>
              <ProductPhoto product={p} size="lg" />
              <div style={{ fontWeight: 600, marginTop: 8 }}>{p.name}</div>
              <div className="sku">{p.onHand} {t.inStock}</div>
              <div className="price">{money(p.price, settings.currency)}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>{t.currentTicket}</h3>
        <div className="cart-lines">
          {cart.length === 0 && <p className="muted">{t.startTicket}</p>}
          {cart.map((i) => (
            <div className="list-row" key={i.productId}>
              <div className="prod">
                <ProductPhoto product={i} src={i.image} alt={i.name} />
                <div>
                  {i.name}
                  <div className="sku">{money(i.price, settings.currency)} {t.each}</div>
                </div>
              </div>
              <div className="row">
                <button className="btn secondary sm" onClick={() => setQty(i.productId, i.qty - 1)}>-</button>
                <strong>{i.qty}</strong>
                <button className="btn secondary sm" onClick={() => setQty(i.productId, i.qty + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="list-row"><span>{t.subtotal}</span><span>{money(subtotal, settings.currency)}</span></div>
        <div className="list-row"><span>{t.vat} {Math.round(settings.taxRate * 100)}%</span><span>{money(tax, settings.currency)}</span></div>
        <div className="total-box">
          <div className="muted" style={{ color: '#b7d8cc' }}>{t.amountDue}</div>
          <div className="pay">{money(total, settings.currency)}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn orange" style={{ flex: 1 }} onClick={() => pay('cash')} disabled={!cart.length}>{t.cash}</button>
            <button className="btn" style={{ flex: 1, background: '#1d6fbf' }} onClick={() => pay('card')} disabled={!cart.length}>{t.card}</button>
          </div>
          <button className="btn ghost" style={{ color: '#ccc', width: '100%' }} onClick={() => setCart([])}>{t.clearTicket}</button>
        </div>
      </div>
      {done && (
        <div className="modal-back" onClick={() => setDone(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.saleComplete}</h3>
            <p>{t.paidBy} {done.tender === 'cash' ? t.cash : t.card}</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{money(done.total, settings.currency)}</p>
            <button className="btn" onClick={() => setDone(null)}>{t.nextCustomer}</button>
          </div>
        </div>
      )}
    </div>
  )
}
