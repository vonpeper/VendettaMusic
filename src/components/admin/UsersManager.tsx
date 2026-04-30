"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Shield, UserPlus, Key, Trash2, Mail, User, ShieldCheck, ShieldAlert, Loader2, UserCog } from "lucide-react"
import { toast } from "sonner"
import { createUserAction, changePasswordAction, deleteUserAction } from "@/actions/users"

interface UsersManagerProps {
  users: any[]
  currentUserId: string
}

export function UsersManager({ users, currentUserId }: UsersManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsPending(true)
    const res = await createUserAction(formData)
    setIsPending(false)
    
    if (res.success) {
      toast.success(res.message)
      setIsCreateOpen(false)
    } else {
      toast.error(res.message)
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsPending(true)
    formData.append("userId", selectedUser.id)
    
    const res = await changePasswordAction(formData)
    setIsPending(false)
    
    if (res.success) {
      toast.success(res.message)
      setIsPasswordOpen(false)
      setSelectedUser(null)
    } else {
      toast.error(res.message)
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return
    
    setIsPending(true)
    const res = await deleteUserAction(userId)
    setIsPending(false)
    
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-black text-foreground tracking-tight">Gestión de <span className="text-primary">Usuarios</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Control de acceso y roles del panel administrativo.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              <UserPlus className="w-5 h-5" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading font-black text-xl uppercase tracking-tight">Crear Usuario</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo usuario y asigna su rol.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" placeholder="Ej. Juan Pérez" required className="bg-muted/50 border-border/40" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@vendetta.mx" required className="bg-muted/50 border-border/40" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rol de Usuario</Label>
                  <Select name="role" defaultValue="ADMIN">
                    <SelectTrigger className="bg-muted/50 border-border/40">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador (Acceso Total)</SelectItem>
                      <SelectItem value="AGENTE">Agente (Solo Operativo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required minLength={6} className="bg-muted/50 border-border/40" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="bg-muted/50 border-border/40" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full bg-primary font-bold h-11">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Dar de Alta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Usuario</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Rol</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Creado</TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs border border-primary/20">
                        {user.name?.charAt(0) || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          {user.name}
                          {user.id === currentUserId && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">TÚ</Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3 opacity-40" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] font-black tracking-widest uppercase ${user.role === 'ADMIN' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {user.role === 'ADMIN' ? <Shield className="w-3 h-3 mr-1" /> : <UserCog className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("es-MX", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg border-border/40 hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsPasswordOpen(true)
                        }}
                        title="Cambiar Contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      
                      {user.id !== currentUserId && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg border-border/40 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          onClick={() => handleDelete(user.id)}
                          title="Eliminar Usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogo Cambio de Contraseña */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <DialogTitle className="font-heading font-black text-xl uppercase tracking-tight flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> Cambiar Contraseña
              </DialogTitle>
              <DialogDescription>
                Actualiza la contraseña para <strong>{selectedUser?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="changePassword">Nueva Contraseña</Label>
                <Input id="changePassword" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" className="bg-muted/50 border-border/40" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmChangePassword">Confirmar Nueva Contraseña</Label>
                <Input id="confirmChangePassword" name="confirmPassword" type="password" required minLength={6} className="bg-muted/50 border-border/40" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full bg-primary font-bold h-11">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Actualizar Contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Roles y Permisos</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>ADMIN:</strong> Acceso total a finanzas, configuración, gestión de usuarios y catálogo.<br/>
            <strong>AGENTE:</strong> Acceso limitado a la agenda, clientes, proveedores y centro de ventas. No tiene acceso a métricas financieras ni configuraciones críticas.
          </p>
        </div>
      </div>
    </div>
  )
}
