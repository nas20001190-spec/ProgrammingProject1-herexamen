import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const payload = auth.payload

    const [rijen] = await db.query(`
      SELECT id, type, bericht, gelezen, created_at
      FROM notificatie
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [payload.id])

    return NextResponse.json(rijen)

  } catch (error) {
    console.error('Notificaties fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const payload = auth.payload

    const body = await request.json()
    const { id } = body

    await db.query(
      'UPDATE notificatie SET gelezen = TRUE WHERE id = ? AND user_id = ?',
      [id, payload.id]
    )

    return NextResponse.json({ bericht: 'Notificatie gelezen!' })

  } catch (error) {
    console.error('Notificatie updaten fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}