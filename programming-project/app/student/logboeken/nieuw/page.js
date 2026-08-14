'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

function getMaandagVanWeek(startdatum, weekNummer) {
  const start = new Date(startdatum + 'T12:00:00')
  const dagVanWeek = start.getDay()
  const diff = dagVanWeek === 0 ? -6 : 1 - dagVanWeek
  const eersteMandag = new Date(start)
  eersteMandag.setDate(start.getDate() + diff)
  const maandag = new Date(eersteMandag)
  maandag.setDate(eersteMandag.getDate() + (weekNummer - 1) * 7)
  return maandag
}

function toDateStr(d) {
  return d.toLocaleDateString('en-CA')
}

function fmt(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('nl-BE')
}

const DAGEN_NAMEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']

function LogboekNieuwInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const weekParam = parseInt(searchParams.get('week') || '1')
  const startParam = searchParams.get('start') || ''

  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [stageId, setStageId] = useState(null)
  const [bedrijfNaam, setBedrijfNaam] = useState('')
  const [competenties, setCompetenties] = useState([])
  const [weekDagen, setWeekDagen] = useState([])
  const [datumMin, setDatumMin] = useState('')
  const [datumMax, setDatumMax] = useState('')

  const [form, setForm] = useState({
    datum: '',
    uren: '',
    taken: '',
    reflectie: '',
    leerpunten: '',
    geselecteerdeCompetenties: [],
  })

  useEffect(() => {
    if (!startParam) {
      setLoading(false)
      return
    }

    Promise.all([
      fetchMetAuth('/api/competenties').then(r => r?.json()),
      fetchMetAuth('/api/student/logboeken').then(r => r?.json()),
    ]).then(([competentieData, logboekenData]) => {
      const stage = logboekenData?.stage
      if (stage) {
        setStageId(stage.id)
        setBedrijfNaam(stage.bedrijf_naam || '')
      }

      const maandag = getMaandagVanWeek(startParam, weekParam)
      if (isNaN(maandag.getTime())) {
        setLoading(false)
        return
      }

      const min = toDateStr(maandag)
      const vrijdag = new Date(maandag)
      vrijdag.setDate(maandag.getDate() + 4)
      const max = toDateStr(vrijdag)
      setDatumMin(min)
      setDatumMax(max)

      const weken = logboekenData?.weken ?? []
      const dagen = logboekenData?.dagen ?? []
      const dezeWeek = weken.find(w => w.week_nummer === weekParam)
      const ingevuldeDatums = dezeWeek
        ? dagen.filter(d => d.logboek_week_id === dezeWeek.id).map(d => d.datum?.slice(0, 10))
        : []

      const dagen5 = DAGEN_NAMEN.map((naam, i) => {
        const d = new Date(maandag)
        d.setDate(maandag.getDate() + i)
        const datum = toDateStr(d)
        return { naam, datum, gedaan: ingevuldeDatums.includes(datum) }
      })
      setWeekDagen(dagen5)
      setCompetenties(competentieData ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [weekParam, startParam])

  const toggleCompetentie = (id) => {
    setForm(prev => ({
      ...prev,
      geselecteerdeCompetenties: prev.geselecteerdeCompetenties.includes(id)
        ? prev.geselecteerdeCompetenties.filter(x => x !== id)
        : [...prev.geselecteerdeCompetenties, id]
    }))
  }

  const selecteerDag = (datum) => {
    setFout('')
    setForm(prev => ({ ...prev, datum, uren: '', taken: '', reflectie: '', leerpunten: '', geselecteerdeCompetenties: [] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFout('')

    if (!form.datum || form.uren === '' || !form.taken) {
      setFout('Vul alle verplichte velden in!')
      return
    }

    setBezig(true)

    const response = await fetchMetAuth('/api/student/logboeken', {
      method: 'POST',
      body: JSON.stringify({
        stage_id: stageId,
        week_nummer: weekParam,
        datum_van: datumMin,
        datum_tot: datumMax,
        dagen: [{
          datum: form.datum,
          uren: parseFloat(form.uren),
          taken: form.taken,
          reflectie: form.reflectie,
          leerpunten: form.leerpunten,
          competenties: form.geselecteerdeCompetenties,
        }]
      })
    })

    if (!response) { setBezig(false); return }
    const data = await response.json()

    if (!response.ok) {
      setFout(data.fout)
      setBezig(false)
    } else {
      router.push('/student/logboeken')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    )
  }

  if (!startParam) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Geen geldig startdatum. Ga terug naar logboeken.</div>
      </div>
    )
  }

  const geselecteerdeDag = weekDagen.find(d => d.datum === form.datum)

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        titel="Logboek invullen"
        subtitel={`${bedrijfNaam || 'Stage'} · Week ${weekParam} · ${geselecteerdeDag ? `${geselecteerdeDag.naam} ${fmt(form.datum)}` : 'Kies een dag'}`}
      />
      <div className="flex-1 bg-gray-100 p-6">
        <div className="grid grid-cols-3 gap-4">

          <div className="col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="bg-white rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Kies een dag</h2>
                <p className="text-xs text-gray-400 mb-3">{fmt(datumMin)} t/m {fmt(datumMax)}</p>
                <div className="flex gap-2">
                  {weekDagen.map(({ naam, datum, gedaan }) => (
                    <button
                      key={naam}
                      type="button"
                      disabled={gedaan}
                      onClick={() => selecteerDag(datum)}
                      className={`flex-1 py-3 rounded-lg text-xs font-medium border transition-colors ${
                        gedaan
                          ? 'bg-green-50 text-green-600 border-green-200 cursor-not-allowed'
                          : form.datum === datum
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div>{naam.slice(0, 2)}</div>
                      <div className="text-xs mt-0.5 opacity-70">{fmt(datum)}</div>
                      {gedaan && <div className="text-xs mt-0.5">✓</div>}
                    </button>
                  ))}
                </div>
              </div>

              {form.datum && !weekDagen.find(d => d.datum === form.datum)?.gedaan && (
                <div className="bg-white rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-800 mb-4">
                    {geselecteerdeDag?.naam} {fmt(form.datum)} — Dagverslag
                  </h2>

                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Uitgevoerde taken *</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none"
                      placeholder="Beschrijf wat je vandaag hebt gedaan..."
                      value={form.taken}
                      onChange={e => setForm({...form, taken: e.target.value})}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Reflectie</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none"
                      placeholder="Wat leerde je vandaag? Hoe verliep de dag?"
                      value={form.reflectie}
                      onChange={e => setForm({...form, reflectie: e.target.value})}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Leerpunten / problemen</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none"
                      placeholder="Eventuele moeilijkheden, vragen of inzichten..."
                      value={form.leerpunten}
                      onChange={e => setForm({...form, leerpunten: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gewerkte uren *</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="8"
                      value={form.uren}
                      onChange={e => setForm({...form, uren: e.target.value})}
                    />
                    <span className="text-xs text-gray-400 ml-2">(0u = afwezig/ziek)</span>
                  </div>
                </div>
              )}

              {fout && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
                  {fout}
                </div>
              )}

              <div className="flex gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => router.push('/student/logboeken')}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Terug
                </button>
                {form.datum && !weekDagen.find(d => d.datum === form.datum)?.gedaan && (
                  <button
                    type="submit"
                    disabled={bezig}
                    className="px-5 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#162d4a] cursor-pointer font-medium disabled:opacity-50"
                  >
                    {bezig ? 'Bezig...' : 'Dag indienen'}
                  </button>
                )}
              </div>

            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Competenties vandaag</h2>
              <p className="text-xs text-gray-400 mb-3">Welke competenties heb je aangetoond?</p>
              {competenties.length === 0 ? (
                <p className="text-xs text-gray-400">Geen competenties beschikbaar.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {competenties.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCompetentie(c.id)}
                      className={`text-xs px-3 py-1 rounded-full border cursor-pointer ${
                        form.geselecteerdeCompetenties.includes(c.id)
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c.naam}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Week {weekParam} overzicht</h2>
              <div className="space-y-2">
                {weekDagen.map(({ naam, datum, gedaan }) => (
                  <div key={naam} className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-600 w-20">{naam.slice(0, 2)}</span>
                    <span className="text-xs text-gray-400">{fmt(datum)}</span>
                    {gedaan
                      ? <span className="text-xs text-green-600 font-medium">Ingevuld</span>
                      : form.datum === datum
                      ? <span className="text-xs text-blue-600 font-medium">Geselecteerd</span>
                      : <span className="text-xs text-gray-300">Nog open</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LogboekNieuw() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>}>
      <LogboekNieuwInner />
    </Suspense>
  )
}