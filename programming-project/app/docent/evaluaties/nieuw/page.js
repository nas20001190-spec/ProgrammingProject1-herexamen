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
  const [geselecteerdeStudenten, setGeselecteerdeStudenten] = useState([])

  const [form, setForm] = useState({
    datum: '',
    type: 'tussentijds',
  })

  useEffect(() => {
    Promise.all([
      fetchMetAuth('/api/docent/studenten').then(r => r?.json()),
      fetchMetAuth('/api/competenties').then(r => r?.json()),
    ]).then(([studentenData, competentieData]) => {
      setStudenten(studentenData ?? [])
      setCompetenties(competentieData ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const isFinaal = form.type === 'finaal'

  const competentieLabel = (c) => {
    const dNummer = c.naam?.split(' ')[0] || ''
    return `${dNummer} — ${c.omschrijving || c.naam}`
  }

  const alleGeselecteerd = studenten.length > 0 && geselecteerdeStudenten.length === studenten.length

  const toggleStudent = (stage_id) => {
    setGeselecteerdeStudenten(prev =>
      prev.includes(stage_id) ? prev.filter(id => id !== stage_id) : [...prev, stage_id]
    )
  }

  const toggleAlle = () => {
    setGeselecteerdeStudenten(alleGeselecteerd ? [] : studenten.map(s => s.stage_id))
  }

  const maakEvaluatieAan = async (stage_id) => {
    return fetchMetAuth('/api/docent/evaluaties', {
      method: 'POST',
      body: JSON.stringify({
        stage_id: parseInt(stage_id),
        type: form.type,
        datum: isFinaal ? null : form.datum,
        feedback: '',
      })
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFout('')

    if (!isFinaal && !form.datum) {
      setFout('Vul een deadline in!')
      return
    }

    if (geselecteerdeStudenten.length === 0) {
      setFout('Selecteer minstens één student!')
      return
    }

    if (geselecteerdeStudenten.length === 1) {
      setBezig(true)
      const response = await maakEvaluatieAan(geselecteerdeStudenten[0])
      if (!response) { setBezig(false); return }
      const data = await response.json()
      if (!response.ok) {
        setFout(data.fout)
        setBezig(false)
        return
      }
      router.push(`/docent/evaluaties/${data.id}`)
      return
    }

    if (!window.confirm(`Evaluatie aanmaken voor ${geselecteerdeStudenten.length} studenten?`)) return

    setBezig(true)
    let gelukt = 0
    let mislukt = 0
    for (const stage_id of geselecteerdeStudenten) {
      const response = await maakEvaluatieAan(stage_id)
      if (response?.ok) gelukt++
      else mislukt++
    }
    setBezig(false)
    alert(`${gelukt} evaluatie(s) aangemaakt${mislukt > 0 ? `, ${mislukt} mislukt` : ''}.`)
    router.push('/docent/evaluaties')
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
      <DocentTopbar titel="Nieuwe Evaluatie" subtitel="Evaluatie aanmaken voor één of meerdere studenten" />
      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-5xl space-y-4">

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Evaluatie gegevens</h2>

            <div className="grid grid-cols-2 gap-4 mb-5">
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
              {!isFinaal ? (
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
              ) : (
                <div className="flex items-center">
                  <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 w-full">
                    Finale evaluatie — geen deadline. De presentatiedatum wordt later ingesteld.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-gray-500">Student(en) *</label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alleGeselecteerd}
                  onChange={toggleAlle}
                  className="w-3.5 h-3.5 accent-[#1e3a5f] cursor-pointer"
                />
                Alle studenten selecteren ({studenten.length})
              </label>
            </div>

            {studenten.length === 0 ? (
              <p className="text-sm text-gray-400">Geen studenten gevonden.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {studenten.map(s => (
                  <label
                    key={s.stage_id}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={geselecteerdeStudenten.includes(s.stage_id)}
                      onChange={() => toggleStudent(s.stage_id)}
                      className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                    />
                    <span className="font-medium">{s.voornaam} {s.achternaam}</span>
                    <span className="text-gray-400">— {s.bedrijf_naam}</span>
                  </label>
                ))}
              </div>
            )}
            {geselecteerdeStudenten.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {geselecteerdeStudenten.length} student(en) geselecteerd
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Te evalueren competenties</h2>
            <p className="text-xs text-gray-400 mb-4">
              Scores en feedback vul je in na het aanmaken van de evaluatie.
            </p>
            {competenties.length === 0 ? (
              <p className="text-sm text-gray-400">Geen competenties beschikbaar.</p>
            ) : (
              <div className="space-y-2">
                {competenties.map(c => (
                  <div key={c.id} className="text-sm text-gray-700 py-2 border-b border-gray-50 last:border-0">
                    {competentieLabel(c)}
                  </div>
                ))}
              </div>
            )}
          </div>

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
              {bezig
                ? 'Bezig...'
                : geselecteerdeStudenten.length > 1
                  ? `Evaluaties aanmaken (${geselecteerdeStudenten.length})`
                  : 'Evaluatie aanmaken'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}