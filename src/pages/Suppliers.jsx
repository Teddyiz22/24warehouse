import { useState } from 'react'
import { uid } from '../lib/format'
import { useStore } from '../store/StoreContext'

export default function Suppliers() {
  const { suppliers, saveSupplier, t } = useStore()
  const [form, setForm] = useState(null)

  return (
    <div>
      <div className="toolbar">
        <button className="btn" onClick={() => setForm({ id: uid('sup'), name: '', contact: '', leadDays: 3, category: '' })}>
          {t.addSupplier}
        </button>
      </div>
      <div className="grid supplier-grid">
        {suppliers.map((s) => (
          <div className="card" key={s.id}>
            <h3>{s.name}</h3>
            <p className="muted">{s.category}</p>
            <p>{s.contact}</p>
            <p>{t.leadTime}: {s.leadDays} {t.day}</p>
            <button className="btn secondary sm" onClick={() => setForm({ ...s })}>{t.edit}</button>
          </div>
        ))}
      </div>
      {form && (
        <div className="modal-back" onClick={() => setForm(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              saveSupplier({ ...form, leadDays: Number(form.leadDays) })
              setForm(null)
            }}
          >
            <h3>{t.supplier}</h3>
            <div className="stack">
              <label>{t.name}</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label>{t.contact}</label>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              <label>{t.category}</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <label>{t.leadDays}</label>
              <input type="number" value={form.leadDays} onChange={(e) => setForm({ ...form, leadDays: e.target.value })} />
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" className="btn secondary" onClick={() => setForm(null)}>{t.cancel}</button>
              <button className="btn" type="submit">{t.save}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
