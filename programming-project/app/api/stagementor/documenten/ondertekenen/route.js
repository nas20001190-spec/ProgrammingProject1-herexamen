import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['stagementor'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const { searchParams } = new URL(request.url)
    const stage_id = searchParams.get('stage_id')

    const [rijen] = await db.query(
      `SELECT signed_student, signed_stagementor, signed_at FROM overeenkomst WHERE stage_id = ?`,
      [stage_id]
    )

    if (rijen.length === 0) return NextResponse.json({ signed_student: 0, signed_stagementor: 0, signed_at: null })

    return NextResponse.json(rijen[0])
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['stagementor'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { stage_id } = body

    const [bestaand] = await db.query(
      `SELECT id FROM overeenkomst WHERE stage_id = ?`,
      [stage_id]
    )

    if (bestaand.length === 0) {
      await db.query(
        `INSERT INTO overeenkomst (stage_id, signed_stagementor, created_at) VALUES (?, 1, NOW())`,
        [stage_id]
      )
    } else {
      await db.query(
        `UPDATE overeenkomst SET signed_stagementor = 1, signed_at = IF(signed_student = 1, NOW(), signed_at) WHERE stage_id = ?`,
        [stage_id]
      )
    }

    return NextResponse.json({ bericht: 'Ondertekend!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}