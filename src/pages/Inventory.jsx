import { useMemo, useState } from 'react'
import { money, qty } from '../lib/format'
import ProductPhoto from '../components/ProductPhoto'
import { useStore } from '../store/StoreContext'
import { statusLabel } from '../lib/i18n'

export default function Inventory() {
  const { products, categories, settings, adjustStock, t } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [cat, setCat] = useState('all')
  const [adj, setAdj] = useState(null)

  const rows = useMemo(() => {
    return products.filter((p) => {
      const hay = `${p.name} ${p.sku} ${p.barcode} ${p.location}`.toLowerCase()
      if (q && !hay.includes(q.toLowerCase())) return false
      if (cat !== 'all' && p.categoryId !== cat) return false
      if (filter === 'low' && p.status !== 'low' && p.status !== 'out') return false
      if (filter === 'out' && p.status !== 'out') return false
      if (filter === 'ok' && p.status !== 'ok') return false
      return true
    })
  }, [products, q, filter, cat])

  return (
    <div>
      <div className="toolbar">
        <input className="field" placeholder={t.searchInventory} value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 280 }} />
        <select className="field" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">{t.allCategories}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="filters">
          {[
            ['all', t.all],
            ['low', t.reorder],
            ['out', t.out],
            ['ok', t.healthy],
          ].map(([id, label]) => (
            <button key={id} className={`chip ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.product}</th>
                <th>{t.skuBarcode}</th>
                <th>{t.location}</th>
                <th>{t.onHand}</th>
                <th>{t.min}</th>
                <th>{t.costRetail}</th>
                <th>{t.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="prod">
                      <ProductPhoto product={p} />
                      <div>
                        {p.name}
                        <div className="sku">{categories.find((c) => c.id === p.categoryId)?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="sku">{p.sku}</div>
                    <div className="sku">{p.barcode}</div>
                  </td>
                  <td>{p.location}</td>
                  <td><strong>{qty(p.onHand, p.unit)}</strong></td>
                  <td>{p.reorderPoint}</td>
                  <td>
                    {money(p.cost, settings.currency)}
                    <div className="sku">{money(p.price, settings.currency)}</div>
                  </td>
                  <td><span className={`pill ${p.status}`}>{statusLabel(p.status, t)}</span></td>
                  <td><button className="btn secondary sm" onClick={() => setAdj({ productId: p.id, qty: 0, reason: t.cycleCount })}>{t.adjust}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {adj && (
        <div className="modal-back" onClick={() => setAdj(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.stockAdjustment}</h3>
            <p className="muted">{t.stockAdjustmentHint}</p>
            <div className="stack">
              <label>{t.quantityChange}</label>
              <input type="number" value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: Number(e.target.value) })} />
              <label>{t.reason}</label>
              <select value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })}>
                <option>{t.cycleCount}</option>
                <option>{t.damaged}</option>
                <option>{t.shrink}</option>
                <option>{t.transferIn}</option>
                <option>{t.transferOut}</option>
              </select>
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn secondary" onClick={() => setAdj(null)}>{t.cancel}</button>
              <button
                className="btn"
                onClick={() => {
                  if (!adj.qty) return
                  adjustStock(adj)
                  setAdj(null)
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
