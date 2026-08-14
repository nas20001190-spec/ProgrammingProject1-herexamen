"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Topbar from "../../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

export default function OvereenkomstBewerkenPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [data, setData] = useState(null);
  const [docenten, setDocenten] = useState([]);
  const [stagementors, setStagementors] = useState([]);

  const [form, setForm] = useState({
    docent_id: "",
    stagementor_id: "",
    startdatum: "",
    einddatum: "",
    opdracht_omschrijving: "",
  });

  useEffect(() => {
    if (!id) return;

    fetchMetAuth(`/api/admin/stages/${id}`)
      .then((res) => res?.json())
      .then((d) => {
        if (d && !d.fout) {
          setData(d);
          setForm({
            docent_id: d.docent_id || "",
            stagementor_id: d.stagementor_id || "",
            startdatum: d.startdatum ? d.startdatum.slice(0, 10) : "",
            einddatum: d.einddatum ? d.einddatum.slice(0, 10) : "",
            opdracht_omschrijving: d.opdracht_omschrijving || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchMetAuth("/api/admin/docenten")
      .then((res) => res?.json())
      .then((d) => {
        if (Array.isArray(d)) setDocenten(d);
      })
      .catch(() => {});

    fetchMetAuth("/api/admin/stagementors")
      .then((res) => res?.json())
      .then((d) => {
        if (Array.isArray(d)) setStagementors(d);
      })
      .catch(() => {});
  }, [id]);

  const handleOpslaan = async () => {
    if (!window.confirm("Wijzigingen opslaan?")) return;
    setBezig(true);

    const response = await fetchMetAuth(`/api/admin/stages/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        docent_id: form.docent_id,
        stagementor_id: form.stagementor_id,
        startdatum: form.startdatum,
        einddatum: form.einddatum,
        opdracht_omschrijving: form.opdracht_omschrijving,
        status: data.status,
        feedback_commissie: data.feedback_commissie,
      }),
    });

    if (!response) {
      setBezig(false);
      return;
    }
    const result = await response.json();
    if (response.ok) {
      alert("Opgeslagen!");
      router.push("/admin/overeenkomsten");
    } else {
      alert(result.fout || "Er ging iets mis");
      setBezig(false);
    }
  };

  const readonlyClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50";
  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Overeenkomst niet gevonden.</div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Overeenkomsten" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Overeenkomst bewerken
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Bekijk en bewerk de gegevens van de overeenkomst
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* Student — readonly */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs text-gray-400 mb-4">Student</p>
            <hr className="border-gray-100 mb-6" />
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Naam</label>
                <input
                  type="text"
                  value={`${data.student_voornaam} ${data.student_achternaam}`}
                  readOnly
                  className={readonlyClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={data.student_email || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Opleiding
                </label>
                <input
                  type="text"
                  value={data.opleiding || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
            </div>
          </div>

          {/* Docent — bewerkbaar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs text-gray-400 mb-4">Docent</p>
            <hr className="border-gray-100 mb-6" />
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Docent voor deze stage
                </label>
                <select
                  value={form.docent_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, docent_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Selecteer docent</option>
                  {docenten.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.voornaam} {d.achternaam}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stagementor — bewerkbaar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs text-gray-400 mb-4">Stagementor</p>
            <hr className="border-gray-100 mb-6" />
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Stagementor voor deze stage
                </label>
                <select
                  value={form.stagementor_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, stagementor_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Selecteer stagementor</option>
                  {stagementors.map((s) => (
                    <option key={s.stagementor_id} value={s.stagementor_id}>
                      {s.voornaam} {s.achternaam} — {s.bedrijf_naam}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={data.mentor_email || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Functie
                </label>
                <input
                  type="text"
                  value={data.mentor_functie || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
            </div>
          </div>

          {/* Bedrijf — readonly */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs text-gray-400 mb-4">Bedrijf</p>
            <hr className="border-gray-100 mb-6" />
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Naam</label>
                <input
                  type="text"
                  value={data.bedrijf_naam || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={data.bedrijf_adres || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Sector
                </label>
                <input
                  type="text"
                  value={data.sector || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={data.website || ""}
                  readOnly
                  className={readonlyClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage info — bewerkbaar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
          <p className="text-xs text-gray-400 mb-4">Stage</p>
          <hr className="border-gray-100 mb-6" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Status</label>
              <input
                type="text"
                value={data.status || ""}
                readOnly
                className={readonlyClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Ingediend op
              </label>
              <input
                type="text"
                value={
                  data.ingediend_op
                    ? new Date(data.ingediend_op).toLocaleDateString("nl-BE")
                    : ""
                }
                readOnly
                className={readonlyClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Startdatum
              </label>
              <input
                type="date"
                value={form.startdatum}
                onChange={(e) =>
                  setForm({ ...form, startdatum: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Einddatum
              </label>
              <input
                type="date"
                value={form.einddatum}
                onChange={(e) =>
                  setForm({ ...form, einddatum: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">
                Opdracht
              </label>
              <textarea
                value={form.opdracht_omschrijving}
                onChange={(e) =>
                  setForm({ ...form, opdracht_omschrijving: e.target.value })
                }
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => router.push("/admin/overeenkomsten")}
            className="bg-white border border-gray-200 text-gray-700 text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50"
          >
            Annuleren
          </button>
          <button
            onClick={() => window.open(`/api/admin/stages/${id}/pdf`, "_blank")}
            className="bg-white border border-gray-200 text-gray-700 text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            PDF genereren
          </button>
          <button
            onClick={handleOpslaan}
            disabled={bezig}
            className="bg-[#1A2E4A] text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-[#152438] disabled:opacity-50"
          >
            Opslaan
          </button>
        </div>
      </div>
    </main>
  );
}
