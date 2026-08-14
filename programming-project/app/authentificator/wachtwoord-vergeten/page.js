'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFout('')

    if (!email) {
      setFout('Vul uw e-mailadres in!')
      return
    }

    setBezig(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFout(data.fout)
        setBezig(false)
        return
      }

      router.push(`/authentificator/first-time?email=${encodeURIComponent(email)}`)
    } catch (error) {
      setFout('Er is een fout opgetreden. Probeer opnieuw.')
      setBezig(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2.5rem',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <svg width="36" height="36" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" rx="20" fill="#1a2340" />
            <path d="M50 45 A30 30 0 1 0 50 75" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" />
            <polyline points="65,68 75,80 95,55" fill="none" stroke="#4ade80" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Competent</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          Nieuw wachtwoord
        </h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Geef uw e-mailadres om een mail te krijgen
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
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
                boxSizing: 'border-box',
              }}
            />
          </div>

          {fout && (
            <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {fout}
            </div>
          )}

          <button
            type="submit"
            disabled={bezig}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a56db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: bezig ? 'not-allowed' : 'pointer',
              opacity: bezig ? 0.6 : 1,
            }}
          >
            {bezig ? 'Bezig...' : 'nieuw wachtwoord krijgen'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          
          <a href="#"
            onClick={(e) => {
              e.preventDefault()
              router.push('/authentificator/login')
            }}
            style={{ color: '#1a56db', fontSize: '0.9rem' }}
          >
            terug naar login
          </a>
        </div>
      </div>
    </div>
  )
}