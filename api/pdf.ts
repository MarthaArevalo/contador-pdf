import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

const KEY = 'counter:pdf' // Clave independiente (NO toca el EPUB)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const action = (req.query.action as string) || 'get'
    const format = (req.query.format as string) || 'json'

    // Contar un "hit" (descarga)
    if (action === 'hit') {
      await kv.incr(KEY)
      res.setHeader('Cache-Control', 'no-store')
      // Para beacons <img>, 204 es ideal
      return res.status(204).end()
    }

    // Obtener valor actual
    const valueRaw = await kv.get<number | string>(KEY)
    const value = Number(valueRaw || 0)

    if (format === 'svg') {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="140" height="40" viewBox="0 0 140 40" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="140" height="40" rx="6" fill="#111"/>
  <text x="12" y="26" font-family="monospace" font-size="18" fill="#0f0">
    PDF: ${value}
  </text>
</svg>`
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).send(svg)
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ value })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
