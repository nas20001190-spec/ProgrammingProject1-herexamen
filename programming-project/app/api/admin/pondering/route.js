import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const [rijen] = await db.query('SELECT * FROM evaluatie_pondering ORDER BY id DESC LIMIT 1')
    return NextResponse.json(rijen[0] ?? { mentor_gewicht: 30, docent_gewicht: 30, presentatie_gewicht: 40 })
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
    const { mentor_gewicht, docent_gewicht, presentatie_gewicht } = body

    if (parseFloat(mentor_gewicht) + parseFloat(docent_gewicht) + parseFloat(presentatie_gewicht) !== 100) {
      return NextResponse.json({ fout: 'Totaal moet 100% zijn' }, { status: 400 })
    }

    await db.query(
      'UPDATE evaluatie_pondering SET mentor_gewicht=?, docent_gewicht=?, presentatie_gewicht=? WHERE id=1',
      [mentor_gewicht, docent_gewicht, presentatie_gewicht]
    )

    return NextResponse.json({ bericht: 'Pondering opgeslagen!' })
  } catch (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}