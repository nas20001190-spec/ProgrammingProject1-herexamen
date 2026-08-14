import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const [criteria] = await db.query(`
      SELECT id, naam, omschrijving, gewicht FROM presentatie_criterium ORDER BY id ASC
    `)

    const [niveaus] = await db.query(`
      SELECT id, criterium_id, score, score_max, beschrijving 
      FROM presentatie_criterium_niveau 
      ORDER BY criterium_id ASC, score ASC
    `)

    const criteriaMetNiveaus = criteria.map(c => ({
      ...c,
      niveaus: niveaus.filter(n => n.criterium_id === c.id)
    }))

    return NextResponse.json(criteriaMetNiveaus)
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
      'INSERT INTO presentatie_criterium (naam, omschrijving, gewicht) VALUES (?, ?, ?)',
      [naam, omschrijving || null, gewicht || 0]
    )

    return NextResponse.json({ bericht: 'Criterium aangemaakt!', id: result.insertId })
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
      'UPDATE presentatie_criterium SET naam=?, omschrijving=?, gewicht=? WHERE id=?',
      [naam, omschrijving || null, gewicht || 0, id]
    )

    return NextResponse.json({ bericht: 'Criterium bijgewerkt!' })
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

    await db.query('DELETE FROM presentatie_criterium_niveau WHERE criterium_id=?', [id])
    await db.query('DELETE FROM presentatie_criterium WHERE id=?', [id])

    return NextResponse.json({ bericht: 'Criterium verwijderd!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}