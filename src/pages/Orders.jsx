import { useState } from 'react'
import { addDays, money, todayKey } from '../lib/format'
import { useStore } from '../store/StoreContext'
import { statusLabel } from '../lib/i18n'

export default function Orders() {
  const { purchaseOrders, suppliers, products, settings, receivePO, createPO, t } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    supplierId: suppliers[0]?.id,
    expected: addDays(new Date(), 2),
    productId: products[0]?.id,
    qty: 24,
    items: [],
  })

  return (
    <div>
      <div className="toolbar">
        <button className="btn" onClick={() => setOpen(true)}>{t.newPo}</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>{t.po}</th>
              <th>{t.supplier}</th>
              <th>{t.expected}</th>
              <th>{t.lines}</th>
              <th>{t.value}</th>
              <th>{t.status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => {
              const value = po.items.reduce((s, i) => s + i.qty * i.cost, 0)
              return (
                <tr key={po.id}>
                  <td className="sku">{po.id}</td>
                  <td>{suppliers.find((s) => s.id === po.supplierId)?.name}</td>
                  <td>{po.expected}</td>
                  <td>{po.items.length}</td>
                  <td>{money(value, settings.currency)}</td>
                  <td><span className={`pill ${po.status}`}>{statusLabel(po.status, t)}</span></td>
                  <td>
                    {po.status !== 'received' && (
                      <button className="btn sm" onClick={() => receivePO(po.id)}>{t.receiveAll}</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>{t.poLines}</h3>
        {purchaseOrders.map((po) => (
          <div key={po.id} style={{ marginBottom: 16 }}>
            <strong>{po.id}</strong>
            {po.items.map((it) => {
              const p = products.find((x) => x.id === it.productId)
              return (
                <div className="list-row" key={it.productId}>
                  <span>{p?.name}</span>
                  <span>{it.qty} x {money(it.cost, settings.currency)}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.createPo}</h3>
            <div className="stack">
              <label>{t.supplier}</label>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <label>{t.expected}</label>
              <input type="date" value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} />
              <label>{t.addLine}</label>
              <div className="row">
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" style={{ width: 90 }} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
                <button
                  className="btn secondary"
                  onClick={() => {
                    const p = products.find((x) => x.id === form.productId)
                    setForm({
                      ...form,
                      items: [...form.items.filter((i) => i.productId !== form.productId), { productId: form.productId, qty: form.qty, cost: p.cost }],
                    })
                  }}
                >
                  {t.add}
                </button>
              </div>
              {form.items.map((i) => (
                <div className="list-row" key={i.productId}>
                  {products.find((p) => p.id === i.productId)?.name} x {i.qty}
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn secondary" onClick={() => setOpen(false)}>{t.cancel}</button>
              <button
                className="btn"
                onClick={() => {
                  if (!form.items.length) return
                  createPO({ supplierId: form.supplierId, items: form.items, expected: form.expected || todayKey() })
                  setOpen(false)
                  setForm({ ...form, items: [] })
                }}
              >
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
