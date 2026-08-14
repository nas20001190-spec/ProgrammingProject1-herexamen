"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

export default function DocentNieuwPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    voornaam: "",
    achternaam: "",
    email: "",
    wachtwoord: "",
    telefoon: "",
    rol: "docent",
  });

  const update = (veld, waarde) => setForm({ ...form, [veld]: waarde });

  const handleAanmaken = async () => {
    if (!form.voornaam || !form.achternaam || !form.email || !form.wachtwoord) {
      alert("Vul alle verplichte velden in.");
      return;
    }

    if (!window.confirm("Weet u zeker dat u deze docent wilt aanmaken?")) {
      return;
    }

    try {
      const response = await fetchMetAuth("/api/admin/gebruikers", {
        method: "POST",
        body: JSON.stringify({
          voornaam: form.voornaam,
          achternaam: form.achternaam,
          email: form.email,
          wachtwoord: form.wachtwoord,
          telefoon: form.telefoon,
          rol: "docent",
        }),
      });

      if (!response) return;

      const data = await response.json();

      if (response.ok) {
        alert("Docent aangemaakt!");
        router.push("/admin/docenten");
      } else {
        alert(data.fout || "Er ging iets mis.");
      }
    } catch (error) {
      console.error(error);
      alert("Fout bij aanmaken van docent.");
    }
  };

  const handleAnnuleren = () => {
    router.push("/admin/docenten");
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2E4A] focus:border-transparent";

  return (
    <main className="flex-1 flex flex-col">
      <Topbar title="Docent" />

      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Nieuwe docent aanmaken
        </h2>

        <p className="text-sm text-gray-400 mb-6">
          Voeg een nieuwe docent toe aan het systeem
        </p>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Voornaam</label>
              <input type="text" value={form.voornaam} onChange={(e) => update("voornaam", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Achternaam</label>
              <input type="text" value={form.achternaam} onChange={(e) => update("achternaam", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Wachtwoord</label>
              <input type="password" value={form.wachtwoord} onChange={(e) => update("wachtwoord", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Telefoon</label>
              <input type="tel" value={form.telefoon} onChange={(e) => update("telefoon", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Rol</label>
              <input type="text" value="docent" disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
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