import { createSupabaseApi } from './api-supabase'
import { createDemoApi } from './api-demo'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase の設定があれば本番データ、なければブラウザ内のデモデータで動く
export const api = url && key ? createSupabaseApi(url, key) : createDemoApi()
