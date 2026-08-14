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
        s.id, s.status, s.startdatum, s.einddatum,
        s.aantal_weken, s.uren_per_week,
        s.opdracht_omschrijving, s.feedback_commissie, s.commentaar_student,
        b.naam as bedrijf_naam, b.adres as bedrijf_adres,
        b.sector, b.website, b.telefoon as bedrijf_telefoon,
        mu.voornaam as mentor_voornaam, mu.achternaam as mentor_achternaam,
        mu.email as mentor_email, sm.functie as mentor_functie,
        du.voornaam as docent_voornaam, du.achternaam as docent_achternaam,
        du.email as docent_email
      FROM stage s
      JOIN student st ON s.student_id = st.id
      JOIN stagementor sm ON s.stagementor_id = sm.id
      JOIN user mu ON sm.user_id = mu.id
      JOIN bedrijf b ON sm.bedrijf_id = b.id
      LEFT JOIN docent d ON s.docent_id = d.id
      LEFT JOIN user du ON d.user_id = du.id
      WHERE st.user_id = ?
      ORDER BY s.id DESC
    `, [payload.id])

    return NextResponse.json(rijen)

  } catch (error) {
    console.error('Student stage fout:', error)
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
    const {
      bedrijf_naam, bedrijf_adres, bedrijf_sector, bedrijf_website, bedrijf_telefoon,
      mentor_naam, mentor_functie, mentor_email, mentor_telefoon,
      opdracht_omschrijving, startdatum, einddatum
    } = body

    // aantal_weken en uren_per_week automatisch berekenen
    const start = new Date(startdatum)
    const eind = new Date(einddatum)
    const aantal_weken = Math.round((eind - start) / (7 * 24 * 60 * 60 * 1000))
    const uren_per_week = 40

    const [studentRijen] = await db.query(
      'SELECT id FROM student WHERE user_id = ?',
      [payload.id]
    )
    const student_id = studentRijen[0].id

    const docent_id = null

    const [bedrijfResult] = await db.query(
      'INSERT INTO bedrijf (naam, adres, sector, website, telefoon) VALUES (?, ?, ?, ?, ?)',
      [bedrijf_naam, bedrijf_adres, bedrijf_sector, bedrijf_website, bedrijf_telefoon]
    )
    const bedrijf_id = bedrijfResult.insertId

    const naamDelen = mentor_naam.trim().split(' ')
    const mentor_voornaam = naamDelen[0]
    const mentor_achternaam = naamDelen.slice(1).join(' ') || ''

    const [mentorUserResult] = await db.query(
      'INSERT INTO user (voornaam, achternaam, email, telefoon, rol) VALUES (?, ?, ?, ?, ?)',
      [mentor_voornaam, mentor_achternaam, mentor_email, mentor_telefoon, 'stagementor']
    )
    const mentor_user_id = mentorUserResult.insertId

    const [mentorResult] = await db.query(
      'INSERT INTO stagementor (user_id, bedrijf_id, functie) VALUES (?, ?, ?)',
      [mentor_user_id, bedrijf_id, mentor_functie]
    )
    const stagementor_id = mentorResult.insertId

    await db.query(
      `INSERT INTO stage 
        (student_id, docent_id, stagementor_id, opdracht_omschrijving, startdatum, einddatum, aantal_weken, uren_per_week, status, ingediend_op) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ingediend', NOW())`,
      [student_id, docent_id, stagementor_id, opdracht_omschrijving, startdatum, einddatum, aantal_weken, uren_per_week]
    )

    return NextResponse.json({ bericht: 'Stage ingediend!' })

  } catch (error) {
    console.error('Stage indienen fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}