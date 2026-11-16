import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'

export default function Login() {
  const { user, login, demoUsers, settings, t } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const submit = (e) => {
    e.preventDefault()
    const res = login(email, password)
    if (!res.ok) setError(res.error)
    else nav('/')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <div className="brand-mark">Q</div>
          <p className="muted" style={{ color: '#b7d8cc' }}>{t.loginKicker}</p>
          <h2>{settings.storeName}</h2>
          <p>{t.loginPitch}</p>
          <p style={{ marginTop: 24, color: '#b7d8cc' }}>{settings.branch} · {settings.openHours}</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <h3>{t.staffSignIn}</h3>
          <label>{t.email}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <label>{t.password}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p className="error">{error}</p>}
          <button className="btn" style={{ width: '100%', marginTop: 16 }} type="submit">
            {t.enterDashboard}
          </button>
          <div className="accounts">
            {t.demoAccounts}
            {demoUsers.map((u) => (
              <div key={u.id}>
                {u.role}: {u.email}
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}
