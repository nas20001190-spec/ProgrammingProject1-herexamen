'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Topbar from '../../component/topbar';
import { BookOpen, Star, Paperclip } from 'lucide-react';
import { fetchMetAuth } from '@/app/lib/fetchMetAuth';

export default function StagiairDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [stagiair, setStagiair] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMetAuth(`/api/stagementor/stagiairs/${id}`)
        .then(res => res?.json())
        .then(data => {
          if (data && !data.fout) setStagiair(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  const getInitials = (voornaam, achternaam) =>
    `${voornaam?.[0] ?? ''}${achternaam?.[0] ?? ''}`.toUpperCase();

  const formatDatum = (datum) => {
    if (!datum) return '';
    return new Date(datum).toLocaleDateString('nl-BE');
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Laden...</div></div>;
  if (!stagiair) return <div className="flex-1 flex items-center justify-center bg-gray-100"><div className="text-sm text-gray-400">Stagiair niet gevonden.</div></div>;

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel={`${stagiair.voornaam} ${stagiair.achternaam}`} subtitel="Stagementor overzicht" />

      <div className="flex-1 bg-gray-100 p-6 flex flex-col gap-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#dbeafe] grid place-items-center text-sm font-bold text-[#1d4ed8] flex-shrink-0">
              {getInitials(stagiair.voornaam, stagiair.achternaam)}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{stagiair.voornaam} {stagiair.achternaam}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-gray-400">{stagiair.email}</p>
                <p className="text-xs text-gray-400">{stagiair.telefoon}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Opleiding</p>
              <p className="text-sm font-medium text-gray-900">{stagiair.opleiding}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Stageperiode</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDatum(stagiair.startdatum)} – {formatDatum(stagiair.einddatum)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Docent</p>
              <p className="text-sm font-medium text-gray-900">{stagiair.docent_voornaam} {stagiair.docent_achternaam}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Bedrijf</p>
              <p className="text-sm font-medium text-gray-900">{stagiair.bedrijf_naam}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div
            onClick={() => router.push('/stagementor/logboeken')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 bg-[#1e3a5f] grid place-items-center rounded-lg flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Logboeken</p>
            </div>
            <p className={`text-xs font-medium ${stagiair.logboeken_te_keuren > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              {stagiair.logboeken_te_keuren > 0 ? `${stagiair.logboeken_te_keuren} te keuren` : 'Alles up-to-date'}
            </p>
          </div>

          <div
            onClick={() => router.push('/stagementor/evaluaties')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 bg-[#1e3a5f] grid place-items-center rounded-lg flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Evaluaties</p>
            </div>
            <p className={`text-xs font-medium ${stagiair.evaluaties_te_doen > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              {stagiair.evaluaties_te_doen > 0 ? `${stagiair.evaluaties_te_doen} te doen` : 'Alles voltooid'}
            </p>
          </div>

          <div
            onClick={() => router.push('/stagementor/documenten')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 bg-[#1e3a5f] grid place-items-center rounded-lg flex-shrink-0">
                <Paperclip className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Documenten</p>
            </div>
            <p className="text-xs text-gray-400">Stageovereenkomst</p>
          </div>
        </div>

      </div>
    </div>
  );
}