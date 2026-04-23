import { db } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NuevoProveedorButton, EditProveedorButton, DeleteProveedorButton } from "@/components/admin/ProviderActions"
import { Briefcase, MapPin, Phone, Building2, AtSign } from "lucide-react"

export default async function AdminProveedoresPage() {
  const providers = await db.provider.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Proveedores
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Directorio de proveedores para producciones, audio, pistas y más.
          </p>
        </div>
        <NuevoProveedorButton />
      </div>

      <div className="border border-border/40 rounded-xl bg-card/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent bg-black/40">
              <TableHead className="text-primary font-bold w-[250px]">Nombre y Empresa</TableHead>
              <TableHead className="text-primary font-bold">Contacto</TableHead>
              <TableHead className="text-primary font-bold">Rubro</TableHead>
              <TableHead className="text-primary font-bold">Dirección</TableHead>
              <TableHead className="text-primary font-bold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Aún no hay proveedores registrados.
                </TableCell>
              </TableRow>
            ) : providers.map((provider) => (
              <TableRow key={provider.id} className="hover:bg-white/[0.02] transition-colors border-border/40">
                
                {/* Nombre y Empresa */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{provider.name}</div>
                      {provider.company && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" /> {provider.company}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Contacto */}
                <TableCell className="py-4 align-top">
                  <div className="space-y-1.5">
                    {provider.whatsapp && (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <Phone className="w-3.5 h-3.5" />
                        {provider.whatsapp}
                      </div>
                    )}
                    {provider.contactInfo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AtSign className="w-3.5 h-3.5" />
                        {provider.contactInfo}
                      </div>
                    )}
                    {!provider.whatsapp && !provider.contactInfo && (
                      <span className="text-xs text-muted-foreground/50">Sin contacto</span>
                    )}
                  </div>
                </TableCell>

                {/* Rubro */}
                <TableCell className="py-4 align-top">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize">
                    {provider.serviceType}
                  </Badge>
                </TableCell>

                {/* Dirección */}
                <TableCell className="py-4 align-top">
                  {provider.address ? (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-[200px]">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="truncate">{provider.address}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Acciones */}
                <TableCell className="py-4 text-right align-top">
                  <div className="flex items-center gap-1 justify-end">
                    <EditProveedorButton provider={provider} />
                    <DeleteProveedorButton providerId={provider.id} />
                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
