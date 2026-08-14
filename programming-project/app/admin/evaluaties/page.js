'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'
import { FileText, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

export default function AdminEvaluaties() {
  const router = useRouter()
  const [evaluaties, setEvaluaties] = useState([])
  const [loading, setLoading] = useState(true)

  // Pondering
  const [pondering, setPondering] = useState({ mentor_gewicht: 30, docent_gewicht: 30, presentatie_gewicht: 40 })
  const [ponderingOpen, setPonderingOpen] = useState(false)
  const [ponderingBezig, setPonderingBezig] = useState(false)
  const [ponderingBericht, setPonderingBericht] = useState('')
  const [ponderingFout, setPonderingFout] = useState('')

  // Presentatie criteria
  const [criteriaOpen, setCriteriaOpen] = useState(false)
  const [criteria, setCriteria] = useState([])
  const [criteriaLoading, setCriteriaLoading] = useState(false)
  const [openCriterium, setOpenCriterium] = useState(null)
  const [nieuwCriterium, setNieuwCriterium] = useState({ naam: '', omschrijving: '', gewicht: '' })
  const [nieuwNiveau, setNieuwNiveau] = useState({})

  useEffect(() => {
    Promise.all([
      fetchMetAuth('/api/admin/evaluaties').then(r => r?.json()),
      fetchMetAuth('/api/admin/pondering').then(r => r?.json()),
    ]).then(([evalData, ponderingData]) => {
      setEvaluaties(Array.isArray(evalData) ? evalData : [])
      if (ponderingData && !ponderingData.fout) setPondering(ponderingData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const laadCriteria = () => {
    setCriteriaLoading(true)
    fetchMetAuth('/api/admin/presentatie-criteria')
      .then(r => r?.json())
      .then(data => { setCriteria(Array.isArray(data) ? data : []); setCriteriaLoading(false) })
      .catch(() => setCriteriaLoading(false))
  }

  useEffect(() => {
    if (criteriaOpen) laadCriteria()
  }, [criteriaOpen])

  const totaalPondering = parseFloat(pondering.mentor_gewicht || 0) + parseFloat(pondering.docent_gewicht || 0) + parseFloat(pondering.presentatie_gewicht || 0)
  const totaalCriteria = criteria.reduce((acc, c) => acc + (parseFloat(c.gewicht) || 0), 0)

  const handlePonderingOpslaan = async () => {
    setPonderingFout(''); setPonderingBericht('')
    if (totaalPondering !== 100) { setPonderingFout('Totaal moet exact 100% zijn.'); return }
    setPonderingBezig(true)
    const response = await fetchMetAuth('/api/admin/pondering', { method: 'PUT', body: JSON.stringify(pondering) })
    if (!response) { setPonderingBezig(false); return }
    const data = await response.json()
    if (response.ok) setPonderingBericht('Opgeslagen!')
    else setPonderingFout(data.fout || 'Er ging iets mis')
    setPonderingBezig(false)
  }

  const handleCriteriumToevoegen = async () => {
    if (!nieuwCriterium.naam) { alert('Naam is verplicht'); return }
    const response = await fetchMetAuth('/api/admin/presentatie-criteria', {
      method: 'POST',
      body: JSON.stringify({ ...nieuwCriterium, gewicht: parseFloat(nieuwCriterium.gewicht) || 0 })
    })
    if (response?.ok) { setNieuwCriterium({ naam: '', omschrijving: '', gewicht: '' }); laadCriteria() }
  }

  const handleCriteriumVerwijderen = async (id) => {
    if (!window.confirm('Criterium verwijderen?')) return
    const response = await fetchMetAuth('/api/admin/presentatie-criteria', { method: 'DELETE', body: JSON.stringify({ id }) })
    if (response?.ok) laadCriteria()
  }

  const handleNiveauToevoegen = async (criterium_id) => {
    const niveau = nieuwNiveau[criterium_id] || { score: '', score_max: 10, beschrijving: '' }
    if (!niveau.score && niveau.score !== 0) { alert('Score is verplicht'); return }
    const response = await fetchMetAuth('/api/admin/presentatie-criteria/niveaus', {
      method: 'POST',
      body: JSON.stringify({ criterium_id, ...niveau })
    })
    if (response?.ok) { setNieuwNiveau(prev => ({ ...prev, [criterium_id]: { score: '', score_max: 10, beschrijving: '' } })); laadCriteria() }
  }

  const handleNiveauVerwijderen = async (id) => {
    const response = await fetchMetAuth('/api/admin/presentatie-criteria/niveaus', { method: 'DELETE', body: JSON.stringify({ id }) })
    if (response?.ok) laadCriteria()
  }

  const handlePdf = (id) => window.open(`/api/admin/evaluaties/${id}/pdf`, '_blank')

  const statusBadge = (status) => {
    const map = {
      open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ingevuld: 'bg-blue-50 text-blue-700 border-blue-200',
      mentor_beoordeelt: 'bg-orange-50 text-orange-700 border-orange-200',
      voltooid: 'bg-green-50 text-green-700 border-green-200',
    }
    const labels = { open: 'Open', ingevuld: 'Ingevuld', mentor_beoordeelt: 'Mentor beoordeelt', voltooid: 'Voltooid' }
    return <span className={`text-xs px-2 py-1 rounded-full font-medium border ${map[status] || map.open}`}>{labels[status] || status}</span>
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2E4A]'

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-50"><div className="text-sm text-gray-400">Laden...</div></div>

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Evaluaties" />
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto space-y-4">

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Evaluaties</h2>
          <p className="text-sm text-gray-400">Overzicht van alle evaluaties — genereer eindoverzichten per student</p>
        </div>

        {/* Evaluaties tabel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Student</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Deadline</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">Eindoverzicht</th>
              </tr>
            </thead>
            <tbody>
              {evaluaties.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Geen evaluaties gevonden.</td></tr>
              ) : (
                evaluaties.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{e.student_voornaam} {e.student_achternaam}</td>
                    <td className="px-5 py-4 text-gray-600 capitalize">{e.type}</td>
                    <td className="px-5 py-4 text-gray-600">{e.datum ? new Date(e.datum + 'T12:00:00').toLocaleDateString('nl-BE') : '—'}</td>
                    <td className="px-5 py-4">{statusBadge(e.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handlePdf(e.id)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1A2E4A] text-white text-xs rounded-lg hover:bg-[#152438] cursor-pointer">
                        <FileText size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pondering */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setPonderingOpen(!ponderingOpen)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 text-left">Evaluatie pondering</p>
              <p className="text-xs text-gray-400 text-left">Weging voor de eindnota berekening — mentor {pondering.mentor_gewicht}% · docent {pondering.docent_gewicht}% · presentatie {pondering.presentatie_gewicht}%</p>
            </div>
            {ponderingOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {ponderingOpen && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 mt-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Stagementor (%)</label>
                  <input type="number" min="0" max="100" step="1" className={inputClass} value={pondering.mentor_gewicht} onChange={e => setPondering({ ...pondering, mentor_gewicht: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Docent (%)</label>
                  <input type="number" min="0" max="100" step="1" className={inputClass} value={pondering.docent_gewicht} onChange={e => setPondering({ ...pondering, docent_gewicht: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Eindpresentatie (%)</label>
                  <input type="number" min="0" max="100" step="1" className={inputClass} value={pondering.presentatie_gewicht} onChange={e => setPondering({ ...pondering, presentatie_gewicht: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${totaalPondering === 100 ? 'text-green-600' : 'text-red-500'}`}>
                  Totaal: {totaalPondering}% {totaalPondering === 100 ? '✓' : `(nog ${100 - totaalPondering}% over)`}
                </span>
                {ponderingFout && <span className="text-red-500 text-xs">{ponderingFout}</span>}
                {ponderingBericht && <span className="text-green-500 text-xs">{ponderingBericht}</span>}
                <button onClick={handlePonderingOpslaan} disabled={ponderingBezig || totaalPondering !== 100} className="px-4 py-2 bg-[#1A2E4A] text-white text-sm rounded-lg font-medium disabled:opacity-50">
                  {ponderingBezig ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Presentatie criteria */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setCriteriaOpen(!criteriaOpen)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 text-left">Eindpresentatie rubriek</p>
              <p className="text-xs text-gray-400 text-left">Beheer de criteria voor de eindpresentatie — {criteria.length} criteria</p>
            </div>
            {criteriaOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {criteriaOpen && (
            <div className="border-t border-gray-100 px-5 pb-5">
              {criteriaLoading ? (
                <p className="text-xs text-gray-400 mt-4">Laden...</p>
              ) : (
                <>
                  <div className="space-y-3 mt-4">
                    {criteria.map(c => (
                      <div key={c.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.naam}</p>
                            <p className="text-xs text-gray-400">{c.omschrijving || '—'} · {c.gewicht}%</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleCriteriumVerwijderen(c.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-400 grid place-items-center"><Trash2 size={13} /></button>
                            <button onClick={() => setOpenCriterium(openCriterium === c.id ? null : c.id)} className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 grid place-items-center">
                              {openCriterium === c.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </div>

                        {openCriterium === c.id && (
                          <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
                            {c.niveaus.map(n => (
                              <div key={n.id} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[#1e3a5f] w-14 flex-shrink-0">{n.score}/{n.score_max}</span>
                                <p className="text-xs text-gray-600 flex-1">{n.beschrijving}</p>
                                <button onClick={() => handleNiveauVerwijderen(n.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 pt-2">
                              <input type="number" min="0" placeholder="Score" className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" value={nieuwNiveau[c.id]?.score ?? ''} onChange={e => setNieuwNiveau(prev => ({ ...prev, [c.id]: { ...prev[c.id] || {}, score: e.target.value } }))} />
                              <span className="text-xs text-gray-400">/</span>
                              <input type="number" min="1" placeholder="Max" className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" value={nieuwNiveau[c.id]?.score_max ?? 10} onChange={e => setNieuwNiveau(prev => ({ ...prev, [c.id]: { ...prev[c.id] || {}, score_max: e.target.value } }))} />
                              <input type="text" placeholder="Beschrijving..." className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none" value={nieuwNiveau[c.id]?.beschrijving ?? ''} onChange={e => setNieuwNiveau(prev => ({ ...prev, [c.id]: { ...prev[c.id] || {}, beschrijving: e.target.value } }))} />
                              <button onClick={() => handleNiveauToevoegen(c.id)} className="flex items-center gap-1 px-2 py-1 bg-[#1A2E4A] text-white text-xs rounded-lg"><Plus size={11} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Nieuw criterium */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Nieuw criterium toevoegen</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <input type="text" placeholder="Naam *" className={inputClass} value={nieuwCriterium.naam} onChange={e => setNieuwCriterium({ ...nieuwCriterium, naam: e.target.value })} />
                      </div>
                      <div>
                        <input type="number" min="0" max="100" placeholder="Gewicht (%)" className={inputClass} value={nieuwCriterium.gewicht} onChange={e => setNieuwCriterium({ ...nieuwCriterium, gewicht: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <input type="text" placeholder="Omschrijving" className={inputClass} value={nieuwCriterium.omschrijving} onChange={e => setNieuwCriterium({ ...nieuwCriterium, omschrijving: e.target.value })} />
                      </div>
                      <div>
                        <button onClick={handleCriteriumToevoegen} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1A2E4A] text-white text-sm rounded-lg font-medium">
                          <Plus size={14} /> Toevoegen
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-right text-gray-400">
                      Totaal gewicht criteria: <span className={`font-semibold ${totaalCriteria === 100 ? 'text-green-600' : 'text-gray-600'}`}>{totaalCriteria.toFixed(1)}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}