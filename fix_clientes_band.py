import re

# ================= ClientesTableClient.tsx =================

with open("src/components/admin/ClientesTableClient.tsx", "r") as f:
    c = f.read()

c = c.replace(
    '<table className="min-w-[900px] w-full text-left border-collapse">',
    '<table className="w-full text-left border-collapse block md:table">'
)
c = c.replace(
    '<thead>',
    '<thead className="hidden md:table-header-group">'
)
c = c.replace(
    '<tbody className="divide-y divide-white/5">',
    '<tbody className="block md:table-row-group divide-y-0 md:divide-y md:divide-white/5 p-4 md:p-0 space-y-4 md:space-y-0">'
)
c = c.replace(
    '<tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">No hay clientes con estos filtros.</td></tr>',
    '<tr className="block md:table-row"><td colSpan={6} className="block md:table-cell px-6 py-12 text-center text-muted-foreground text-sm">No hay clientes con estos filtros.</td></tr>'
)

# Replace the `<tr key=... className=...>` for clients
# Find the line starting with `<tr` inside the map
c = re.sub(
    r'<tr\s*key=\{cli\.id\}\s*className=\{`hover:bg-blue-600/5 transition-colors group \$\{.*?`\}\s*>',
    lambda m: m.group(0).replace('hover:bg-blue-600/5 transition-colors group', 'block md:table-row bg-card md:bg-transparent border border-border/40 md:border-none rounded-xl md:rounded-none p-4 md:p-0 hover:bg-blue-600/5 transition-colors group relative mb-4 md:mb-0'),
    c, flags=re.DOTALL
)

c = c.replace(
    '<td className="px-6 py-4">',
    '<td className="block md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none">'
)
c = c.replace(
    '<td className="px-6 py-4 text-center">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-center">'
)
c = c.replace(
    '<td className="px-6 py-4 text-right">',
    '<td className="flex justify-end md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-right">'
)

with open("src/components/admin/ClientesTableClient.tsx", "w") as f:
    f.write(c)


# ================= BandEventsClient.tsx =================

with open("src/components/admin/BandEventsClient.tsx", "r") as f:
    c = f.read()

c = c.replace(
    '<table className="min-w-[1100px] w-full text-left border-collapse">',
    '<table className="w-full text-left border-collapse block md:table">'
)
c = c.replace(
    '<thead className="sticky top-0 z-10 bg-card border-b border-border/40">',
    '<thead className="hidden md:table-header-group sticky top-0 z-10 bg-card border-b border-border/40">'
)
c = c.replace(
    '<tbody className="divide-y divide-border/10">',
    '<tbody className="block md:table-row-group divide-y-0 md:divide-y md:divide-border/10 p-4 md:p-0 space-y-4 md:space-y-0">'
)
c = c.replace(
    '<tr><td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">No se encontraron eventos para esta búsqueda.</td></tr>',
    '<tr className="block md:table-row"><td colSpan={10} className="block md:table-cell px-6 py-12 text-center text-muted-foreground">No se encontraron eventos para esta búsqueda.</td></tr>'
)

# The main <tr>
c = re.sub(
    r'<tr\s*key=\{reserva\.id\}\s*className="hover:bg-blue-600/5 transition-colors">',
    '<tr key={reserva.id} className="block md:table-row bg-card md:bg-transparent border border-border/40 md:border-none rounded-xl md:rounded-none p-4 md:p-0 hover:bg-blue-600/5 transition-colors mb-4 md:mb-0 relative">',
    c
)

c = c.replace(
    '<td className="px-6 py-4 whitespace-nowrap">',
    '<td className="block md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none whitespace-nowrap">'
)
c = c.replace(
    '<td className="px-6 py-4">',
    '<td className="block md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none">'
)
c = c.replace(
    '<td className="px-6 py-4 font-mono font-bold">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none font-mono font-bold items-center">'
)
c = c.replace(
    '<td className="px-6 py-4 text-center">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-center">'
)
c = c.replace(
    '<td className="px-6 py-4 text-right">',
    '<td className="flex justify-end md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-right">'
)

with open("src/components/admin/BandEventsClient.tsx", "w") as f:
    f.write(c)

