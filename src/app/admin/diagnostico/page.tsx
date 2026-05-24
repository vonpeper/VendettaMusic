import { getSystemDiagnostics } from "@/actions/diagnostico";
import DiagnosticoClient from "./DiagnosticoClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnóstico de Datos | Admin",
};

export default async function DiagnosticoPage() {
  const diagnostics = await getSystemDiagnostics();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DiagnosticoClient initialData={diagnostics} />
    </div>
  );
}
