const fs = require('fs');
const path = 'src/app/admin/ventas/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `function ContratosGrid({ items, isCompleted }: { items: any[], isCompleted: boolean }) {
  if (items.length === 0) return (
    <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl">
      <p className="text-muted-foreground">
        {isCompleted ? "No hay contratos completados." : "Aún no hay contratos generados (eventos confirmados)."}
      </p>
    </div>
  )

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const now = new Date();
  const currentMonthKey = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}\`;

  const grouped: Record<string, any[]> = {};
  items.forEach(c => {
    const d = new Date(c.requestedDate);
    const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedKeys.map(key => {
        const [year, monthStr] = key.split('-');
        const monthName = MONTHS[parseInt(monthStr, 10) - 1];
        const isOpen = key === currentMonthKey || sortedKeys.length === 1 || sortedKeys[0] === key;

        return (
          <details key={key} open={isOpen} className="group border border-border/40 bg-card rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer p-4 hover:bg-muted/50 transition-colors list-none select-none">
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground capitalize text-lg">{monthName} {year}</span>
                <Badge variant="secondary" className="text-xs">{grouped[key].length}</Badge>
              </div>
              <div className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </summary>
            <div className="p-4 pt-0 border-t border-border/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {grouped[key].map(c => (
                  <Card key={c.id} className="bg-card border-border/20 group hover:border-green-500/30 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        {isCompleted ? (
                          <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 bg-blue-500/5">COMPLETADO</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 bg-green-500/5">AGENDADO</Badge>
                        )}
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-muted-foreground">{c.shortId}</span>
                        </div>
                      </div>
                      <CardTitle className="text-base mt-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          {(c as any).event?.customName ? (
                            <>
                              <span className="font-black">{(c as any).event.customName}</span>
                              <span className="text-xs text-muted-foreground font-normal ml-1">· {c.clientName}</span>
                            </>
                          ) : (
                            c.clientName
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 text-muted-foreground" /> {formatDateMX(c.requestedDate, "d 'de' MMMM")}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 text-muted-foreground" /> {c.startTime} a {c.endTime} HRS
                        </div>
                        
                        {/* Semáforo de Staff */}
                        <div className="pt-2">
                          {c.event?.musicians && c.event.musicians.length > 0 ? (
                            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-lg border border-border/20">
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Logística Staff</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full animate-pulse",
                                  c.event.musicians.every((m: any) => m.status === "confirmed") ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-bold",
                                  c.event.musicians.every((m: any) => m.status === "confirmed") ? "text-green-500" : "text-yellow-500"
                                )}>
                                  {c.event.musicians.filter((m: any) => m.status === "confirmed").length}/{c.event.musicians.length}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/10 p-2 rounded-lg border border-dashed border-border/40">
                              <AlertCircle className="w-3 h-3" /> Sin staff asignado
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-black text-foreground">{MXN(c.baseAmount + (c.viaticosAmount || 0))}</div>
                          <ContractStatusSwitcher bookingId={c.id} status={c.contractStatus || "pending"} />
                        </div>
                        <div className="flex gap-2">
                          {!isCompleted && (
                            <MarkCompletedButton bookingId={c.id} />
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            asChild
                            className="h-8 gap-2 border-green-600/30 text-green-400 hover:bg-green-600 hover:text-foreground" 
                          >
                            <a href={`/api/admin/contract/${c.id}`}>
                              <Download className="w-3 h-3" /> Contrato PDF
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}

function StatusBadge`;

content = content.replace(/function ContratosGrid[\s\S]*?function StatusBadge/, replacement);
fs.writeFileSync(path, content);
