'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function CommissieDashboard() {
  const router = useRouter()
  const [stages, setStages] = useState([])
  const [gebruiker, setGebruiker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) { router.push('/authentificator/login'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setGebruiker(payload)
    } catch {}

    fetchMetAuth('/api/commissie/stages')
      .then(r => r?.json())
      .then(data => {
        setStages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const teBeoordelen = stages.filter(s => s.status === 'ingediend')

  const gefilterd = teBeoordelen.filter(s =>
    `${s.student_voornaam} ${s.student_achternaam}`.toLowerCase().includes(zoek.toLowerCase()) ||
    s.bedrijf_naam?.toLowerCase().includes(zoek.toLowerCase())
  )

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Dashboard" subtitle="2025-2026 · Erasmushogeschool Brussel" />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">

        <div className="bg-white rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900">Welkom terug, {gebruiker?.voornaam ?? 'Commissielid'}</h2>
          <p className="text-sm text-gray-400">Er {teBeoordelen.length === 1 ? 'staat' : 'staan'} {teBeoordelen.length} stageaanvragen te beoordelen.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl p-5 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/commissie/stage')}>
            <div className="text-3xl font-bold text-gray-900">{teBeoordelen.length}</div>
            <div className="text-xs text-gray-400 mt-1">Te beoordelen aanvragen</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Aanvragen te beoordelen</h2>
            <input
              type="text"
              placeholder="Zoek student..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              value={zoek}
              onChange={e => setZoek(e.target.value)}
            />
          </div>
          {gefilterd.length === 0 ? (
            <p className="text-sm text-gray-400">Geen aanvragen gevonden.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Bedrijf</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Mentor</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Actie</th>
                </tr>
              </thead>
              <tbody>
                {gefilterd.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="text-sm text-gray-800 py-3">{s.student_voornaam} {s.student_achternaam}</td>
                    <td className="text-sm text-gray-600 py-3">{s.bedrijf_naam}</td>
                    <td className="text-sm text-gray-600 py-3">{s.mentor_voornaam} {s.mentor_achternaam}</td>
                    <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{s.status}</span></td>
                    <td className="py-3"><button onClick={() => router.push(`/commissie/stage/${s.id}`)} className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer">Beoordelen</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}