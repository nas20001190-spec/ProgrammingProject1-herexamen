'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function StagementorNieuwPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    voornaam: '', achternaam: '', email: '', wachtwoord: '',
    telefoon: '', functie: '',
    bedrijfsnaam: '', adres: '', sector: '', website: '',
  });

  const update = (veld, waarde) => setForm({ ...form, [veld]: waarde });

  const handleAanmaken = async () => {
    if (!form.voornaam || !form.achternaam || !form.email) {
      alert('Vul minstens voornaam, achternaam en email in.');
      return;
    }
    if (!window.confirm('Weet u zeker dat u deze stagementor wilt aanmaken?')) return;

    const response = await fetchMetAuth('/api/admin/stagementors', {
      method: 'POST',
      body: JSON.stringify({
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        email: form.email,
        wachtwoord: form.wachtwoord,
        telefoon: form.telefoon,
        functie: form.functie,
        bedrijf_naam: form.bedrijfsnaam,
        adres: form.adres,
        sector: form.sector,
        website: form.website,
      }),
    });
    if (!response) return;
    const data = await response.json();
    if (response.ok) {
      alert('Stagementor aangemaakt!');
      router.push('/admin/stagementors');
    } else {
      alert(data.fout || 'Er ging iets mis');
    }
  };

  const handleAnnuleren = () => router.push('/admin/stagementors');

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent';

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Stagementor" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Nieuwe stagementor aanmaken</h2>
        <p className="text-sm text-gray-400 mb-6">Voeg een nieuwe stagementor toe aan het systeem</p>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-xs text-gray-400 mb-4">Persoonlijke gegevens</p>
          <hr className="border-gray-100 mb-6" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Voornaam</label>
              <input type="text" value={form.voornaam} onChange={(e) => update('voornaam', e.target.value)} placeholder="Voornaam" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Achternaam</label>
              <input type="text" value={form.achternaam} onChange={(e) => update('achternaam', e.target.value)} placeholder="Achternaam" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="naam@bedrijf.be" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Wachtwoord</label>
              <input type="text" value={form.wachtwoord} onChange={(e) => update('wachtwoord', e.target.value)} placeholder="Tijdelijk wachtwoord" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
              <input type="tel" value={form.telefoon} onChange={(e) => update('telefoon', e.target.value)} placeholder="+32 ..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Rol</label>
              <input type="text" value="stagementor" disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Functie</label>
              <input type="text" value={form.functie} onChange={(e) => update('functie', e.target.value)} placeholder="bv. IT consultant" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs text-gray-400 mb-4">Bedrijfsgegevens</p>
          <hr className="border-gray-100 mb-6" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Naam</label>
              <input type="text" value={form.bedrijfsnaam} onChange={(e) => update('bedrijfsnaam', e.target.value)} placeholder="Naam van het bedrijf" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Adres</label>
              <input type="text" value={form.adres} onChange={(e) => update('adres', e.target.value)} placeholder="Straat, postcode, stad" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sector</label>
              <input type="text" value={form.sector} onChange={(e) => update('sector', e.target.value)} placeholder="bv. IT" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Website</label>
              <input type="text" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="bedrijf.com" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleAnnuleren} className="bg-white border border-gray-200 text-gray-700 text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50">
            Annuleren
          </button>
          <button onClick={handleAanmaken} className="bg-[#1A2E4A] text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-[#152438]">
            Aanmaken
          </button>
        </div>
      </div>
    </main>
  );
}