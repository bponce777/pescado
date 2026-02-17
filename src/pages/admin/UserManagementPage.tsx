import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Users, UserCheck, UserX, Edit, Trash2, CheckCircle } from 'lucide-react'

interface Profile {
  id: string
  email: string
  role: 'admin' | 'vendedor' | 'supervisor'
  is_active: boolean
  created_at: string
  updated_at: string
}

export function UserManagementPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [editIsActive, setEditIsActive] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading profiles:', error)
      toast.error('Error al cargar usuarios')
      setLoading(false)
      return
    }

    setProfiles(data || [])
    setLoading(false)
  }

  const handleActivate = async (profile: Profile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', profile.id)

    if (error) {
      console.error('Error activating user:', error)
      toast.error('Error al activar usuario')
      return
    }

    toast.success(`Usuario ${profile.email} activado`)
    loadProfiles()
  }

  const handleDeactivate = async (profile: Profile) => {
    if (profile.role === 'admin') {
      toast.error('No puedes desactivar un administrador')
      return
    }

    if (!confirm(`¿Desactivar al usuario ${profile.email}?`)) return

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', profile.id)

    if (error) {
      console.error('Error deactivating user:', error)
      toast.error('Error al desactivar usuario')
      return
    }

    toast.success(`Usuario ${profile.email} desactivado`)
    loadProfiles()
  }

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setEditRole(profile.role)
    setEditIsActive(profile.is_active)
  }

  const handleSaveEdit = async () => {
    if (!editingProfile) return

    if (editingProfile.role === 'admin' && editRole !== 'admin') {
      toast.error('No puedes cambiar el rol de un administrador')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        role: editRole as 'admin' | 'vendedor' | 'supervisor',
        is_active: editIsActive
      })
      .eq('id', editingProfile.id)

    if (error) {
      console.error('Error updating user:', error)
      toast.error('Error al actualizar usuario')
      return
    }

    toast.success('Usuario actualizado')
    setEditingProfile(null)
    loadProfiles()
  }

  const handleDelete = async (profile: Profile) => {
    if (profile.role === 'admin') {
      toast.error('No puedes eliminar un administrador')
      return
    }

    if (!confirm(`¿Eliminar al usuario ${profile.email}? Esta acción no se puede deshacer.`)) return

    // Eliminar el usuario de auth.users (esto también eliminará el perfil por CASCADE)
    const { error } = await supabase.auth.admin.deleteUser(profile.id)

    if (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar usuario')
      return
    }

    toast.success('Usuario eliminado')
    loadProfiles()
  }

  const pendingProfiles = profiles.filter(p => !p.is_active)
  const activeProfiles = profiles.filter(p => p.is_active)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Gestión de Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Administra permisos y accesos
        </p>
      </div>

      {/* Usuarios Pendientes */}
      {pendingProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-orange-500" />
              <CardTitle>Usuarios Pendientes de Aprobación</CardTitle>
            </div>
            <CardDescription>
              Estos usuarios esperan ser activados para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{profile.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Registrado: {new Date(profile.created_at).toLocaleDateString('es-CO')}
                    </p>
                    <Badge variant="secondary">{profile.role}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleActivate(profile)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Activar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(profile)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usuarios Activos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <CardTitle>Usuarios Activos</CardTitle>
          </div>
          <CardDescription>
            {activeProfiles.length} usuario{activeProfiles.length !== 1 ? 's' : ''} con acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeProfiles.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay usuarios activos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.email}</TableCell>
                      <TableCell>
                        <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                          {profile.role === 'admin' ? '👑 ' : ''}
                          {profile.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">Activo</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(profile)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          {profile.role !== 'admin' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeactivate(profile)}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Desactivar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(profile)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edición */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica el rol y estado del usuario
            </DialogDescription>
          </DialogHeader>

          {editingProfile && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm font-medium">{editingProfile.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select
                  value={editRole}
                  onValueChange={setEditRole}
                  disabled={editingProfile.role === 'admin'}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
                {editingProfile.role === 'admin' && (
                  <p className="text-xs text-muted-foreground">
                    No se puede cambiar el rol de un administrador
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Estado Activo</Label>
                <Button
                  type="button"
                  variant={editIsActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditIsActive(!editIsActive)}
                  disabled={editingProfile.role === 'admin'}
                >
                  {editIsActive ? 'Activo' : 'Inactivo'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
