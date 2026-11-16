import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { LANGUAGES } from '../lib/i18n'

const NAV = [
  { group: 'Store', items: [
    { to: '/', label: 'navDashboard', end: true },
    { to: '/pos', label: 'navPos' },
  ]},
  { group: 'Warehouse', items: [
    { to: '/inventory', label: 'navInventory' },
    { to: '/receiving', label: 'navReceiving' },
    { to: '/orders', label: 'navOrders' },
    { to: '/expiry', label: 'navExpiry' },
  ]},
  { group: 'Catalog', items: [
    { to: '/products', label: 'navProducts' },
    { to: '/suppliers', label: 'navSuppliers' },
  ]},
  { group: 'Admin', items: [
    { to: '/reports', label: 'navReports' },
    { to: '/settings', label: 'navSettings' },
  ]},
]

const TITLES = {
  '/': ['titleDashboard', 'subDashboard'],
  '/pos': ['titlePos', 'subPos'],
  '/inventory': ['titleInventory', 'subInventory'],
  '/receiving': ['titleReceiving', 'subReceiving'],
  '/orders': ['titleOrders', 'subOrders'],
  '/expiry': ['titleExpiry', 'subExpiry'],
  '/products': ['titleProducts', 'subProducts'],
  '/suppliers': ['titleSuppliers', 'subSuppliers'],
  '/reports': ['titleReports', 'subReports'],
  '/settings': ['titleSettings', 'subSettings'],
}

const GROUP_LABELS = {
  Store: 'navStore',
  Warehouse: 'navWarehouse',
  Catalog: 'navCatalog',
  Admin: 'navAdmin',
}

export default function Layout() {
  const { user, settings, logout, lowStock, expiringLots, language, setLanguage, t } = useStore()
  const loc = useLocation()
  const nav = useNavigate()
  const [titleKey, subKey] = TITLES[loc.pathname] || TITLES['/']

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">Q</div>
          <div>
            <h1>{settings.storeName}</h1>
            <p>{settings.branch}</p>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-label">{t[GROUP_LABELS[g.group]]}</div>
              {g.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  {t[item.label]}
                  {item.to === '/inventory' && lowStock.length > 0 && ` · ${lowStock.length}`}
                  {item.to === '/expiry' && expiringLots.length > 0 && ` · ${expiringLots.length}`}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <h2>{t[titleKey]}</h2>
            <p className="sub">{t[subKey]}</p>
          </div>
          <div className="top-actions">
            <div className="segmented" aria-label={t.language}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  className={language === lang.id ? 'on' : ''}
                  onClick={() => setLanguage(lang.id)}
                  type="button"
                >
                  {lang.short}
                </button>
              ))}
            </div>
            <button className="btn orange sm" onClick={() => nav('/pos')}>{t.openTill}</button>
            <button className="btn secondary sm" onClick={logout}>{t.signOut}</button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
