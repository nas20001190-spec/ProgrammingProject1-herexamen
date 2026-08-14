'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Topbar from '../../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function StudentEvaluatieDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [evaluatie, setEvaluatie] = useState(null)
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    fetchMetAuth(`/api/student/evaluaties/${id}`)
      .then(r => r?.json())
      .then(data => {
        if (data && !data.fout) {
          setEvaluatie(data.evaluatie)
          setScores(data.scores)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const updateZelfreflectie = (competentie_id, waarde) => {
    setScores(prev => prev.map(s =>
      s.competentie_id === competentie_id ? { ...s, zelfreflectie_student: waarde } : s
    ))
  }

  const handleOpslaan = async () => {
    setFout('')
    setBezig(true)

    const response = await fetchMetAuth(`/api/student/evaluaties/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        scores: scores.map(s => ({
          competentie_id: s.competentie_id,
          zelfreflectie: s.zelfreflectie_student || null,
        }))
      })
    })

    if (!response) { setBezig(false); return }
    const data = await response.json()
    if (response.ok) {
      alert('Opgeslagen!')
      router.push('/student/evaluaties')
    } else {
      setFout(data.fout || 'Er ging iets mis')
      setBezig(false)
    }
  }

  const isVerlopen = evaluatie?.datum && new Date() > new Date(evaluatie.datum + 'T23:59:59')

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>
  if (!evaluatie) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Evaluatie niet gevonden.</div></div>

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        titel={`Evaluatie — ${evaluatie.type}`}
        subtitel={evaluatie.datum ? new Date(evaluatie.datum + 'T12:00:00').toLocaleDateString('nl-BE') : ''}
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-4 overflow-y-auto">

        <div className="bg-white rounded-xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="text-sm font-medium capitalize">{evaluatie.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="text-sm font-medium">{evaluatie.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Deadline</p>
              <p className={`text-sm font-medium ${isVerlopen ? 'text-red-500' : 'text-gray-800'}`}>
                {evaluatie.datum ? new Date(evaluatie.datum + 'T12:00:00').toLocaleDateString('nl-BE') : '—'}
                {isVerlopen && ' (verlopen)'}
              </p>
            </div>
          </div>
        </div>

        {evaluatie.algemene_feedback_docent && (
          <div className="bg-white rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">Algemene feedback docent</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{evaluatie.algemene_feedback_docent}</p>
          </div>
        )}

        {isVerlopen && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            De deadline is verstreken. Je kan deze evaluatie niet meer aanpassen.
          </div>
        )}

        <div className="space-y-4">
          {scores.map(s => (
            <div key={s.competentie_id} className="bg-white rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">{s.competentie_naam}</p>
              <p className="text-xs text-gray-400 mb-3">{s.omschrijving}</p>

              {(s.score_mentor !== null || s.score_docent !== null) && (
                <div className="flex gap-4 mb-3">
                  {s.score_mentor !== null && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      <span className="text-gray-400">Mentor: </span>
                      <span className="font-semibold text-[#1e3a5f]">{s.score_mentor}/{s.score_max_mentor}</span>
                    </div>
                  )}
                  {s.score_docent !== null && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      <span className="text-gray-400">Docent: </span>
                      <span className="font-semibold text-[#1e3a5f]">{s.score_docent}/{s.score_max_docent}</span>
                    </div>
                  )}
                </div>
              )}

              {s.feedback_mentor && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Feedback mentor</p>
                  <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{s.feedback_mentor}</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">Jouw zelfreflectie</label>
                <textarea
                  disabled={isVerlopen}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none disabled:bg-gray-50"
                  placeholder="Beschrijf jouw vorderingen voor deze competentie..."
                  value={s.zelfreflectie_student || ''}
                  onChange={e => updateZelfreflectie(s.competentie_id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {fout && <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">{fout}</div>}

        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.push('/student/evaluaties')}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Terug
          </button>
          <button
            onClick={handleOpslaan}
            disabled={bezig || isVerlopen}
            className={`px-5 py-2 text-sm rounded-lg font-medium ${
              isVerlopen ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#1e3a5f] text-white cursor-pointer hover:bg-[#162d4a]'
            } disabled:opacity-50`}
          >
            {isVerlopen ? 'Deadline verstreken' : bezig ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>

      </div>
    </div>
  )
}