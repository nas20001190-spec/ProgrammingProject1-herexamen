'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DocentTopbar from '../../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

function fmt(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('nl-BE')
}

const DAGEN_NAMEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']

export default function DocentLogboekDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [logboek, setLogboek] = useState(null)
  const [dagen, setDagen] = useState([])
  const [loading, setLoading] = useState(true)
  const [geselecteerdeDag, setGeselecteerdeDag] = useState(null)

  useEffect(() => {
    fetchMetAuth(`/api/docent/logboeken/${id}`)
      .then(r => r?.json())
      .then(data => {
        if (data?.logboek) setLogboek(data.logboek)
        if (data?.dagen) {
          setDagen(data.dagen)
          if (data.dagen.length > 0) setGeselecteerdeDag(data.dagen[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>
  if (!logboek) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Logboek niet gevonden.</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <DocentTopbar
        titel={`Logboek Week ${logboek.week_nummer}`}
        subtitel={`${logboek.student_voornaam} ${logboek.student_achternaam} · ${fmt(logboek.datum_van)} - ${fmt(logboek.datum_tot)}`}
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Student</p>
              <p className="text-sm font-medium">{logboek.student_voornaam} {logboek.student_achternaam}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Periode</p>
              <p className="text-sm font-medium">{fmt(logboek.datum_van)} – {fmt(logboek.datum_tot)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Totaal uren</p>
              <p className="text-sm font-medium">{logboek.totaal_uren}u</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                logboek.status === 'goedgekeurd' ? 'bg-green-50 text-green-700 border-green-200' :
                logboek.status === 'ingediend' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                {logboek.status === 'goedgekeurd' ? 'Goedgekeurd' :
                 logboek.status === 'ingediend' ? 'Ingediend' : logboek.status}
              </span>
            </div>
          </div>
        </div>

        {dagen.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 mb-3">Dagen</h3>
              {dagen.map((dag) => {
                const dagNaam = DAGEN_NAMEN[new Date(dag.datum + 'T12:00:00').getDay() - 1] || dag.datum
                return (
                  <button
                    key={dag.id}
                    onClick={() => setGeselecteerdeDag(dag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      geselecteerdeDag?.id === dag.id
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{dagNaam}</div>
                    <div className="text-xs opacity-70">{fmt(dag.datum)} · {dag.uren}u</div>
                  </button>
                )
              })}
            </div>

            {geselecteerdeDag && (
              <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  {DAGEN_NAMEN[new Date(geselecteerdeDag.datum + 'T12:00:00').getDay() - 1]} — {fmt(geselecteerdeDag.datum)} · {geselecteerdeDag.uren}u
                </h3>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Uitgevoerde taken</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{geselecteerdeDag.uitgevoerde_taken || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Reflectie</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{geselecteerdeDag.reflectie || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Leerpunten / problemen</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{geselecteerdeDag.leerpunten || '—'}</p>
                </div>
                {geselecteerdeDag.competenties?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Competenties aangetoond</p>
                    <div className="flex flex-wrap gap-2">
                      {geselecteerdeDag.competenties.map(c => (
                        <span key={c.id} className="text-xs px-3 py-1 rounded-full bg-[#eef2ff] text-[#1e3a5f] border border-[#c7d2e8]">
                          {c.naam}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-sm text-gray-400">
            Geen dagverslagen gevonden.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/docent/logboeken')}
            className="px-5 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg font-medium hover:bg-gray-50 cursor-pointer"
          >
            ← Terug
          </button>
        </div>
      </div>
    </div>
  )
}