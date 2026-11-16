import { useState } from 'react'
import { addDays, todayKey } from '../lib/format'
import { useStore } from '../store/StoreContext'

export default function Receiving() {
  const { products, receiveStock, t } = useStore()
  const [form, setForm] = useState({
    productId: products[0]?.id || '',
    qty: 24,
    expiry: addDays(new Date(), 60),
    location: '',
    cost: products[0]?.cost || 0,
  })
  const [ok, setOk] = useState('')

  const product = products.find((p) => p.id === form.productId)

  return (
    <div className="grid two-col">
      <div className="card">
        <h3>{t.putAwayReceiving}</h3>
        <p className="muted">{t.receivingHint}</p>
        <div className="stack">
          <label>{t.product}</label>
          <select
            value={form.productId}
            onChange={(e) => {
              const p = products.find((x) => x.id === e.target.value)
              setForm({
                ...form,
                productId: e.target.value,
                cost: p?.cost || 0,
                location: p?.location || '',
              })
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
            ))}
          </select>
          <label>{t.quantity}</label>
          <input type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <label>{t.expiry}</label>
          <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
          <label>{t.location}</label>
          <input placeholder={product?.location} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label>{t.unitCost}</label>
          <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
        </div>
        <button
          className="btn"
          style={{ marginTop: 16 }}
          onClick={() => {
            if (!form.qty) return
            receiveStock({
              ...form,
              location: form.location || product?.location,
            })
            setOk(`${t.received} ${form.qty} x ${product?.name} ${t.into} ${form.location || product?.location}`)
          }}
        >
          {t.confirmReceive}
        </button>
        {ok && <p className="muted">{ok}</p>}
      </div>
      <div className="card">
        <h3>{t.putAwayTips}</h3>
        <p>{t.tipsText}</p>
        <p className="muted">{t.receivedToday}: {todayKey()}</p>
        <ul>
          <li>{t.tipScan}</li>
          <li>{t.tipFefo}</li>
          <li>{t.tipHot}</li>
        </ul>
      </div>
    </div>
  )
}
