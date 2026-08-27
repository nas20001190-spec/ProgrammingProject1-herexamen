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
    const { naam, omschrijving } = body
    let gewicht = parseFloat(body.gewicht)

    if (isNaN(gewicht) || gewicht < 0 || gewicht > 100) {
      return NextResponse.json({ fout: 'Gewicht moet tussen 0 en 100 liggen.' }, { status: 400 })
    }

    const [bestaande] = await db.query('SELECT id, gewicht FROM competentie')
    const huidigTotaal = bestaande.reduce((acc, c) => acc + parseFloat(c.gewicht), 0)

    if (huidigTotaal > 0) {
      const doelTotaalAnderen = 100 - gewicht
      const schaal = doelTotaalAnderen / huidigTotaal
      for (const c of bestaande) {
        const nieuwGewicht = Math.max(0, parseFloat(c.gewicht) * schaal)
        await db.query('UPDATE competentie SET gewicht=? WHERE id=?', [
          Math.round(nieuwGewicht * 100) / 100,
          c.id,
        ])
      }
    }

    const [result] = await db.query(
      'INSERT INTO competentie (naam, omschrijving, gewicht) VALUES (?, ?, ?)',
      [naam, omschrijving, gewicht]
    )

    return NextResponse.json({ bericht: 'Competentie aangemaakt! Gewichten van andere competenties zijn herverdeeld.', id: result.insertId })
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
    const { id, naam, omschrijving } = body
    let gewicht = parseFloat(body.gewicht)

    if (isNaN(gewicht) || gewicht < 0 || gewicht > 100) {
      return NextResponse.json({ fout: 'Gewicht moet tussen 0 en 100 liggen.' }, { status: 400 })
    }

    const [anderen] = await db.query('SELECT id, gewicht FROM competentie WHERE id != ?', [id])
    const anderenTotaal = anderen.reduce((acc, c) => acc + parseFloat(c.gewicht), 0)

    if (anderenTotaal > 0) {
      const doelTotaalAnderen = 100 - gewicht
      const schaal = doelTotaalAnderen / anderenTotaal
      for (const c of anderen) {
        const nieuwGewicht = Math.max(0, parseFloat(c.gewicht) * schaal)
        await db.query('UPDATE competentie SET gewicht=? WHERE id=?', [
          Math.round(nieuwGewicht * 100) / 100,
          c.id,
        ])
      }
    }

    await db.query(
      'UPDATE competentie SET naam=?, omschrijving=?, gewicht=? WHERE id=?',
      [naam, omschrijving, gewicht, id]
    )

    return NextResponse.json({ bericht: 'Competentie bijgewerkt! Gewichten van andere competenties zijn herverdeeld.' })
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

    const [overblijvende] = await db.query('SELECT id, gewicht FROM competentie WHERE id != ?', [id])
    const overblijvendTotaal = overblijvende.reduce((acc, c) => acc + parseFloat(c.gewicht), 0)

    await db.query('DELETE FROM competentie WHERE id=?', [id])

    if (overblijvendTotaal > 0) {
      const schaal = 100 / overblijvendTotaal
      for (const c of overblijvende) {
        const nieuwGewicht = Math.min(100, parseFloat(c.gewicht) * schaal)
        await db.query('UPDATE competentie SET gewicht=? WHERE id=?', [
          Math.round(nieuwGewicht * 100) / 100,
          c.id,
        ])
      }
    }

    return NextResponse.json({ bericht: 'Competentie verwijderd! Gewichten van overige competenties zijn herverdeeld.' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}