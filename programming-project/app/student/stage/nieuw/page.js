'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '../../component/topbar'
import { fetchMetAuth } from '@/app/lib/fetchMetAuth'

export default function NieuweStageAanvraag() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [student, setStudent] = useState(null)

  const [bedrijf, setBedrijf] = useState({
    naam: '', adres: '', sector: '', website: '', telefoon: ''
  })

  const [mentor, setMentor] = useState({
    naam: '', functie: '', email: '', telefoon: ''
  })

  const [opdracht, setOpdracht] = useState({
    omschrijving: '', startdatum: '', einddatum: ''
  })

  useEffect(() => {
    fetchMetAuth('/api/user/profiel')
      .then(res => res?.json())
      .then(data => { if (data && !data.fout) setStudent(data) })
      .catch(() => {})
  }, [])

  const handleIndienen = async (e) => {
    e.preventDefault()
    setFout('')

    if (!bedrijf.naam || !bedrijf.adres || !mentor.naam || !mentor.email || !opdracht.omschrijving || !opdracht.startdatum || !opdracht.einddatum) {
      setFout('Vul alle verplichte velden in!')
      return
    }

    setLoading(true)

    try {
      const response = await fetchMetAuth('/api/student/stage', {
        method: 'POST',
        body: JSON.stringify({
          bedrijf_naam: bedrijf.naam,
          bedrijf_adres: bedrijf.adres,
          bedrijf_sector: bedrijf.sector,
          bedrijf_website: bedrijf.website,
          bedrijf_telefoon: bedrijf.telefoon,
          mentor_naam: mentor.naam,
          mentor_functie: mentor.functie,
          mentor_email: mentor.email,
          mentor_telefoon: mentor.telefoon,
          opdracht_omschrijving: opdracht.omschrijving,
          startdatum: opdracht.startdatum,
          einddatum: opdracht.einddatum,
        })
      })

      if (!response) { setLoading(false); return }
      const data = await response.json()

      if (!response.ok) {
        setFout(data.fout)
        setLoading(false)
        return
      }

      router.push('/student/stage')

    } catch (error) {
      setFout('Er is een fout opgetreden. Probeer opnieuw.')
      setLoading(false)
    }
  }

  const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
  const labelStyle = "block text-xs text-gray-500 mb-1"

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Stageaanvraag" subtitel="Dashboard › Nieuwe stageaanvraag" />

      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">

        <div className="bg-white rounded-xl p-4 mb-4 flex items-center gap-4 text-sm">
          {[
            { nr: 1, label: 'Jouw gegevens' },
            { nr: 2, label: 'Bedrijfsgegevens' },
            { nr: 3, label: 'Stagementor' },
            { nr: 4, label: 'Opdracht & periode' },
          ].map((stap, i) => (
            <div key={stap.nr} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">{stap.nr}</div>
              <span className="text-gray-600 font-medium">{stap.label}</span>
              {i < 3 && <span className="text-gray-300 ml-2">——</span>}
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-700">
          Na het indienen wordt je aanvraag doorgestuurd naar je docent en vervolgens beoordeeld door de admin. Je ontvangt een bevestiging via e-mail zodra je stage is goedgekeurd.
        </div>

        <form onSubmit={handleIndienen} className="space-y-4">

          {/* Jouw gegevens — echte data */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">1</div>
              <h2 className="font-semibold text-gray-800">Jouw gegevens</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Naam</label>
                <input className={`${inputStyle} bg-gray-50`} value={student ? `${student.voornaam} ${student.achternaam}` : 'Laden...'} disabled />
              </div>
              <div>
                <label className={labelStyle}>Opleiding</label>
                <input className={`${inputStyle} bg-gray-50`} value={student?.opleiding || ''} disabled />
              </div>
              <div>
                <label className={labelStyle}>Academiejaar</label>
                <input className={`${inputStyle} bg-gray-50`} value={student?.academiejaar || ''} disabled />
              </div>
              <div>
                <label className={labelStyle}>E-mailadres</label>
                <input className={`${inputStyle} bg-gray-50`} value={student?.email || 'Laden...'} disabled />
              </div>
            </div>
          </div>

          {/* Bedrijfsgegevens */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">2</div>
              <h2 className="font-semibold text-gray-800">Bedrijfsgegevens</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Bedrijfsnaam *</label>
                <input className={inputStyle} placeholder="bv. Proximus NV" value={bedrijf.naam} onChange={e => setBedrijf({...bedrijf, naam: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Adres *</label>
                <input className={inputStyle} placeholder="Straat + nummer, gemeente" value={bedrijf.adres} onChange={e => setBedrijf({...bedrijf, adres: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Sector</label>
                <input className={inputStyle} placeholder="bv. IT-consultancy" value={bedrijf.sector} onChange={e => setBedrijf({...bedrijf, sector: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Website</label>
                <input className={inputStyle} placeholder="https://www.bedrijf.be" value={bedrijf.website} onChange={e => setBedrijf({...bedrijf, website: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className={labelStyle}>Telefoonnummer</label>
                <input className={inputStyle} placeholder="+32 ..." value={bedrijf.telefoon} onChange={e => setBedrijf({...bedrijf, telefoon: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Stagementor */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">3</div>
              <h2 className="font-semibold text-gray-800">Stagementor</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Naam mentor *</label>
                <input className={inputStyle} placeholder="Volledige naam" value={mentor.naam} onChange={e => setMentor({...mentor, naam: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Functie</label>
                <input className={inputStyle} placeholder="bv. Software Engineer" value={mentor.functie} onChange={e => setMentor({...mentor, functie: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>E-mail mentor *</label>
                <input className={inputStyle} placeholder="mentor@bedrijf.be" value={mentor.email} onChange={e => setMentor({...mentor, email: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Telefoonnummer mentor</label>
                <input className={inputStyle} placeholder="+32 ..." value={mentor.telefoon} onChange={e => setMentor({...mentor, telefoon: e.target.value})} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">De mentor ontvangt een account-uitnodiging na goedkeuring.</p>
          </div>

          {/* Stageopdracht & periode */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">4</div>
              <h2 className="font-semibold text-gray-800">Stageopdracht & periode</h2>
            </div>
            <div className="mb-3">
              <label className={labelStyle}>Omschrijving van de opdracht *</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 h-24 resize-none"
                placeholder="Beschrijf de stageactiviteiten..."
                value={opdracht.omschrijving}
                onChange={e => setOpdracht({...opdracht, omschrijving: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Startdatum *</label>
                <input type="date" className={inputStyle} value={opdracht.startdatum} onChange={e => setOpdracht({...opdracht, startdatum: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Einddatum *</label>
                <input type="date" className={inputStyle} value={opdracht.einddatum} onChange={e => setOpdracht({...opdracht, einddatum: e.target.value})} />
              </div>
            </div>
          </div>

          {fout && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
              {fout}
            </div>
          )}

          <div className="flex items-center justify-between pb-6">
            <button type="button" onClick={() => router.push('/student/dashboard-first')} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              ← Annuleren
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push('/student/stage')} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                Stageaanvragen bekijken
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#162d4a] cursor-pointer font-medium disabled:opacity-50">
                {loading ? 'Bezig...' : 'Aanvraag indienen'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}