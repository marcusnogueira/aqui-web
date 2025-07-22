import { Pool } from 'pg'
import PostgresAdapter from '@auth/pg-adapter'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_CONNECTION_URI!,
  max: 10,
  idleTimeoutMillis: 30_000,
})

export const adapter = PostgresAdapter(pool)
