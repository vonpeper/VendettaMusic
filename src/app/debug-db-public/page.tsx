import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function DebugDbPage() {
  let errorMsg = null
  let bookingColumns: any[] = []
  let eventColumns: any[] = []
  let writeCheck = "success"

  try {
    // 1. Obtener info de columnas de BookingRequest
    const bookingCols = await db.$queryRaw<any[]>`PRAGMA table_info(BookingRequest)`
    bookingColumns = bookingCols.map(c => ({ name: c.name, type: c.type }))

    // 2. Obtener info de columnas de Event
    const eventCols = await db.$queryRaw<any[]>`PRAGMA table_info(Event)`
    eventColumns = eventCols.map(c => ({ name: c.name, type: c.type }))

    // 3. Chequeo de conexión
    await db.$queryRaw`SELECT 1`
  } catch (e: any) {
    errorMsg = {
      message: e.message,
      stack: e.stack,
    }
  }

  return (
    <div className="p-8 bg-slate-900 text-slate-100 min-h-screen font-mono text-xs">
      <h1 className="text-xl font-bold text-blue-400 mb-6">🤖 VENDETTA DATABASE DIAGNOSTIC PANEL</h1>
      
      {errorMsg ? (
        <div className="p-4 bg-red-950 border border-red-500/30 text-red-200 rounded-lg mb-6">
          <h2 className="text-sm font-bold uppercase mb-2">❌ Database Access Error:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(errorMsg, null, 2)}</pre>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950 border border-emerald-500/30 text-emerald-200 rounded-lg mb-6">
          ✔️ Database connection is active and responsive.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-blue-400 mb-2">BookingRequest Columns ({bookingColumns.length})</h2>
          <pre className="p-4 bg-slate-950 rounded border border-slate-800 max-h-[500px] overflow-y-auto">
            {JSON.stringify(bookingColumns, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-sm font-bold text-blue-400 mb-2">Event Columns ({eventColumns.length})</h2>
          <pre className="p-4 bg-slate-950 rounded border border-slate-800 max-h-[500px] overflow-y-auto">
            {JSON.stringify(eventColumns, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
