import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const [rijen] = await db.query(`
      SELECT 
        d.id,
        d.bestandsnaam,
        d.bestandsgrootte_kb,
        d.deadline,
        d.uploaded_op,
        u.voornaam as uploader_voornaam,
        u.achternaam as uploader_achternaam,
        gd.voornaam as goedgekeurd_door_voornaam,
        gd.achternaam as goedgekeurd_door_achternaam
      FROM document d
      JOIN stage s ON d.stage_id = s.id
      JOIN student st ON s.student_id = st.id
      JOIN user u ON d.uploader_id = u.id
      LEFT JOIN user gd ON d.goedgekeurd_door = gd.id
      WHERE st.user_id = ?
      ORDER BY d.uploaded_op DESC
    `, [payload.id])

    return NextResponse.json(rijen)

  } catch (error) {
    console.error('Documenten fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const rolFout = checkRol(auth.payload, ['student'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const payload = auth.payload

    const body = await request.json()
    const { stage_id, bestandsnaam, bestandsgrootte_kb, deadline } = body

    await db.query(
      `INSERT INTO document (stage_id, uploader_id, bestandsnaam, bestandsgrootte_kb, deadline, uploaded_op)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [stage_id, payload.id, bestandsnaam, bestandsgrootte_kb, deadline]
    )

    return NextResponse.json({ bericht: 'Document geüpload!' })

  } catch (error) {
    console.error('Document uploaden fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}