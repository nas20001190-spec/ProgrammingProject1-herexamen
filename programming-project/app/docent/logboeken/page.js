'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DocentTopbar from '../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function DocentLogboeken() {
  const router = useRouter()
  const [logboeken, setLogboeken] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetAuth('/api/docent/logboeken')
      .then(res => res?.json())
      .then(data => {
        setLogboeken(data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('nl-BE')
  }

  // groepeer per student
  const perStudent = logboeken.reduce((acc, l) => {
    const naam = `${l.student_voornaam} ${l.student_achternaam}`
    if (!acc[naam]) acc[naam] = []
    acc[naam].push(l)
    return acc
  }, {})

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <DocentTopbar titel="Logboeken" subtitel="2025-2026 · Erasmushogeschool Brussel" />
      <div className="flex-1 bg-gray-100 p-6 space-y-6">

        {Object.keys(perStudent).length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">Geen logboeken gevonden.</p>
          </div>
        ) : (
          Object.entries(perStudent).map(([naam, weken]) => (
            <div key={naam}>
              <p className="text-xs font-semibold text-gray-400 mb-2">{naam}</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {weken.map((l, i) => (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between px-5 py-4 ${
                      i < weken.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Week {l.week_nummer}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(l.datum_van)} – {fmt(l.datum_tot)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="text-xs text-gray-500">{l.totaal_uren}u gelogd</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                        l.status === 'goedgekeurd' ? 'bg-green-50 text-green-700 border-green-200' :
                        l.status === 'ingediend' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        l.status === 'volledig' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {l.status === 'goedgekeurd' ? 'Goedgekeurd' :
                         l.status === 'ingediend' ? 'Ingediend' :
                         l.status === 'volledig' ? 'Volledig' : 'Onvolledig'}
                      </span>
                      <button
                        onClick={() => router.push(`/docent/logboeken/${l.id}`)}
                        className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer"
                      >
                        Bekijken
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}   