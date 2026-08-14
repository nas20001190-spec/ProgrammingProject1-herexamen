"use client";

import { useState, useEffect } from "react";
import Topbar from "../component/topbar";
import { fetchMetAuth } from "@/app/lib/fetchMetAuth";

export default function Documenten() {
  const [documenten, setDocumenten] = useState([]);
  const [stage, setStage] = useState(null);
  const [overeenkomst, setOvereenkomst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchMetAuth("/api/student/documenten").then((r) => r?.json()),
      fetchMetAuth("/api/student/stage").then((r) => r?.json()),
    ])
      .then(([docsData, stageData]) => {
        setDocumenten(docsData ?? []);
        const actief = Array.isArray(stageData)
          ? stageData.find((s) => s.status === "actief")
          : null;
        if (actief) {
          setStage(actief);
          fetchMetAuth(
            `/api/student/documenten/ondertekenen?stage_id=${actief.id}`,
          )
            .then((r) => r?.json())
            .then((data) => {
              if (data && !data.fout) setOvereenkomst(data);
            });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOndertekenen = async () => {
    if (!stage) return;
    setBezig(true);
    const response = await fetchMetAuth(
      "/api/student/documenten/ondertekenen",
      {
        method: "PUT",
        body: JSON.stringify({ stage_id: stage.id }),
      },
    );
    if (!response) {
      setBezig(false);
      return;
    }
    const data = await response.json();
    if (response.ok) {
      // Relaad de overeenkomst status
      const refresh = await fetchMetAuth(
        `/api/student/documenten/ondertekenen?stage_id=${stage.id}`,
      );
      const refreshData = await refresh?.json();
      if (refreshData && !refreshData.fout) setOvereenkomst(refreshData);
    } else {
      alert(data.fout || "Er ging iets mis");
    }
    setBezig(false);
  };

  const handleDownload = () => {
    if (!stage) return;
    window.open(`/api/admin/stages/${stage.id}/pdf`, "_blank");
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Laden...</div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <Topbar titel="Documenten" subtitel={stage?.bedrijf_naam ?? "Stage"} />
      <div className="flex-1 bg-gray-100 p-6 space-y-4">
        {/* Stageovereenkomst */}
        {stage && (
          <div className="bg-white rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Stageovereenkomst
            </h2>
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Stageovereenkomst — {stage.bedrijf_naam}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        overeenkomst?.signed_student &&
                        overeenkomst?.signed_stagementor
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {overeenkomst?.signed_student &&
                      overeenkomst?.signed_stagementor
                        ? "Volledig ondertekend"
                        : overeenkomst?.signed_student
                          ? "Jij hebt ondertekend — wacht op stagementor"
                          : "Wacht op ondertekening"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!overeenkomst?.signed_student && (
                  <button
                    onClick={handleOndertekenen}
                    disabled={bezig}
                    className="px-3 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg cursor-pointer font-medium disabled:opacity-50"
                  >
                    {bezig ? "Bezig..." : "Ondertekenen"}
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Andere documenten */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Mijn documenten
              </h2>
              {documenten.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Geen documenten gevonden.
                </p>
              ) : (
                <div className="space-y-3">
                  {documenten.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">doc</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.bestandsnaam}
                          </div>
                          <div className="text-xs text-gray-400">
                            Geüpload door {doc.uploader_voornaam}{" "}
                            {doc.uploader_achternaam} ·{" "}
                            {new Date(doc.uploaded_op).toLocaleDateString(
                              "nl-BE",
                            )}{" "}
                            · {doc.bestandsgrootte_kb} KB
                          </div>
                        </div>
                      </div>
                      <button className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 h-fit">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Info</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Upload hier alle documenten die nodig zijn voor je stage. Zorg dat
              de stageovereenkomst correct ondertekend is door alle partijen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
