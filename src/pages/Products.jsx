import { useMemo, useState } from 'react'
import { money, uid } from '../lib/format'
import ProductPhoto, { fileToImageDataUrl } from '../components/ProductPhoto'
import { useStore } from '../store/StoreContext'

const empty = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: 'cat_bev',
  price: 0,
  cost: 0,
  reorderPoint: 10,
  location: 'Aisle A1',
  emoji: '📦',
  image: '',
  unit: 'pcs',
  supplierId: '',
}

export default function Products() {
  const { products, categories, suppliers, settings, saveProduct, t } = useStore()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)

  const rows = useMemo(
    () => products.filter((p) => `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q.toLowerCase())),
    [products, q],
  )

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const image = await fileToImageDataUrl(file)
    setForm((prev) => ({ ...prev, image }))
  }

  return (
    <div>
      <div className="toolbar">
        <input className="field" placeholder={t.searchCatalog} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setForm({ ...empty, id: uid('p'), supplierId: suppliers[0]?.id })}>{t.newSku}</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>{t.item}</th>
              <th>{t.category}</th>
              <th>{t.supplier}</th>
              <th>{t.retail}</th>
              <th>{t.cost}</th>
              <th>{t.margin}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0
              return (
                <tr key={p.id}>
                  <td>
                    <div className="prod">
                      <ProductPhoto product={p} />
                      <div>
                        {p.name}
                        <div className="sku">{p.sku} · {p.barcode}</div>
                      </div>
                    </div>
                  </td>
                  <td>{categories.find((c) => c.id === p.categoryId)?.name}</td>
                  <td>{suppliers.find((s) => s.id === p.supplierId)?.name || '—'}</td>
                  <td>{money(p.price, settings.currency)}</td>
                  <td>{money(p.cost, settings.currency)}</td>
                  <td>{margin}%</td>
                  <td><button className="btn secondary sm" onClick={() => setForm({ ...p })}>{t.edit}</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {form && (
        <div className="modal-back" onClick={() => setForm(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              saveProduct({
                ...form,
                price: Number(form.price),
                cost: Number(form.cost),
                reorderPoint: Number(form.reorderPoint),
              })
              setForm(null)
            }}
          >
            <h3>{products.some((p) => p.id === form.id) ? t.editProduct : t.newProduct}</h3>
            <div className="row" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
              <ProductPhoto product={form} size="preview" />
              <div className="stack" style={{ flex: 1 }}>
                <label>{t.productPhoto}</label>
                <input type="file" accept="image/*" onChange={onPickFile} />
                <input
                  placeholder={t.imageUrl}
                  value={form.image?.startsWith('data:') ? '' : (form.image || '')}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <p className="muted">{t.productPhotoHint}</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="span-2">
                <label>{t.name}</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label>SKU</label>
                <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label>{t.barcode}</label>
                <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div>
                <label>{t.category}</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label>{t.supplier}</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label>{t.retailPrice}</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label>{t.cost}</label>
                <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div>
                <label>{t.reorderPoint}</label>
                <input type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
              </div>
              <div>
                <label>{t.location}</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label>{t.unit}</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" className="btn secondary" onClick={() => setForm(null)}>{t.cancel}</button>
              <button className="btn" type="submit">{t.saveSku}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
