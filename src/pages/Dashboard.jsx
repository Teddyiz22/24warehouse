import { Link } from 'react-router-dom'
import { formatDateTime, money } from '../lib/format'
import ProductPhoto from '../components/ProductPhoto'
import { useStore } from '../store/StoreContext'

export default function Dashboard() {
  const {
    salesToday,
    ticketsToday,
    unitsToday,
    stockValue,
    retailValue,
    lowStock,
    expiringLots,
    weekSeries,
    topProducts,
    catSales,
    categories,
    activity,
    settings,
    todaysSales,
    t,
  } = useStore()

  const maxBar = Math.max(...weekSeries.map((d) => d.total), 1)
  const catEntries = Object.entries(catSales)
    .map(([id, amount]) => ({ cat: categories.find((c) => c.id === id), amount }))
    .filter((x) => x.cat)
    .sort((a, b) => b.amount - a.amount)

  const avgTicket = ticketsToday ? salesToday / ticketsToday : 0

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid kpi-row">
        <div className="card kpi">
          <div className="label">{t.todaysSales}</div>
          <div className="value">{money(salesToday, settings.currency)}</div>
          <div className="hint">{ticketsToday} {t.tickets} · {unitsToday} {t.units} · {t.avg} {money(avgTicket, settings.currency)}</div>
        </div>
        <div className="card kpi">
          <div className="label">{t.stockAtCost}</div>
          <div className="value">{money(stockValue, settings.currency)}</div>
          <div className="hint">{t.retailValue} {money(retailValue, settings.currency)}</div>
        </div>
        <div className="card kpi alert">
          <div className="label">{t.reorderNow}</div>
          <div className="value">{lowStock.length}</div>
          <div className="hint"><Link to="/inventory">{t.skusBelowMin}</Link></div>
        </div>
        <div className="card kpi warn">
          <div className="label">{t.nearDate}</div>
          <div className="value">{expiringLots.length}</div>
          <div className="hint"><Link to="/expiry">{t.markdownLots}</Link></div>
        </div>
      </div>

      <div className="grid two-col">
        <div className="card">
          <h3>{t.salesLast7}</h3>
          <div className="bars">
            {weekSeries.map((d) => (
              <div className="bar-col" key={d.date}>
                <div className="bar" style={{ height: `${Math.max(8, (d.total / maxBar) * 100)}%` }} title={money(d.total, settings.currency)} />
                <span>{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>{t.topMovers}</h3>
          {topProducts.map((row) => (
            <div className="list-row" key={row.product.id}>
              <div className="prod">
                <ProductPhoto product={row.product} />
                <div>
                  {row.product.name}
                  <div className="sku">{row.product.sku}</div>
                </div>
              </div>
              <strong>{row.qty} {t.sold}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="grid three-col">
        <div className="card">
          <h3>{t.categoryMix}</h3>
          {catEntries.length === 0 && <p className="muted">{t.noSalesToday}</p>}
          {catEntries.map((row) => (
            <div className="list-row" key={row.cat.id}>
              <span>{row.cat.name}</span>
              <strong>{money(row.amount, settings.currency)}</strong>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>{t.criticalStock}</h3>
          {lowStock.slice(0, 6).map((p) => (
            <div className="list-row" key={p.id}>
              <div>
                {p.name}
                <div className="sku">{p.location}</div>
              </div>
              <span className={`pill ${p.status}`}>{p.onHand} / {p.reorderPoint}</span>
            </div>
          ))}
          {lowStock.length === 0 && <p className="muted">{t.allHealthy}</p>}
        </div>
        <div className="card activity">
          <h3>{t.storeFeed}</h3>
          {activity.slice(0, 6).map((a) => (
            <div className="list-row" key={a.id} style={{ alignItems: 'flex-start' }}>
              <div className="row">
                <div className="dot" />
                <div>
                  {a.text}
                  <div className="muted">{formatDateTime(a.at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>{t.latestTickets}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.time}</th>
                <th>{t.ticket}</th>
                <th>{t.cashier}</th>
                <th>{t.tender}</th>
                <th className="right">{t.total}</th>
              </tr>
            </thead>
            <tbody>
              {[...todaysSales].reverse().slice(0, 8).map((s) => (
                <tr key={s.id}>
                  <td>{formatDateTime(s.at)}</td>
                  <td className="sku">{s.id}</td>
                  <td>{s.cashier}</td>
                  <td>{s.tender}</td>
                  <td className="right">{money(s.total, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
