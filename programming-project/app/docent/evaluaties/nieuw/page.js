'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DocentTopbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function NieuweEvaluatiePage() {
  const router = useRouter()
  const [studenten, setStudenten] = useState([])
  const [competenties, setCompetenties] = useState([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  const [form, setForm] = useState({
    stage_id: '',
    datum: '',
    type: 'tussentijds',
    feedback: '',
    scores: {},
  })

  useEffect(() => {
    Promise.all([
      fetchMetAuth('/api/docent/studenten').then(r => r?.json()),
      fetchMetAuth('/api/competenties').then(r => r?.json()),
    ]).then(([studentenData, competentieData]) => {
      setStudenten(studentenData ?? [])
      setCompetenties(competentieData ?? [])
      const initScores = {}
      competentieData?.forEach(c => { initScores[c.id] = '' })
      setForm(prev => ({ ...prev, scores: initScores }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const isFinaal = form.type === 'finaal'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFout('')

    if (!form.stage_id) {
      setFout('Selecteer een student!')
      return
    }
    if (!isFinaal && !form.datum) {
      setFout('Vul een deadline in!')
      return
    }

    setBezig(true)

    const response = await fetchMetAuth('/api/docent/evaluaties', {
      method: 'POST',
      body: JSON.stringify({
        stage_id: parseInt(form.stage_id),
        type: form.type,
        datum: isFinaal ? null : form.datum,
        feedback: form.feedback,
      })
    })

    if (!response) { setBezig(false); return }
    const data = await response.json()

    if (!response.ok) {
      setFout(data.fout)
      setBezig(false)
      return
    }

    const evaluatie_id = data.id

    if (!isFinaal) {
      const scoresArray = competenties.map(c => ({
        competentie_id: c.id,
        score_docent: form.scores[c.id] !== '' ? parseFloat(form.scores[c.id]) : null,
      }))

      await fetchMetAuth('/api/docent/evaluaties', {
        method: 'PUT',
        body: JSON.stringify({
          evaluatie_id,
          algemene_feedback: form.feedback,
          scores: scoresArray,
        })
      })
    }

    router.push(`/docent/evaluaties/${evaluatie_id}`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <DocentTopbar titel="Nieuwe Evaluatie" subtitel="Evaluatie aanmaken voor een student" />
      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Evaluatie gegevens</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Student *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.stage_id}
                  onChange={e => setForm({...form, stage_id: e.target.value})}
                >
                  <option value="">Selecteer student</option>
                  {studenten.map(s => (
                    <option key={s.stage_id} value={s.stage_id}>
                      {s.voornaam} {s.achternaam} — {s.bedrijf_naam}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="tussentijds">Tussentijds</option>
                  <option value="finaal">Finaal</option>
                </select>
              </div>
              {!isFinaal && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Deadline *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    value={form.datum}
                    onChange={e => setForm({...form, datum: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">Na deze datum kan de evaluatie niet meer worden aangepast.</p>
                </div>
              )}
              {isFinaal && (
                <div className="flex items-center">
                  <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 w-full">
                    Finale evaluatie — geen deadline. De presentatiedatum wordt later ingesteld.
                  </p>
                </div>
              )}
            </div>
          </div>

          {!isFinaal && (
            <>
              <div className="bg-white rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">Score per competentie</h2>
                <p className="text-xs text-gray-400 mb-4">Geef een score van 0 tot 10 per competentie.</p>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-600 pb-3">Competentie</th>
                      <th className="text-center text-xs font-semibold text-gray-600 pb-3 w-28">Score (0-10)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competenties.map(c => (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="text-sm text-gray-700 py-3 pr-4">
                          <span className="font-medium text-[#1e3a5f]">{c.naam.split('.')[0]}.</span> {c.naam.split('.').slice(1).join('.').trim() || c.naam}
                        </td>
                        <td className="py-3 w-28">
                          <input
                            type="number" min="0" max="10" step="0.5"
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 text-center"
                            placeholder="0-10"
                            value={form.scores[c.id] ?? ''}
                            onChange={e => setForm({ ...form, scores: { ...form.scores, [c.id]: e.target.value } })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">Algemene feedback</h2>
                <p className="text-xs text-gray-400 mb-3">Jouw algemene feedback voor de student.</p>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-32 resize-none"
                  placeholder="Algemene feedback voor de student..."
                  value={form.feedback}
                  onChange={e => setForm({...form, feedback: e.target.value})}
                />
              </div>
            </>
          )}

          {isFinaal && (
            <div className="bg-white rounded-xl p-5">
              <p className="text-sm text-gray-500">Na het aanmaken kan je de eindpresentatie scores en algemene feedback invullen.</p>
            </div>
          )}

          {fout && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">{fout}</div>
          )}

          <div className="flex gap-3 pb-6">
            <button
              type="button"
              onClick={() => router.push('/docent/evaluaties')}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={bezig}
              className="px-5 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#162d4a] cursor-pointer font-medium disabled:opacity-50"
            >
              {bezig ? 'Bezig...' : 'Evaluatie aanmaken'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}