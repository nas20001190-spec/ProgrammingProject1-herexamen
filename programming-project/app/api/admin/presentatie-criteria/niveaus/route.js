import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { criterium_id, score, score_max, beschrijving } = body

    const [result] = await db.query(
      'INSERT INTO presentatie_criterium_niveau (criterium_id, score, score_max, beschrijving) VALUES (?, ?, ?, ?)',
      [criterium_id, score, score_max, beschrijving || null]
    )

    return NextResponse.json({ bericht: 'Niveau aangemaakt!', id: result.insertId })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { id, score, score_max, beschrijving } = body

    await db.query(
      'UPDATE presentatie_criterium_niveau SET score=?, score_max=?, beschrijving=? WHERE id=?',
      [score, score_max, beschrijving || null, id]
    )

    return NextResponse.json({ bericht: 'Niveau bijgewerkt!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { id } = body

    await db.query('DELETE FROM presentatie_criterium_niveau WHERE id=?', [id])

    return NextResponse.json({ bericht: 'Niveau verwijderd!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}