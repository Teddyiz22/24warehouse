import { money } from '../lib/format'
import { useStore } from '../store/StoreContext'

export default function Reports() {
  const { sales, products, categories, settings, adjustments, t } = useStore()

  const revenue = sales.reduce((s, t) => s + t.total, 0)
  const cogs = sales.reduce(
    (s, t) => s + t.items.reduce((x, i) => x + (i.cost || 0) * i.qty, 0),
    0,
  )
  const waste = adjustments
    .filter((a) => a.qty < 0)
    .reduce((s, a) => {
      const p = products.find((x) => x.id === a.productId)
      return s + Math.abs(a.qty) * (p?.cost || 0)
    }, 0)

  const byCat = {}
  sales.forEach((t) => {
    t.items.forEach((i) => {
      const p = products.find((x) => x.id === i.productId)
      if (!p) return
      byCat[p.categoryId] = (byCat[p.categoryId] || 0) + i.price * i.qty
    })
  })

  const tender = sales.reduce(
    (acc, t) => {
      acc[t.tender] = (acc[t.tender] || 0) + t.total
      return acc
    },
    { cash: 0, card: 0 },
  )

  return (
    <div className="grid two-col">
      <div className="card kpi">
        <div className="label">{t.grossSales}</div>
        <div className="value">{money(revenue, settings.currency)}</div>
        <div className="hint">{sales.length} {t.tickets}</div>
      </div>
      <div className="card kpi">
        <div className="label">{t.estimatedMargin}</div>
        <div className="value">{money(revenue - cogs, settings.currency)}</div>
        <div className="hint">{t.cogs} {money(cogs, settings.currency)} · {t.waste} {money(waste, settings.currency)}</div>
      </div>
      <div className="card">
        <h3>{t.salesByCategory}</h3>
        {categories.map((c) => (
          <div className="list-row" key={c.id}>
            <span>{c.name}</span>
            <strong>{money(byCat[c.id] || 0, settings.currency)}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>{t.tenderMix}</h3>
        <div className="list-row"><span>{t.cash}</span><strong>{money(tender.cash, settings.currency)}</strong></div>
        <div className="list-row"><span>{t.card}</span><strong>{money(tender.card, settings.currency)}</strong></div>
        <h3 style={{ marginTop: 20 }}>{t.shrinkWasteEvents}</h3>
        {adjustments.slice(-8).reverse().map((a) => (
          <div className="list-row" key={a.id}>
            <span>{products.find((p) => p.id === a.productId)?.name} · {a.reason}</span>
            <span>{a.qty}</span>
          </div>
        ))}
        {adjustments.length === 0 && <p className="muted">{t.noAdjustments}</p>}
      </div>
    </div>
  )
}
