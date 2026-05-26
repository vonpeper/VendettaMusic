import re

with open("src/components/admin/MasterEventsTable.tsx", "r") as f:
    content = f.read()

# 1. Update Table container and Table
content = content.replace(
    '<div className="overflow-x-auto">',
    '<div className="md:overflow-x-auto">'
)
content = content.replace(
    '<Table className="min-w-[1400px]">',
    '<Table className="w-full block md:table">'
)

# 2. Update TableHeader
content = content.replace(
    '<TableHeader>',
    '<TableHeader className="hidden md:table-header-group">'
)

# 3. Update TableBody
content = content.replace(
    '<TableBody>',
    '<TableBody className="block md:table-row-group p-4 md:p-0 space-y-4 md:space-y-0">'
)

# 4. Empty state row
content = content.replace(
    '<TableRow>',
    '<TableRow className="block md:table-row">'
)
content = content.replace(
    '<TableCell colSpan={8} className="text-center py-20 text-muted-foreground">',
    '<TableCell colSpan={8} className="block md:table-cell text-center py-20 text-muted-foreground">'
)

# 5. Main Loop TableRow
content = content.replace(
    '<TableRow key={evt.id} className="border-border/40 align-top hover:bg-blue-600/5 transition-colors">',
    '<TableRow key={evt.id} className="block md:table-row bg-card md:bg-transparent border border-border/40 md:border-b rounded-xl md:rounded-none p-4 md:p-0 mb-4 md:mb-0 align-top hover:bg-blue-600/5 transition-colors relative">'
)

# 6. TableCells
content = content.replace(
    '<TableCell className="py-6 pl-8">',
    '<TableCell className="block md:table-cell py-3 md:py-6 md:pl-8 border-b border-border/10 md:border-none flex justify-between items-center md:items-start">'
)
content = content.replace(
    '<TableCell className="py-6 min-w-[300px]">',
    '<TableCell className="block md:table-cell py-3 md:py-6 md:min-w-[300px] border-b border-border/10 md:border-none">'
)
content = content.replace(
    '<TableCell className="py-6">',
    '<TableCell className="block md:table-cell py-3 md:py-6 border-b border-border/10 md:border-none">'
)
content = content.replace(
    '<TableCell className="py-6 text-right pr-8">',
    '<TableCell className="block md:table-cell py-3 md:py-6 md:text-right md:pr-8 flex justify-end">'
)

with open("src/components/admin/MasterEventsTable.tsx", "w") as f:
    f.write(content)

