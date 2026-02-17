import { useState, useEffect } from 'react'
import { History, ShoppingCart, Trash2, Calendar, User, FileText, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FishLoader } from '@/components/FishLoader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Historial() {
  const [isLoading, setIsLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading sales:', error)
      toast.error('Error al cargar ventas')
      setIsLoading(false)
      return
    }

    setSales(data || [])
    setIsLoading(false)
  }

  const handleDeleteSale = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sale:', error)
      toast.error('Error al eliminar venta')
      return
    }

    toast.success('Venta eliminada')
    loadSales()
  }

  const handleClearAll = async () => {
    if (!confirm('¿Estás seguro de eliminar TODAS las ventas? Esta acción no se puede deshacer.')) return

    const { error } = await supabase
      .from('sales')
      .delete()
      .neq('id', 0) // Delete all rows

    if (error) {
      console.error('Error clearing sales:', error)
      toast.error('Error al eliminar ventas')
      return
    }

    toast.success('Todas las ventas eliminadas')
    setSales([])
  }

  // Filtrar ventas por estado
  const filteredSales = sales.filter(sale => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'paid') return sale.balance === 0
    if (filterStatus === 'partial') return sale.paid > 0 && sale.balance > 0
    if (filterStatus === 'pending') return sale.paid === 0
    return true
  })

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)

  if (isLoading) {
    return <FishLoader text="Cargando ventas..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Historial de Ventas
          </h2>
          <p className="text-muted-foreground">
            Registro completo de todas las transacciones
          </p>
        </div>
        {sales.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleClearAll}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Todo
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <label className="text-sm font-medium">Filtrar por estado:</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="partial">Pago Parcial</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredSales.length} de {sales.length} ventas
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredSales.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transacciones {filterStatus !== 'all' ? 'filtradas' : 'registradas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${totalSales.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total {filterStatus !== 'all' ? 'filtrado' : 'acumulado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${filteredSales.length > 0 ? Math.round(totalSales / filteredSales.length).toLocaleString('es-CO') : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por transacción
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Ventas</CardTitle>
          <CardDescription>
            Listado detallado de transacciones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay ventas registradas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza registrando tu primera venta
              </p>
              <Button onClick={() => window.location.href = '/ventas'}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay ventas con este filtro</h3>
              <p className="text-muted-foreground mb-4">
                Intenta cambiar el filtro o ver todas las ventas
              </p>
              <Button variant="outline" onClick={() => setFilterStatus('all')}>
                Ver Todas
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-primary/10">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{sale.product}</div>
                            {sale.notes && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                {sale.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{sale.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${sale.price.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary">
                          ${sale.total.toLocaleString('es-CO')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{sale.customer_name || 'Cliente General'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(sale.created_at).toLocaleString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSale(sale.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
