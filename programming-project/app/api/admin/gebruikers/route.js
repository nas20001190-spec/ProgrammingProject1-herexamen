import { NextResponse } from 'next/server'
import db from '@/app/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken, checkRol } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const auth = verifyToken(request)
    if (auth.fout) return NextResponse.json({ fout: auth.fout }, { status: auth.status })

    const rolFout = checkRol(auth.payload, ['admin'])
    if (rolFout) return NextResponse.json({ fout: rolFout.fout }, { status: rolFout.status })

    const [rijen] = await db.query(`
      SELECT u.id, u.voornaam, u.achternaam, u.email, u.telefoon, u.rol, u.created_at
      FROM user u
      WHERE u.rol != 'stagementor'
        OR (
          u.rol = 'stagementor' AND EXISTS (
            SELECT 1 FROM stagementor sm
            JOIN stage s ON s.stagementor_id = sm.id
            WHERE sm.user_id = u.id AND s.status = 'actief'
          )
        )
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json(rijen)

  } catch (error) {
    console.error('Admin gebruikers fout:', error)
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
    const { voornaam, achternaam, email, telefoon, rol, wachtwoord } = body

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [result] = await db.query(
      `INSERT INTO user (voornaam, achternaam, email, wachtwoord_hash, telefoon, rol)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [voornaam, achternaam, email, hash, telefoon, rol]
    )

    // bijbehorende rol-rij aanmaken
    if (rol === 'student') {
      await db.query('INSERT INTO student (user_id) VALUES (?)', [result.insertId])
    } else if (rol === 'docent') {
      await db.query('INSERT INTO docent (user_id) VALUES (?)', [result.insertId])
    }

    return NextResponse.json({ bericht: 'Gebruiker aangemaakt!', id: result.insertId })

  } catch (error) {
    console.error('Gebruiker aanmaken fout:', error)
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

    const [userRijen] = await db.query('SELECT rol FROM user WHERE id = ?', [id])
    if (userRijen.length === 0) return NextResponse.json({ fout: 'Gebruiker niet gevonden' }, { status: 404 })
    const { rol } = userRijen[0]

    await db.query('SET FOREIGN_KEY_CHECKS = 0')

    if (rol === 'student') {
      const [stages] = await db.query(
        'SELECT s.id, s.stagementor_id FROM stage s JOIN student st ON s.student_id = st.id WHERE st.user_id = ?',
        [id]
      )
      for (const stage of stages) {
        await db.query('DELETE FROM overeenkomst WHERE stage_id = ?', [stage.id])
        await db.query('DELETE FROM document WHERE stage_id = ?', [stage.id])
        await db.query('DELETE FROM logboek_week WHERE stage_id = ?', [stage.id])
        await db.query('DELETE FROM evaluatie WHERE stage_id = ?', [stage.id])
        await db.query('DELETE FROM notificatie WHERE stage_id = ?', [stage.id])
        if (stage.stagementor_id) {
          const [smRijen] = await db.query('SELECT user_id, bedrijf_id FROM stagementor WHERE id = ?', [stage.stagementor_id])
          if (smRijen.length > 0) {
            await db.query('DELETE FROM stagementor WHERE id = ?', [stage.stagementor_id])
            await db.query('DELETE FROM user WHERE id = ?', [smRijen[0].user_id])
            await db.query('DELETE FROM bedrijf WHERE id = ?', [smRijen[0].bedrijf_id])
          }
        }
        await db.query('DELETE FROM stage WHERE id = ?', [stage.id])
      }
      await db.query('DELETE FROM student WHERE user_id = ?', [id])

    } else if (rol === 'docent') {
      await db.query('DELETE FROM docent WHERE user_id = ?', [id])

    } else if (rol === 'stagementor') {
      const [smRijen] = await db.query('SELECT id, bedrijf_id FROM stagementor WHERE user_id = ?', [id])
      if (smRijen.length > 0) {
        const { id: smId, bedrijf_id } = smRijen[0]
        await db.query('DELETE FROM overeenkomst WHERE stage_id IN (SELECT id FROM stage WHERE stagementor_id = ?)', [smId])
        await db.query('DELETE FROM stage WHERE stagementor_id = ?', [smId])
        await db.query('DELETE FROM stagementor WHERE id = ?', [smId])
        await db.query('DELETE FROM bedrijf WHERE id = ?', [bedrijf_id])
      }
    }

    await db.query('DELETE FROM user WHERE id = ?', [id])
    await db.query('SET FOREIGN_KEY_CHECKS = 1')

    return NextResponse.json({ bericht: 'Gebruiker verwijderd!' })
  } catch (error) {
    await db.query('SET FOREIGN_KEY_CHECKS = 1')
    console.error('Gebruiker verwijderen fout:', error)
    return NextResponse.json({ fout: error.message }, { status: 500 })
  }
}