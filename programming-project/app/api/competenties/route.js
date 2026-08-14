import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const [rijen] = await db.query(`
      SELECT id, naam, omschrijving, gewicht
      FROM competentie
      ORDER BY id ASC
    `)

    return NextResponse.json(rijen)
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })
    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const body = await request.json()
    const { naam, omschrijving, gewicht } = body

    const [result] = await db.query(
      'INSERT INTO competentie (naam, omschrijving, gewicht) VALUES (?, ?, ?)',
      [naam, omschrijving, gewicht]
    )

    return NextResponse.json({ bericht: 'Competentie aangemaakt!', id: result.insertId })
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
    const { id, naam, omschrijving, gewicht } = body

    await db.query(
      'UPDATE competentie SET naam=?, omschrijving=?, gewicht=? WHERE id=?',
      [naam, omschrijving, gewicht, id]
    )

    return NextResponse.json({ bericht: 'Competentie bijgewerkt!' })
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

    await db.query('DELETE FROM competentie WHERE id=?', [id])

    return NextResponse.json({ bericht: 'Competentie verwijderd!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}