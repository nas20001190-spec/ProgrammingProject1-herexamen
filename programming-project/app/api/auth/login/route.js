import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import db from '@/app/lib/db'

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request) {
  try {
    const { email, wachtwoord } = await request.json()

    const [rijen] = await db.query(
      'SELECT * FROM user WHERE email = ?',
      [email]
    )

    if (rijen.length === 0) {
      return Response.json(
        { fout: 'Ongeldig e-mailadres of wachtwoord' },
        { status: 401 }
      )
    }

    const gebruiker = rijen[0]

    const wachtwoordKlopt = await bcrypt.compare(wachtwoord, gebruiker.wachtwoord_hash)

    if (!wachtwoordKlopt) {
      return Response.json(
        { fout: 'Ongeldig e-mailadres of wachtwoord' },
        { status: 401 }
      )
    }

    // Stagementor id ophalen
    let stagementor_id = null;
    if (gebruiker.rol === 'stagementor') {
      const [smRijen] = await db.query(
        'SELECT id FROM stagementor WHERE user_id = ?',
        [gebruiker.id]
      );
      if (smRijen.length > 0) {
        stagementor_id = smRijen[0].id;
      }
    }

    const token = jwt.sign(
      {
        id: gebruiker.id,
        email: gebruiker.email,
        rol: gebruiker.rol,
        voornaam: gebruiker.voornaam,
        achternaam: gebruiker.achternaam,
        stagementor_id: stagementor_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return Response.json({ token, rol: gebruiker.rol })

  } catch (error) {
    console.error('Login fout:', error)
    return Response.json(
      { fout: 'Server fout: ' + error.message },
      { status: 500 }
    )
  }
}