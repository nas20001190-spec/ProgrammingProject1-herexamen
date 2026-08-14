"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

const statusBadge = (status) => {
  const stijlen = {
    goedgekeurd: "bg-green-50 text-green-700 border border-green-200",
    ingediend: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    aanpassingen: "bg-orange-50 text-orange-700 border border-orange-200",
    afgekeurd: "bg-red-50 text-red-700 border border-red-200",
    concept: "bg-gray-100 text-gray-600 border border-gray-200",
    actief: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  const labels = {
    goedgekeurd: "✓ Goedgekeurd",
    ingediend: "In behandeling",
    aanpassingen: "Aanpassingen nodig",
    afgekeurd: "Afgekeurd",
    concept: "Concept",
    actief: "Actief",
  };
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-medium ${stijlen[status] || stijlen.concept}`}
    >
      {labels[status] || status}
    </span>
  );
};

export default function StageAanvragen() {
  const router = useRouter();
  const [aanvragen, setAanvragen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [commentaar, setCommentaar] = useState({});
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    fetchMetAuth("/api/student/stage")
      .then((res) => res?.json())
      .then((data) => {
        setAanvragen(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const voerActieUit = async (stageId, actie) => {
    if (actie === "aanpassen" && !commentaar[stageId]?.trim()) {
      alert(
        'Voeg een commentaar toe of klik op "Aanvraag bewerken" om je aanvraag te wijzigen.',
      );
      return;
    }
    const bevestig = {
      accepteren:
        "Weet je zeker dat je deze stage wilt accepteren? Alle andere aanvragen worden verwijderd.",
      weigeren: "Weet je zeker dat je deze stage wilt weigeren?",
      aanpassen: "Aanpassingen indienen?",
    };
    if (!window.confirm(bevestig[actie])) return;

    setBezig(true);
    const response = await fetchMetAuth(`/api/student/stage/${stageId}`, {
      method: "PUT",
      body: JSON.stringify({
        actie,
        commentaar_student: commentaar[stageId] || null,
      }),
    });
    if (!response) {
      setBezig(false);
      return;
    }
    const data = await response.json();
    if (response.ok) {
      alert(data.bericht);
      fetchMetAuth("/api/student/stage")
        .then((res) => res?.json())
        .then((d) => setAanvragen(d ?? []));
      setOpenId(null);
    } else {
      alert(data.fout || "Er ging iets mis");
    }
    setBezig(false);
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        titel="Mijn stageaanvragen"
        subtitel="Dashboard · Stageaanvragen"
        rechts={
          <button
            onClick={() => router.push("/student/stage/nieuw")}
            className="px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg cursor-pointer font-medium"
          >
            Nieuwe aanvraag
          </button>
        }
      />
      <div className="flex-1 bg-gray-100 p-6 space-y-3">
        {aanvragen.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">
              Geen stageaanvragen gevonden.
            </p>
            <button
              onClick={() => router.push("/student/stage/nieuw")}
              className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg cursor-pointer"
            >
              Eerste aanvraag indienen
            </button>
          </div>
        ) : (
          aanvragen.map((aanvraag) => (
            <div
              key={aanvraag.id}
              className="bg-white rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() =>
                  setOpenId(openId === aanvraag.id ? null : aanvraag.id)
                }
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    {aanvraag.bedrijf_naam}
                  </div>
                  <div className="text-xs text-gray-400">
                    {aanvraag.startdatum
                      ? new Date(aanvraag.startdatum).toLocaleDateString(
                          "nl-BE",
                        )
                      : "—"}{" "}
                    · Toegepaste Informatica
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(aanvraag.status)}
                  <span className="text-gray-400 text-sm">
                    {openId === aanvraag.id ? "∧" : "∨"}
                  </span>
                </div>
              </div>

              {openId === aanvraag.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 mt-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Bedrijf</div>
                      <div className="text-sm font-medium">
                        {aanvraag.bedrijf_naam}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Stagementor
                      </div>
                      <div className="text-sm font-medium">
                        {aanvraag.mentor_voornaam} {aanvraag.mentor_achternaam}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Begeleider EhB
                      </div>
                      <div className="text-sm font-medium">
                        {aanvraag.docent_voornaam} {aanvraag.docent_achternaam}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Startdatum
                      </div>
                      <div className="text-sm font-medium">
                        {aanvraag.startdatum
                          ? new Date(aanvraag.startdatum).toLocaleDateString(
                              "nl-BE",
                            )
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Einddatum
                      </div>
                      <div className="text-sm font-medium">
                        {aanvraag.einddatum
                          ? new Date(aanvraag.einddatum).toLocaleDateString(
                              "nl-BE",
                            )
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Status</div>
                      <div className="text-sm font-medium">
                        {aanvraag.status}
                      </div>
                    </div>
                  </div>

                  {aanvraag.feedback_commissie && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-3">
                      <strong>Feedback admin:</strong>{" "}
                      {aanvraag.feedback_commissie}
                    </div>
                  )}

                  {aanvraag.status === "goedgekeurd" && (
                    <div className="mt-4 flex flex-col gap-3">
                      <p className="text-sm text-gray-600">
                        Je stage is goedgekeurd! Wil je deze stage accepteren?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            voerActieUit(aanvraag.id, "accepteren")
                          }
                          disabled={bezig}
                          className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          ✓ Accepteren
                        </button>
                        <button
                          onClick={() => voerActieUit(aanvraag.id, "weigeren")}
                          disabled={bezig}
                          className="px-5 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          ✗ Weigeren
                        </button>
                      </div>
                    </div>
                  )}

                  {aanvraag.status === "aanpassingen" && (
                    <div className="mt-4 flex flex-col gap-3">
                      <textarea
                        value={commentaar[aanvraag.id] || ""}
                        onChange={(e) =>
                          setCommentaar({
                            ...commentaar,
                            [aanvraag.id]: e.target.value,
                          })
                        }
                        placeholder="Voeg een commentaar toe (verplicht bij opnieuw indienen zonder bewerken)..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/student/stage/${aanvraag.id}/bewerken`,
                            )
                          }
                          className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-50"
                        >
                          Aanvraag bewerken
                        </button>
                        <button
                          onClick={() => voerActieUit(aanvraag.id, "aanpassen")}
                          disabled={bezig}
                          className="px-5 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg font-medium hover:bg-[#162d4a] disabled:opacity-50"
                        >
                          Opnieuw indienen met commentaar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
