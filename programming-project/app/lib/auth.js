import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export function verifyToken(request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { fout: 'Geen token', status: 401 }
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return { payload }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { fout: 'Token verlopen, log opnieuw in', status: 401 }
    }
    return { fout: 'Ongeldige token', status: 401 }
  }
}

export function checkRol(payload, toegestaneRollen) {
  if (!toegestaneRollen.includes(payload.rol)) {
    return { fout: 'Geen toegang', status: 403 }
  }
  return null
}