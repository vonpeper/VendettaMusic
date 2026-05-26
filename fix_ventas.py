import re

with open("src/components/admin/VentasTableClient.tsx", "r") as f:
    content = f.read()

# 1. Update table
content = content.replace(
    '<table className="min-w-[900px] w-full text-left border-collapse">',
    '<table className="w-full text-left border-collapse block md:table">'
)

# 2. Update thead
content = content.replace(
    '<thead>',
    '<thead className="hidden md:table-header-group">'
)

# 3. Update tbody
content = content.replace(
    '<tbody className="divide-y divide-white/5">',
    '<tbody className="block md:table-row-group divide-y-0 md:divide-y md:divide-white/5 p-4 md:p-0 space-y-4 md:space-y-0">'
)

# 4. Update empty results TR
content = content.replace(
    '<tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">Sin resultados para la búsqueda actual.</td></tr>',
    '<tr className="block md:table-row"><td colSpan={6} className="block md:table-cell px-6 py-12 text-center text-muted-foreground text-sm">Sin resultados para la búsqueda actual.</td></tr>'
)

# 5. Update main TR
content = content.replace(
    '''              <tr 
                key={reserva.id} 
                className={`hover:bg-blue-600/5 transition-colors group ${selectedIds.has(reserva.id) ? 'bg-blue-600/5' : ''}`}
              >''',
    '''              <tr 
                key={reserva.id} 
                className={`block md:table-row bg-card md:bg-transparent border border-border/40 md:border-none rounded-xl md:rounded-none p-4 md:p-0 hover:bg-blue-600/5 transition-colors group relative ${selectedIds.has(reserva.id) ? 'bg-blue-600/5' : ''}`}
              >'''
)

# 6. Update all TDs in the main loop
# Replace `<td className="px-6 py-4">` -> `<td className="flex justify-between items-center md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none">`
content = content.replace(
    '<td className="px-6 py-4">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center">'
)

# Specifically the last TD or ones with text-center/text-right
content = content.replace(
    '<td className="px-6 py-4 text-center">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-center">'
)
content = content.replace(
    '<td className="px-6 py-4 text-right">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-right">'
)
content = content.replace(
    '<td className="px-6 py-4 font-mono">',
    '<td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center font-mono">'
)

with open("src/components/admin/VentasTableClient.tsx", "w") as f:
    f.write(content)

