'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setFout('')

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, wachtwoord })
    })

    const data = await response.json()

    if (!response.ok) {
      setFout(data.fout)
      return
    }

    // Token opslaan
    document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`
    document.cookie = `rol=${data.rol}; path=/; max-age=86400; SameSite=Strict`

    // Doorsturen op basis van rol
   if (data.rol === 'student') router.push('/student/dashboard-first')
   else if (data.rol === 'docent') router.push('/docent/dashboard')
   else if (data.rol === 'stagementor') router.push('/stagementor/dashboard')
   else router.push('/admin/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2.5rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <svg width="36" height="36" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" rx="20" fill="#1a2340"/>
            <path d="M50 45 A30 30 0 1 0 50 75" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round"/>
            <polyline points="65,68 75,80 95,55" fill="none" stroke="#4ade80" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Competent</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Inloggen</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Gebruik uw e-mailadres en wachtwoord
        </p>

        {/* Foutmelding */}
        {fout && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {fout}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              E-mailadres
            </label>
            <input
              type="email"
              placeholder="uw@email.be"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Wachtwoord
            </label>
            <input
              type="password"
              placeholder="Uw wachtwoord"
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a56db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Inloggen →
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a
            href="#"
            onClick={() => router.push('/authentificator/wachtwoord-vergeten')}
            style={{ color: '#1a56db', fontSize: '0.9rem' }}
          >
            Wachtwoord vergeten
          </a>
        </div>

      </div>
    </div>
  )
}