'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../component/topbar';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function DocentBewerkenPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [toonWachtwoord, setToonWachtwoord] = useState(false);

  const [form, setForm] = useState({
    voornaam: '', achternaam: '', email: '', wachtwoord: '',
    telefoon: '', rol: '', id: '', timeOfCreation: '',
  });

  useEffect(() => {
    if (!id) return;
    fetchMetAuth(`/api/admin/gebruikers/${id}`)
      .then(res => res?.json())
      .then(data => {
        if (data && !data.fout) {
          setForm({
            voornaam: data.voornaam || '',
            achternaam: data.achternaam || '',
            email: data.email || '',
            wachtwoord: '',
            telefoon: data.telefoon || '',
            rol: data.rol || '',
            id: data.id || '',
            timeOfCreation: data.created_at ? new Date(data.created_at).toLocaleString('nl-BE') : '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const update = (veld, waarde) => setForm({ ...form, [veld]: waarde });

  const handleOpslaan = async () => {
    if (!window.confirm('Wijzigingen opslaan?')) return;
    const response = await fetchMetAuth(`/api/admin/gebruikers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        email: form.email,
        telefoon: form.telefoon,
        rol: form.rol,
        wachtwoord: form.wachtwoord || null,
      }),
    });
    if (!response) return;
    const data = await response.json();
    if (response.ok) {
      alert('Opgeslagen!');
      router.push('/admin/docenten');
    } else {
      alert(data.fout || 'Er ging iets mis');
    }
  };

  const handleAnnuleren = () => router.push('/admin/docenten');

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Docent" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Docent bewerken</h2>
        <p className="text-sm text-gray-400 mb-6">Bewerk de gegevens van een docent</p>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs text-gray-400 mb-4">{form.voornaam} {form.achternaam}</p>
          <hr className="border-gray-100 mb-6" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Voornaam</label>
              <input type="text" value={form.voornaam} onChange={(e) => update('voornaam', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Achternaam</label>
              <input type="text" value={form.achternaam} onChange={(e) => update('achternaam', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
              <input type="tel" value={form.telefoon} onChange={(e) => update('telefoon', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Rol</label>
              <input type="text" value={form.rol} onChange={(e) => update('rol', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">ID</label>
              <input type="text" value={form.id} disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Time of Creation</label>
              <input type="text" value={form.timeOfCreation} disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">
                Nieuw wachtwoord <span className="text-gray-300">(laat leeg om niet te wijzigen)</span>
              </label>
              <div className="relative">
                <input
                  type={toonWachtwoord ? 'text' : 'password'}
                  value={form.wachtwoord}
                  onChange={(e) => update('wachtwoord', e.target.value)}
                  placeholder="Nieuw wachtwoord..."
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setToonWachtwoord(!toonWachtwoord)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {toonWachtwoord ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleAnnuleren} className="bg-white border border-gray-200 text-gray-700 text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50">
            Annuleren
          </button>
          <button onClick={handleOpslaan} className="bg-[#1A2E4A] text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-[#152438]">
            Opslaan
          </button>
        </div>
      </div>
    </main>
  );
}