import { formatDate } from '../lib/format'
import ProductPhoto from '../components/ProductPhoto'
import { useStore } from '../store/StoreContext'

export default function Expiry() {
  const { lots, products, writeOffLot, t } = useStore()
  const rows = [...lots]
    .filter((l) => l.remaining > 0)
    .map((l) => {
      const days = Math.round((new Date(l.expiry) - new Date(new Date().toDateString())) / 86400000)
      return { ...l, days, product: products.find((p) => p.id === l.productId) }
    })
    .sort((a, b) => a.days - b.days)

  return (
    <div className="card">
      <h3>{t.lotExpiry}</h3>
      <p className="muted">{t.expiryHint}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.product}</th>
              <th>{t.lot}</th>
              <th>{t.location}</th>
              <th>{t.remaining}</th>
              <th>{t.expiry}</th>
              <th>{t.days}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td>
                  <div className="prod">
                    <ProductPhoto product={l.product} />
                    {l.product?.name}
                  </div>
                </td>
                <td className="sku">{l.id}</td>
                <td>{l.location}</td>
                <td>{l.remaining}</td>
                <td>{formatDate(l.expiry)}</td>
                <td>
                  <span className={`pill ${l.days < 0 ? 'out' : l.days <= 3 ? 'expiring' : 'ok'}`}>
                    {l.days < 0 ? `${Math.abs(l.days)} ${t.overdue}` : `${l.days}${t.days === 'Days' ? 'd' : ' ရက်'}`}
                  </span>
                </td>
                <td>
                  <button className="btn danger sm" onClick={() => writeOffLot(l.id, l.days < 0 ? t.expired : t.nearDateWaste)}>
                    {t.writeOff}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
