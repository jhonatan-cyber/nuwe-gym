import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

await pool.query(`INSERT INTO badges (name, description, icon, requirement, reward_points, sort_order) VALUES
  ('Primer Check-in', 'Realizá tu primer check-in en el gimnasio', '✅', '{"type":"CHECK_IN_COUNT","target":1}', 5, 0),
  ('Constante', 'Acumulá 30 check-ins', '🔥', '{"type":"CHECK_IN_COUNT","target":30}', 20, 1),
  ('Dedicado', 'Acumulá 100 check-ins', '💪', '{"type":"CHECK_IN_COUNT","target":100}', 50, 2),
  ('Primera Compra', 'Realizá tu primera compra en el gym', '🛒', '{"type":"PURCHASE_COUNT","target":1}', 5, 3),
  ('Cliente Frecuente', 'Realizá 10 compras', '🏪', '{"type":"PURCHASE_COUNT","target":10}', 30, 4),
  ('Referidor', 'Referí a tu primer amigo', '👥', '{"type":"REFERRAL_COUNT","target":1}', 15, 5)
ON CONFLICT DO NOTHING`)

await pool.query(`INSERT INTO challenges (name, description, type, target, reward_points, start_date, end_date, is_active) VALUES
  ('Reto del Mes', 'Realizá 20 check-ins este mes y ganá puntos extra', 'CHECK_IN_COUNT', 20, 30,
   DATE_TRUNC('month', CURRENT_DATE),
   DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
   true)
ON CONFLICT DO NOTHING`)

console.log('✅ Badges + challenges seeded')
await pool.end()
