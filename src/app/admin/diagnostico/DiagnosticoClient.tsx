"use client";

import { useState } from "react";
import { autoFixBooking } from "@/actions/diagnostico";

interface DiagnosticResult {
  id: string;
  clientName: string;
  requestedDate: Date;
  flags: string[];
  hasIssues: boolean;
}

export default function DiagnosticoClient({ initialData }: { initialData: DiagnosticResult[] }) {
  const [data, setData] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const issuesOnly = data.filter(d => d.hasIssues);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diagnóstico de Datos</h1>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium">
          {issuesOnly.length} eventos con problemas detectados
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Cliente (Booking)</th>
              <th className="px-6 py-3 font-medium">Problemas (Flags)</th>
              <th className="px-6 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {issuesOnly.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No se detectaron problemas en los eventos activos.
                </td>
              </tr>
            ) : (
              issuesOnly.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4  text-gray-900">
                    {new Date(item.requestedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4  text-gray-900">
                    {item.clientName}
                  </td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside text-red-600 space-y-1">
                      {item.flags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 ">
                    <button 
                      className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      disabled={loadingId === item.id}
                      onClick={() => alert('Función de Bulk Fix en desarrollo')}
                    >
                      Reparar (WIP)
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
