'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Topbar from '../../../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'
import { Plus, Trash2, Check } from 'lucide-react'

export default function RubriekPage() {
  const router = useRouter()
  const { id } = useParams()
  const [competentie, setCompetentie] = useState(null)
  const [mentorNiveaus, setMentorNiveaus] = useState([])
  const [docentNiveaus, setDocentNiveaus] = useState([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [docentScoreMax, setDocentScoreMax] = useState(10)

  useEffect(() => {
    Promise.all([
      fetchMetAuth(`/api/competenties`).then(r => r?.json()),
      fetchMetAuth(`/api/admin/rubriek?competentie_id=${id}`).then(r => r?.json()),
    ]).then(([compData, rubriekData]) => {
      const comp = Array.isArray(compData) ? compData.find(c => c.id === parseInt(id)) : null
      setCompetentie(comp)

      const mentor = rubriekData?.filter(r => r.rol === 'mentor') ?? []
      const docent = rubriekData?.filter(r => r.rol === 'docent') ?? []

      const mentorVolledig = [1, 2, 3, 4].map(score => {
        const bestaand = mentor.find(m => m.score === score)
        return bestaand || { id: null, score, score_max: 4, beschrijving: '', rol: 'mentor', competentie_id: parseInt(id) }
      })
      setMentorNiveaus(mentorVolledig)

      if (docent.length > 0) {
        setDocentScoreMax(docent[0].score_max)
        setDocentNiveaus(docent)
      }

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleMentorBeschrijving = (score, waarde) => {
    setMentorNiveaus(prev => prev.map(n => n.score === score ? { ...n, beschrijving: waarde } : n))
  }

  const handleDocentNiveau = (index, veld, waarde) => {
    setDocentNiveaus(prev => {
      const nieuw = [...prev]
      nieuw[index] = { ...nieuw[index], [veld]: waarde }
      return nieuw
    })
  }

  const voegDocentNiveauToe = () => {
    setDocentNiveaus(prev => [...prev, {
      id: null, score: '', score_max: docentScoreMax,
      beschrijving: '', rol: 'docent', competentie_id: parseInt(id)
    }])
  }

  const verwijderDocentNiveau = async (index) => {
    const niveau = docentNiveaus[index]
    if (niveau.id) {
      await fetchMetAuth('/api/admin/rubriek', {
        method: 'DELETE',
        body: JSON.stringify({ id: niveau.id })
      })
    }
    setDocentNiveaus(prev => prev.filter((_, i) => i !== index))
  }

  const handleOpslaan = async () => {
    setBezig(true)

    for (const n of mentorNiveaus) {
      if (n.id) {
        await fetchMetAuth('/api/admin/rubriek', {
          method: 'PUT',
          body: JSON.stringify({ id: n.id, score: n.score, score_max: 4, beschrijving: n.beschrijving })
        })
      } else if (n.beschrijving) {
        await fetchMetAuth('/api/admin/rubriek', {
          method: 'POST',
          body: JSON.stringify({ competentie_id: parseInt(id), rol: 'mentor', score: n.score, score_max: 4, beschrijving: n.beschrijving })
        })
      }
    }

    for (const n of docentNiveaus) {
      if (!n.score && n.score !== 0) continue
      const scoreMax = parseInt(docentScoreMax)
      if (n.id) {
        await fetchMetAuth('/api/admin/rubriek', {
          method: 'PUT',
          body: JSON.stringify({ id: n.id, score: n.score, score_max: scoreMax, beschrijving: n.beschrijving })
        })
      } else {
        await fetchMetAuth('/api/admin/rubriek', {
          method: 'POST',
          body: JSON.stringify({ competentie_id: parseInt(id), rol: 'docent', score: n.score, score_max: scoreMax, beschrijving: n.beschrijving })
        })
      }
    }

    setBezig(false)
    alert('Rubriek opgeslagen!')
    router.push('/admin/competenties')
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A]'

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-50"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Rubriek" />
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Rubriek — {competentie?.naam}</h2>
            <p className="text-sm text-gray-400">{competentie?.omschrijving}</p>
          </div>
          <button onClick={() => router.push('/admin/competenties')} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
            ← Terug
          </button>
        </div>

        {/* Mentor rubriek */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Rubriek stagementor</h3>
          <p className="text-xs text-gray-400 mb-4">Score van 1 tot 4 — beschrijf wat elke score betekent.</p>
          <div className="space-y-4">
            {mentorNiveaus.map(n => (
              <div key={n.score} className="flex gap-4 items-start">
                <div className="w-16 flex-shrink-0">
                  <div className="text-center bg-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm font-bold">
                    {n.score}/4
                  </div>
                </div>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder={`Beschrijving voor score ${n.score}/4...`}
                  value={n.beschrijving}
                  onChange={e => handleMentorBeschrijving(n.score, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Docent rubriek */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Rubriek docent</h3>
          <p className="text-xs text-gray-400 mb-4">Score configureerbaar — voeg niveaus toe.</p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-gray-500">Score max:</label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2E4A]"
              value={docentScoreMax}
              onChange={e => setDocentScoreMax(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {docentNiveaus.map((n, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-24 flex-shrink-0">
                  <input
                    type="number"
                    min="0"
                    max={docentScoreMax}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1A2E4A]"
                    placeholder="Score"
                    value={n.score}
                    onChange={e => handleDocentNiveau(i, 'score', e.target.value)}
                  />
                  <div className="text-center text-xs text-gray-400 mt-1">/{docentScoreMax}</div>
                </div>
                <textarea
                  className={`${inputClass} resize-none flex-1`}
                  rows={2}
                  placeholder="Beschrijving voor dit niveau..."
                  value={n.beschrijving}
                  onChange={e => handleDocentNiveau(i, 'beschrijving', e.target.value)}
                />
                <button
                  onClick={() => verwijderDocentNiveau(i)}
                  className="text-red-400 hover:text-red-600 mt-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={voegDocentNiveauToe}
            className="mt-4 flex items-center gap-2 text-sm text-[#1e3a5f] hover:underline cursor-pointer"
          >
            <Plus size={16} />
            Niveau toevoegen
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/competenties')}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={handleOpslaan}
            disabled={bezig}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-[#1A2E4A] text-white rounded-lg font-medium hover:bg-[#152438] disabled:opacity-50 cursor-pointer"
          >
            <Check size={16} />
            {bezig ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </main>
  )
}