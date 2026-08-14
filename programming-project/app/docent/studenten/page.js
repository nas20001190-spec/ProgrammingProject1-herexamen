'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DocentTopbar from '../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function DocentStudenten() {
  const router = useRouter()
  const [studenten, setStudenten] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')

  useEffect(() => {
    fetchMetAuth('/api/docent/studenten')
      .then(res => res?.json())
      .then(data => {
        setStudenten(data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const gefilterdeStudenten = studenten.filter(s =>
    `${s.voornaam} ${s.achternaam}`.toLowerCase().includes(zoekterm.toLowerCase())
  )

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <DocentTopbar titel="Studenten" subtitel="2025-2026 · Erasmushogeschool Brussel" />
      <div className="flex-1 bg-gray-100 p-6">
        <div className="bg-white rounded-xl p-5 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{studenten.length} Studenten</h2>
          <p className="text-sm text-gray-400">Bekijk contactgegevens, stagebedrijven, mentoren en stage-informatie.</p>
        </div>
        <div className="bg-white rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Studentenlijst</h2>
            <input type="text" placeholder="Zoek student..." value={zoekterm} onChange={e => setZoekterm(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          {gefilterdeStudenten.length === 0 ? (
            <p className="text-sm text-gray-400">Geen studenten gevonden.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">E-mail</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Telefoon</th>
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
                    <td className="text-sm text-gray-600 py-3">{s.email}</td>
                    <td className="text-sm text-gray-600 py-3">{s.telefoon}</td>
                    <td className="text-sm text-gray-600 py-3">{s.bedrijf}</td>
                    <td className="text-sm text-gray-600 py-3">{s.mentor_voornaam} {s.mentor_achternaam}</td>
                    <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{s.status}</span></td>
                    <td className="py-3"><button className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer">Bekijken</button></td>
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