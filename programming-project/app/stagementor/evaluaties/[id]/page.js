'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Topbar from '../../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function StagementorEvaluatieDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [evaluatie, setEvaluatie] = useState(null)
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    fetchMetAuth(`/api/stagementor/evaluaties/${id}`)
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

  const selecteerScore = (competentie_id, score) => {
    setScores(prev => prev.map(s =>
      s.competentie_id === competentie_id ? { ...s, score_mentor: score } : s
    ))
  }

  const updateFeedback = (competentie_id, waarde) => {
    setScores(prev => prev.map(s =>
      s.competentie_id === competentie_id ? { ...s, feedback_mentor: waarde } : s
    ))
  }

  const handleOpslaan = async () => {
    setFout('')
    setBezig(true)

    const response = await fetchMetAuth('/api/stagementor/evaluaties', {
      method: 'PUT',
      body: JSON.stringify({
        evaluatie_id: parseInt(id),
        scores: scores.map(s => ({
          competentie_id: s.competentie_id,
          score_mentor: s.score_mentor !== null && s.score_mentor !== '' ? parseFloat(s.score_mentor) : null,
          feedback_mentor: s.feedback_mentor || null,
        }))
      })
    })

    if (!response) { setBezig(false); return }
    const data = await response.json()
    if (response.ok) {
      alert('Opgeslagen!')
      router.push('/stagementor/evaluaties')
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
        subtitel={`${evaluatie.student_voornaam} ${evaluatie.student_achternaam} · ${evaluatie.datum ? new Date(evaluatie.datum + 'T12:00:00').toLocaleDateString('nl-BE') : ''}`}
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-4 overflow-y-auto">

        <div className="bg-white rounded-xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Student</p>
              <p className="text-sm font-medium">{evaluatie.student_voornaam} {evaluatie.student_achternaam}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="text-sm font-medium capitalize">{evaluatie.type}</p>
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

        {isVerlopen && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            De deadline is verstreken. Je kan deze evaluatie niet meer aanpassen.
          </div>
        )}

        {evaluatie.algemene_feedback_docent && (
          <div className="bg-white rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">Algemene feedback docent</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{evaluatie.algemene_feedback_docent}</p>
          </div>
        )}

        {/* Scores per competentie met rubriek */}
        <div className="space-y-4">
          {scores.map(s => (
            <div key={s.competentie_id} className="bg-white rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.competentie_naam}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.omschrijving}</p>
                </div>
                {s.score_docent !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Docent score:</span>
                    <span className="text-xs font-semibold text-gray-600">{s.score_docent}</span>
                  </div>
                )}
              </div>

              {s.zelfreflectie_student && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Zelfreflectie student</p>
                  <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{s.zelfreflectie_student}</p>
                </div>
              )}

              {/* Rubriek visueel */}
              {s.rubriek.length > 0 ? (
                <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${s.rubriek.length}, 1fr)` }}>
                  {s.rubriek.map(niveau => {
                    const geselecteerd = parseFloat(s.score_mentor) === parseFloat(niveau.score)
                    return (
                      <button
                        key={niveau.id}
                        type="button"
                        disabled={isVerlopen}
                        onClick={() => selecteerScore(s.competentie_id, niveau.score)}
                        className={`text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          geselecteerd
                            ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#1e3a5f] hover:bg-blue-50'
                        } ${isVerlopen ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <div className={`text-sm font-bold mb-1 ${geselecteerd ? 'text-white' : 'text-[#1e3a5f]'}`}>
                          {niveau.score}/{niveau.score_max}
                        </div>
                        <div className={`text-xs leading-relaxed ${geselecteerd ? 'text-blue-100' : 'text-gray-500'}`}>
                          {niveau.beschrijving}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs text-gray-400">Geen rubriek — geef een score (1-4):</p>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    disabled={isVerlopen}
                    className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 text-center"
                    value={s.score_mentor ?? ''}
                    onChange={e => selecteerScore(s.competentie_id, e.target.value)}
                  />
                </div>
              )}

              {s.score_mentor !== null && s.score_mentor !== '' && (
                <div className="mb-3 text-xs text-gray-500">
                  Geselecteerde score: <span className="font-semibold text-[#1e3a5f]">{s.score_mentor}/4</span>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">Feedback</label>
                <textarea
                  disabled={isVerlopen}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-20 resize-none disabled:bg-gray-50"
                  placeholder="Feedback voor deze competentie..."
                  value={s.feedback_mentor || ''}
                  onChange={e => updateFeedback(s.competentie_id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {fout && <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">{fout}</div>}

        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.push('/stagementor/evaluaties')}
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