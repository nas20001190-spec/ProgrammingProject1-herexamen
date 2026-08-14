'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DocentTopbar from '../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function DocentDashboard() {
  const router = useRouter()
  const [studenten, setStudenten] = useState([])
  const [gebruiker, setGebruiker] = useState(null)
  const [logboekenCount, setLogboekenCount] = useState(0)
  const [evaluatiesCount, setEvaluatiesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) { router.push('/authentificator/login'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setGebruiker(payload)
    } catch {}

    Promise.all([
      fetchMetAuth('/api/docent/studenten').then(r => r?.json()),
      fetchMetAuth('/api/docent/logboeken').then(r => r?.json()),
      fetchMetAuth('/api/docent/evaluaties').then(r => r?.json()),
    ]).then(([studentenData, logboekenData, evaluatiesData]) => {
      setStudenten(studentenData ?? [])
      // logboeken ingediend maar niet goedgekeurd
      const logboeken = Array.isArray(logboekenData) ? logboekenData : []
      setLogboekenCount(logboeken.filter(l => l.status === 'ingediend').length)
      // open evaluaties
      const evaluaties = Array.isArray(evaluatiesData) ? evaluatiesData : []
      setEvaluatiesCount(evaluaties.filter(e => e.status === 'open').length)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const gefilterdeStudenten = studenten.filter(s =>
    `${s.voornaam} ${s.achternaam}`.toLowerCase().includes(zoek.toLowerCase()) ||
    s.bedrijf?.toLowerCase().includes(zoek.toLowerCase())
  )

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <DocentTopbar titel="Dashboard" subtitel="2025-2026 · Erasmushogeschool Brussel" />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">

        <div className="bg-white rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900">Welkom terug, {gebruiker?.voornaam ?? 'Docent'}</h2>
          <p className="text-sm text-gray-400">Je begeleidt momenteel {studenten.length} studenten.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/docent/studenten')}>
            <div className="text-3xl font-bold text-gray-900">{studenten.length}</div>
            <div className="text-xs text-gray-400 mt-1">Actieve studenten</div>
          </div>
          <div className="bg-white rounded-xl p-5 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/docent/logboeken')}>
            <div className="text-3xl font-bold text-gray-900">{logboekenCount}</div>
            <div className="text-xs text-gray-400 mt-1">Nieuwe logboeken</div>
          </div>
          <div className="bg-white rounded-xl p-5 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/docent/evaluaties')}>
            <div className="text-3xl font-bold text-gray-900">{evaluatiesCount}</div>
            <div className="text-xs text-gray-400 mt-1">Open evaluaties</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Studenten</h2>
            <input
              type="text"
              placeholder="Zoek student..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              value={zoek}
              onChange={e => setZoek(e.target.value)}
            />
          </div>
          {gefilterdeStudenten.length === 0 ? (
            <p className="text-sm text-gray-400">Geen studenten gevonden.</p>
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
                {gefilterdeStudenten.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="text-sm text-gray-800 py-3">{s.voornaam} {s.achternaam}</td>
                    <td className="text-sm text-gray-600 py-3">{s.bedrijf_naam || s.bedrijf}</td>
                    <td className="text-sm text-gray-600 py-3">{s.mentor_voornaam} {s.mentor_achternaam}</td>
                    <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{s.status || 'actief'}</span></td>
                    <td className="py-3"><button onClick={() => router.push('/docent/logboeken')} className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer">Bekijken</button></td>
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