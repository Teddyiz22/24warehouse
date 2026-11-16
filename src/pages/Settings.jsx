import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import { LANGUAGES } from '../lib/i18n'

export default function Settings() {
  const { settings, updateSettings, resetDemo, user, t, dbStatus } = useStore()
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

  return (
    <div className="grid two-col">
      <div className="card">
        <h3>{t.branchProfile}</h3>
        <div className="stack">
          <label>{t.storeName}</label>
          <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
          <label>{t.branch}</label>
          <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          <label>{t.hours}</label>
          <input value={form.openHours} onChange={(e) => setForm({ ...form, openHours: e.target.value })} />
          <label>{t.vatRate}</label>
          <input
            type="number"
            step="0.01"
            value={form.taxRate}
            onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
          />
          <label>{t.language}</label>
          <select value={form.language || 'en'} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.label}</option>
            ))}
          </select>
        </div>
        <button
          className="btn"
          style={{ marginTop: 16 }}
          onClick={() => {
            updateSettings(form)
            setSaved(true)
          }}
        >
          {t.saveSettings}
        </button>
        {saved && <p className="muted">{t.savedDevice}</p>}
      </div>
      <div className="card">
        <h3>{t.session}</h3>
        <p>{t.signedInAs} {user.name} ({user.role})</p>
        <p className="muted">{t.localDataHint}</p>
        <p>
          <b>{t.database}:</b>{' '}
          {dbStatus.saving ? t.mysqlSaving : dbStatus.connected ? t.mysqlConnected : t.mysqlOffline}
        </p>
        {dbStatus.error && <p className="error">{dbStatus.error}</p>}
        <button className="btn danger" onClick={resetDemo}>{t.resetDemo}</button>
      </div>
    </div>
  )
}
