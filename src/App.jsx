import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store/StoreContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Products from './pages/Products'
import POS from './pages/POS'
import Receiving from './pages/Receiving'
import Expiry from './pages/Expiry'
import Suppliers from './pages/Suppliers'
import Orders from './pages/Orders'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function Guard({ children }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="products" element={<Products />} />
        <Route path="receiving" element={<Receiving />} />
        <Route path="orders" element={<Orders />} />
        <Route path="expiry" element={<Expiry />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
