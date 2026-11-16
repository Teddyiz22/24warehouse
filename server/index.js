import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { getPool, initDatabase } from './db.js'

const STATE_ID = 'default'
const PORT = Number(process.env.SERVER_PORT || 3001)
const EMPTY_STATE = {
  settings: {
    storeName: '',
    branch: '',
    taxRate: 0,
    currency: 'MMK',
    openHours: '',
    language: 'en',
  },
  users: [],
  products: [],
  categories: [],
  suppliers: [],
  lots: [],
  sales: [],
  purchaseOrders: [],
  activity: [],
  adjustments: [],
}

async function readState() {
  const [rows] = await getPool().query('SELECT data FROM app_state WHERE id = ?', [STATE_ID])
  if (rows[0]) return rows[0].data

  const state = EMPTY_STATE
  await writeState(state)
  return state
}

async function writeState(state) {
  await getPool().query(
    `
      INSERT INTO app_state (id, data)
      VALUES (?, CAST(? AS JSON))
      ON DUPLICATE KEY UPDATE data = VALUES(data)
    `,
    [STATE_ID, JSON.stringify(state)],
  )
}

async function main() {
  await initDatabase()

  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '5mb' }))

  app.get('/api/health', async (_req, res, next) => {
    try {
      await getPool().query('SELECT 1')
      res.json({ ok: true, database: 'mysql' })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/state', async (_req, res, next) => {
    try {
      res.json(await readState())
    } catch (error) {
      next(error)
    }
  })

  app.put('/api/state', async (req, res, next) => {
    try {
      await writeState(req.body)
      res.json({ ok: true })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/reset', async (_req, res, next) => {
    try {
      const state = EMPTY_STATE
      await writeState(state)
      res.json(state)
    } catch (error) {
      next(error)
    }
  })

  app.use((error, _req, res, _next) => {
    console.error(error)
    res.status(500).json({ ok: false, error: error.message })
  })

  app.listen(PORT, () => {
    console.log(`QuickMart API connected to MySQL on http://localhost:${PORT}`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
