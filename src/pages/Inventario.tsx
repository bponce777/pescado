import { useState, useEffect } from 'react'
import { Package, Plus, Edit, Trash2, AlertTriangle, Filter, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { InventarioSkeleton } from '@/components/PageSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  min_stock: number
  cost_per_unit: number
  notes: string | null
  created_at: string
  updated_at: string
}

type StockStatus = 'sin-stock' | 'bajo' | 'ok'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseCurrency = (value: string): number =>
  parseInt(value.replace(/\./g, '') || '0')

const formatCurrencyInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  return parseInt(numbers).toLocaleString('es-CO')
}

function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity === 0) return 'sin-stock'
  if (item.quantity <= item.min_stock) return 'bajo'
  return 'ok'
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function Inventario() {
  // ── Data state ──
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ── Filter state ──
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStock, setFilterStock] = useState<string>('all')

  // ── Dialog state ──
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // ── Form state ──
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    quantity: '',
    unit: 'unidad',
    min_stock: '',
    cost_per_unit: '',
    notes: '',
  })

  // ── Load on mount ──
  useEffect(() => {
    loadItems()
  }, [])

  // ─── Supabase queries ─────────────────────────────────────────────────────

  const loadItems = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading inventory:', error)
      toast.error('Error al cargar el inventario')
      setIsLoading(false)
      return
    }

    setItems(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del ingrediente es obligatorio')
      return
    }

    const quantity = parseFloat(formData.quantity)
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }

    const min_stock = parseFloat(formData.min_stock)
    if (isNaN(min_stock) || min_stock < 0) {
      toast.error('Ingresa un stock mínimo válido')
      return
    }

    const cost_per_unit = parseCurrency(formData.cost_per_unit)

    setIsSaving(true)

    if (editingItem) {
      const { error } = await supabase
        .from('inventory')
        .update({
          name: formData.name.trim(),
          category: formData.category,
          quantity,
          unit: formData.unit,
          min_stock,
          cost_per_unit,
          notes: formData.notes.trim() || null,
        })
        .eq('id', editingItem.id)

      if (error) {
        console.error('Error updating item:', error)
        toast.error('Error al actualizar el ingrediente')
        setIsSaving(false)
        return
      }

      toast.success('Ingrediente actualizado')
    } else {
      const { error } = await supabase
        .from('inventory')
        .insert({
          name: formData.name.trim(),
          category: formData.category,
          quantity,
          unit: formData.unit,
          min_stock,
          cost_per_unit,
          notes: formData.notes.trim() || null,
        })

      if (error) {
        console.error('Error inserting item:', error)
        toast.error('Error al agregar el ingrediente')
        setIsSaving(false)
        return
      }

      toast.success('Ingrediente agregado')
    }

    setIsSaving(false)
    cancelForm()
    loadItems()
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`¿Eliminar "${item.name}" del inventario?`)) return

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', item.id)

    if (error) {
      console.error('Error deleting item:', error)
      toast.error('Error al eliminar el ingrediente')
      return
    }

    toast.success('Ingrediente eliminado')
    loadItems()
  }

  // ─── UI helpers ───────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingItem(null)
    setFormData({ name: '', category: 'General', quantity: '', unit: 'unidad', min_stock: '', cost_per_unit: '', notes: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      min_stock: item.min_stock.toString(),
      cost_per_unit: item.cost_per_unit > 0 ? item.cost_per_unit.toLocaleString('es-CO') : '',
      notes: item.notes ?? '',
    })
    setIsDialogOpen(true)
  }

  const cancelForm = () => {
    setEditingItem(null)
    setFormData({ name: '', category: 'General', quantity: '', unit: 'unidad', min_stock: '', cost_per_unit: '', notes: '' })
    setIsDialogOpen(false)
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const lowStockItems = items.filter(item => getStockStatus(item) !== 'ok')

  const categories = Array.from(new Set(items.map(i => i.category))).sort()

  const filteredItems = items.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory
    const status = getStockStatus(item)
    const stockMatch =
      filterStock === 'all' ||
      (filterStock === 'ok' && status === 'ok') ||
      (filterStock === 'bajo' && status === 'bajo') ||
      (filterStock === 'sin-stock' && status === 'sin-stock')
    return categoryMatch && stockMatch
  })

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.cost_per_unit, 0)

  // ─── Status badge ─────────────────────────────────────────────────────────

  function StockBadge({ item }: { item: InventoryItem }) {
    const status = getStockStatus(item)
    if (status === 'sin-stock') {
      return <Badge variant="destructive">Sin stock</Badge>
    }
    if (status === 'bajo') {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          Stock bajo
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-white">
        OK
      </Badge>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <InventarioSkeleton />
  }

  return (
    <>
      {isSaving && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      )}

      <div className="space-y-6 px-4 md:px-0">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl flex items-center gap-2">
              <Package className="h-8 w-8" />
              Inventario
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
              Control de ingredientes y materias primas
            </p>
          </div>
          <Button size="lg" onClick={openAddDialog}>
            <Plus className="mr-2 h-5 w-5" />
            Agregar Ingrediente
          </Button>
        </div>

        {/* ── Low-stock Alert Banner ── */}
        {lowStockItems.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'ingrediente con stock crítico' : 'ingredientes con stock crítico'}
              </p>
              <p className="mt-0.5 text-sm text-yellow-700 dark:text-yellow-500">
                {lowStockItems.map(i => i.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ingredientes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Registrados en inventario</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {lowStockItems.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lowStockItems.length === 0 ? 'Todo en orden' : 'Requieren atención'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${totalValue.toLocaleString('es-CO')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Costo total del inventario</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Filter className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Categoría:</label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Stock:</label>
                  <Select value={filterStock} onValueChange={setFilterStock}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ok">OK</SelectItem>
                      <SelectItem value="bajo">Stock bajo</SelectItem>
                      <SelectItem value="sin-stock">Sin stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <span className="text-sm text-muted-foreground sm:ml-auto">
                {filteredItems.length} de {items.length} ingredientes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Table ── */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
            <CardDescription>Listado de materias primas e ingredientes</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <Package className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay ingredientes registrados</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza agregando tu primer ingrediente al inventario
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Ingrediente
                </Button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay ingredientes con este filtro</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta cambiar los filtros para ver más resultados
                </p>
                <Button variant="outline" onClick={() => { setFilterCategory('all'); setFilterStock('all') }}>
                  Ver Todos
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Mín.</TableHead>
                      <TableHead className="text-right">Costo/u.</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground">{item.notes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.min_stock.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.cost_per_unit.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ${(item.quantity * item.cost_per_unit).toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <StockBadge item={item} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
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

        {/* ── Add/Edit Dialog ── */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Modifica los datos del ingrediente'
                  : 'Completa los datos para agregar un ingrediente al inventario'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inv-name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="inv-name"
                  placeholder="Ej: Arroz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-category">Categoría</Label>
                  <Input
                    id="inv-category"
                    placeholder="Ej: Granos, Proteínas"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-unit">Unidad</Label>
                  <Input
                    id="inv-unit"
                    placeholder="Ej: kg, litro, unidad"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-quantity">
                    Cantidad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inv-quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-min-stock">Stock Mínimo</Label>
                  <Input
                    id="inv-min-stock"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-cost">Costo por Unidad ($)</Label>
                <Input
                  id="inv-cost"
                  placeholder="0"
                  value={formData.cost_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_unit: formatCurrencyInput(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-notes">Notas (opcional)</Label>
                <Input
                  id="inv-notes"
                  placeholder="Observaciones adicionales"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={cancelForm}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {editingItem ? 'Actualizar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}
