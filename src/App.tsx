import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Home, ShoppingCart, History, Menu, DollarSign, TrendingUp, Plus, Minus, Trash2, User, Eye, Banknote, FileDown, UtensilsCrossed, Filter } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Toaster, toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'
import { FishLoader } from '@/components/FishLoader'

type Dish = {
  id: number
  name: string
  price: number
  description: string
  active: boolean
}

function AppSidebar() {
  const currentPath = window.location.pathname

  const menuItems = [
    { href: '/', icon: Home, label: 'Dashboard', tooltip: 'Inicio' },
    { href: '/ventas', icon: ShoppingCart, label: 'Nueva Venta', tooltip: 'Registrar venta' },
    { href: '/historial', icon: History, label: 'Historial', tooltip: 'Ver historial' },
    { href: '/platos', icon: UtensilsCrossed, label: 'Platos', tooltip: 'Gestionar platos' },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-accent">
              <a href="/">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm text-2xl">
                  🐟
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-lg">Deisy&Brian</span>
                  <span className="text-xs text-muted-foreground font-medium">Sistema de Ventas</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-2 mb-2">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.tooltip}
                      className={isActive ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-accent/50'}
                    >
                      <a href={item.href} className="gap-3">
                        <Icon className={isActive ? 'h-5 w-5' : 'h-4 w-4'} />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-2 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Sistema Activo</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            © 2026 Deisy&Brian
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

async function generatePDF() {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    toast.error('Error al cargar las ventas')
    console.error(error)
    return
  }

  if (!sales || sales.length === 0) {
    toast.error('No hay ventas para exportar')
    return
  }

  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  })

  // Configurar codificación UTF-8
  doc.setLanguage('es')

  // Título
  doc.setFontSize(20)
  doc.text('Deisy&Brian', 14, 20)
  doc.setFontSize(12)
  doc.text('Reporte de Ventas', 14, 28)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 35)

  // Estadísticas
  const totalVentas = sales.length
  const totalIngresos = sales.reduce((sum: number, s: any) => sum + s.total, 0)
  const totalPagado = sales.reduce((sum: number, s: any) => sum + s.paid, 0)
  const totalPendiente = sales.reduce((sum: number, s: any) => sum + s.balance, 0)

  doc.setFontSize(11)
  doc.text(`Total Ventas: ${totalVentas}`, 14, 45)
  doc.text(`Total Ingresos: $${totalIngresos.toLocaleString('es-CO')}`, 14, 52)
  doc.text(`Total Pagado: $${totalPagado.toLocaleString('es-CO')}`, 14, 59)
  doc.text(`Total Pendiente: $${totalPendiente.toLocaleString('es-CO')}`, 14, 66)

  // Tabla de ventas
  const tableData = sales.map((sale: any) => [
    sale.customer_name || '',
    sale.product || '',
    sale.quantity.toString(),
    `$${sale.total.toLocaleString('es-CO')}`,
    `$${sale.paid.toLocaleString('es-CO')}`,
    `$${sale.balance.toLocaleString('es-CO')}`,
    new Date(sale.created_at).toLocaleDateString('es-CO')
  ])

  autoTable(doc, {
    startY: 75,
    head: [['Cliente', 'Producto', 'Cant.', 'Total', 'Pagado', 'Saldo', 'Fecha']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: {
      fontSize: 9,
      font: 'helvetica',
      fontStyle: 'normal'
    },
    didParseCell: function(data) {
      // Asegurar que el contenido se renderice correctamente
      if (data.cell.raw) {
        data.cell.text = [String(data.cell.raw)]
      }
    }
  })

  doc.save(`deisy-brian-ventas-${Date.now()}.pdf`)
  toast.success('PDF generado exitosamente')
}

function HomePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    todaySales: 0,
    pendingBalance: 0
  })

  useEffect(() => {
    const loadStats = async () => {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')

      if (error) {
        console.error('Error loading stats:', error)
        toast.error('Error al cargar estadísticas')
        return
      }

      const today = new Date().toDateString()
      const todaySales = sales?.filter((sale: any) =>
        new Date(sale.created_at).toDateString() === today
      ) || []

      setStats({
        totalSales: sales?.length || 0,
        totalRevenue: sales?.reduce((sum: number, sale: any) => sum + sale.total, 0) || 0,
        todaySales: todaySales.length,
        pendingBalance: sales?.reduce((sum: number, sale: any) => sum + sale.balance, 0) || 0
      })
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido a Deisy&Brian
        </p>
        <Button onClick={generatePDF} size="lg" className="mt-4">
          <FileDown className="mr-2 h-5 w-5" />
          Descargar PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todaySales} ventas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              ${stats.pendingBalance.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground">
              Por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSales > 0 ? Math.round(stats.totalRevenue / stats.totalSales).toLocaleString('es-CO') : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Por venta
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🐟 Plato del Día
            </CardTitle>
            <CardDescription>Pescado con arroz disponible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Pescado con arroz</h3>
                <p className="text-sm text-muted-foreground">Plato especial del día</p>
              </div>
              <Badge className="text-base px-3 py-1">
                $15.000
              </Badge>
            </div>
            <Button
              onClick={() => navigate('/ventas')}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Registrar Venta
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/ventas')}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nueva Venta
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/historial')}
            >
              <History className="mr-2 h-4 w-4" />
              Ver Historial
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/platos')}
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Gestionar Platos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function VentasPage() {
  const navigate = useNavigate()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [initialPayment, setInitialPayment] = useState('')

  useEffect(() => {
    const loadDishes = async () => {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        console.error('Error loading dishes:', error)
        toast.error('Error al cargar platos')
        return
      }

      const activeDishes = data || []
      setDishes(activeDishes)

      // Seleccionar "Pescado con arroz" por defecto
      const defaultDish = activeDishes.find((d: Dish) => d.name === 'Pescado con arroz') || activeDishes[0]
      setSelectedDish(defaultDish)
    }

    loadDishes()
  }, [])

  const handleAddSale = async () => {
    if (!customerName.trim()) {
      toast.error('El nombre del cliente es obligatorio')
      return
    }

    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (!selectedDish) {
      toast.error('Selecciona un plato')
      return
    }

    const payment = parseFloat(initialPayment) || 0
    const total = quantity * selectedDish.price

    if (payment < 0) {
      toast.error('El abono no puede ser negativo')
      return
    }

    if (payment > total) {
      toast.error('El abono no puede ser mayor al total')
      return
    }

    // Insert sale
    const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert({
        product: selectedDish.name,
        quantity,
        price: selectedDish.price,
        total,
        paid: payment,
        balance: total - payment,
        customer_name: customerName.trim(),
        notes: notes || null
      })
      .select()
      .single()

    if (saleError) {
      console.error('Error creating sale:', saleError)
      toast.error('Error al registrar venta')
      return
    }

    // Insert initial payment if provided
    if (payment > 0 && newSale) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          sale_id: newSale.id,
          amount: payment,
          note: 'Pago inicial'
        })

      if (paymentError) {
        console.error('Error creating payment:', paymentError)
        toast.warning('Venta creada pero error al registrar pago inicial')
      }
    }

    toast.success('Venta registrada exitosamente')

    setQuantity(1)
    setCustomerName('')
    setNotes('')
    setInitialPayment('')

    setTimeout(() => navigate('/historial'), 1000)
  }

  const total = selectedDish ? quantity * selectedDish.price : 0
  const payment = parseFloat(initialPayment) || 0
  const balance = total - payment

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Venta</h2>
        <p className="text-muted-foreground">
          Registra una nueva venta en el sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
            <CardDescription>
              Completa los detalles de la transacción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dish">
                  Plato <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedDish?.id.toString()}
                  onValueChange={(value) => {
                    const dish = dishes.find(d => d.id.toString() === value)
                    setSelectedDish(dish || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plato" />
                  </SelectTrigger>
                  <SelectContent>
                    {dishes.map((dish) => (
                      <SelectItem key={dish.id} value={dish.id.toString()}>
                        {dish.name} - ${dish.price.toLocaleString('es-CO')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer"
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center text-lg font-semibold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial-payment">Abono Inicial (opcional)</Label>
                <Input
                  id="initial-payment"
                  type="number"
                  placeholder="0"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input
                  id="notes"
                  placeholder="Observaciones o comentarios"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Producto:</span>
                  <span className="font-medium">{selectedDish?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio unit.:</span>
                  <span className="font-medium">${selectedDish?.price.toLocaleString('es-CO') || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold">
                    ${total.toLocaleString('es-CO')}
                  </span>
                </div>
                {payment > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Abono:</span>
                      <span className="text-green-600 font-medium">
                        -${payment.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Saldo:</span>
                      <span className="text-lg font-bold text-orange-500">
                        ${balance.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={handleAddSale}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Registrar Venta
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PlatosPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  })

  useEffect(() => {
    loadDishes()
  }, [])

  const loadDishes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading dishes:', error)
      toast.error('Error al cargar platos')
      setIsLoading(false)
      return
    }

    setDishes(data || [])
    setIsLoading(false)
  }

  const handleAddDish = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del plato es obligatorio')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast.error('Ingresa un precio válido')
      return
    }

    if (editingDish) {
      const { error } = await supabase
        .from('dishes')
        .update({
          name: formData.name.trim(),
          price,
          description: formData.description
        })
        .eq('id', editingDish.id)

      if (error) {
        console.error('Error updating dish:', error)
        toast.error('Error al actualizar plato')
        return
      }

      toast.success('Plato actualizado')
      setEditingDish(null)
    } else {
      const { error } = await supabase
        .from('dishes')
        .insert({
          name: formData.name.trim(),
          price,
          description: formData.description,
          active: true
        })

      if (error) {
        console.error('Error creating dish:', error)
        toast.error('Error al agregar plato')
        return
      }

      toast.success('Plato agregado')
    }

    setFormData({ name: '', price: '', description: '' })
    setIsDialogOpen(false)
    setEditingDish(null)
    loadDishes()
  }

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish)
    setFormData({
      name: dish.name,
      price: dish.price.toString(),
      description: dish.description
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (dish: Dish) => {
    const { error } = await supabase
      .from('dishes')
      .update({ active: !dish.active })
      .eq('id', dish.id)

    if (error) {
      console.error('Error toggling dish:', error)
      toast.error('Error al cambiar estado del plato')
      return
    }

    toast.success(dish.active ? 'Plato desactivado' : 'Plato activado')
    loadDishes()
  }

  const handleDelete = async (dish: Dish) => {
    if (!confirm(`¿Eliminar el plato "${dish.name}"?`)) return

    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dish.id)

    if (error) {
      console.error('Error deleting dish:', error)
      toast.error('Error al eliminar plato')
      return
    }

    toast.success('Plato eliminado')
    loadDishes()
  }

  const cancelEdit = () => {
    setEditingDish(null)
    setFormData({ name: '', price: '', description: '' })
    setIsDialogOpen(false)
  }

  if (isLoading) {
    return <FishLoader text="Cargando platos..." />
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Platos</h2>
          <p className="text-muted-foreground">
            Administra los platos disponibles
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={() => { setEditingDish(null); setFormData({ name: '', price: '', description: '' }); }}>
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDish ? 'Editar Plato' : 'Nuevo Plato'}</DialogTitle>
              <DialogDescription>
                {editingDish ? 'Modifica los datos del plato' : 'Completa los datos para agregar un nuevo plato'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dish-name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dish-name"
                  placeholder="Ej: Pescado frito"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-price">
                  Precio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dish-price"
                  type="number"
                  placeholder="15000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-description">Descripción</Label>
                <Input
                  id="dish-description"
                  placeholder="Descripción del plato"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleAddDish}>
                {editingDish ? 'Actualizar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platos Registrados</CardTitle>
          <CardDescription>
            {dishes.filter(d => d.active).length} platos activos de {dishes.length} totales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dishes.length === 0 ? (
            <div className="text-center py-16">
              <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay platos registrados</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando tu primer plato
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Plato
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dishes.map((dish) => (
                    <TableRow key={dish.id} className={!dish.active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🐟</span>
                          <span className="font-medium">{dish.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {dish.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary">
                          ${dish.price.toLocaleString('es-CO')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={dish.active ? 'default' : 'secondary'}>
                          {dish.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(dish)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(dish)}
                          >
                            {dish.active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(dish)}
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
    </div>
  )
}

function HistorialPage() {
  const navigate = useNavigate()
  const [sales, setSales] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading sales:', error)
      toast.error('Error al cargar ventas')
      return
    }

    setSales(data || [])
  }

  // Filtrar ventas por estado
  const filteredSales = sales.filter(sale => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'paid') return sale.balance === 0
    if (filterStatus === 'partial') return sale.paid > 0 && sale.balance > 0
    if (filterStatus === 'pending') return sale.paid === 0
    return true
  })

  const totalBalance = filteredSales.reduce((sum, sale) => sum + sale.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Historial de Ventas</h2>
          <p className="text-muted-foreground">
            Registro de todas las ventas
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <label className="text-sm font-medium">Filtrar por estado:</label>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="partial">Pago Parcial</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground sm:ml-auto">
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
            <CardTitle className="text-sm font-medium">Total a Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              ${totalBalance.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo {filterStatus !== 'all' ? 'filtrado' : 'pendiente'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ventas Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {filteredSales.filter(s => s.balance === 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sin saldo pendiente
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Ventas</CardTitle>
          <CardDescription>
            Listado de clientes y saldos
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
              <Button onClick={() => navigate('/ventas')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{sale.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${sale.total.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ${sale.paid.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${sale.balance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                          ${sale.balance.toLocaleString('es-CO')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sale.balance === 0 ? (
                          <Badge variant="default" className="bg-green-600">Pagado</Badge>
                        ) : sale.paid > 0 ? (
                          <Badge variant="secondary" className="bg-orange-500 text-white">Parcial</Badge>
                        ) : (
                          <Badge variant="destructive">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/venta/${sale.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
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

function DetalleVentaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState<any | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')

  useEffect(() => {
    loadSaleData()
  }, [id])

  const loadSaleData = async () => {
    if (!id) return

    // Load sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (saleError) {
      console.error('Error loading sale:', saleError)
      toast.error('Error al cargar venta')
      return
    }

    setSale(saleData)

    // Load payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('sale_id', parseInt(id))
      .order('created_at', { ascending: true })

    if (paymentsError) {
      console.error('Error loading payments:', paymentsError)
    } else {
      setPayments(paymentsData || [])
    }
  }

  const handleAddPayment = async () => {
    if (!sale) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    if (amount > sale.balance) {
      toast.error('El monto no puede ser mayor al saldo pendiente')
      return
    }

    // Insert payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        sale_id: sale.id,
        amount,
        note: paymentNote || null
      })

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      toast.error('Error al registrar abono')
      return
    }

    // Update sale
    const newPaid = sale.paid + amount
    const newBalance = sale.balance - amount

    const { error: saleError } = await supabase
      .from('sales')
      .update({
        paid: newPaid,
        balance: newBalance
      })
      .eq('id', sale.id)

    if (saleError) {
      console.error('Error updating sale:', saleError)
      toast.error('Error al actualizar venta')
      return
    }

    setPaymentAmount('')
    setPaymentNote('')
    toast.success('Abono registrado exitosamente')

    // Reload data
    loadSaleData()
  }

  const handleDeleteSale = async () => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return
    if (!sale) return

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', sale.id)

    if (error) {
      console.error('Error deleting sale:', error)
      toast.error('Error al eliminar venta')
      return
    }

    toast.success('Venta eliminada')
    navigate('/historial')
  }

  if (!sale) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Venta no encontrada</p>
        <Button onClick={() => navigate('/historial')} className="mt-4">
          Volver al Historial
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Detalle de Venta</h2>
          <p className="text-muted-foreground">
            Información completa y pagos
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/historial')}>
          Volver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="font-semibold text-lg">{sale.customer_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha</Label>
                <p className="font-medium">
                  {new Date(sale.created_at).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Producto</Label>
                <p className="font-medium">{sale.product}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Cantidad</Label>
                <p className="font-medium">{sale.quantity}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Precio Unitario</Label>
                <p className="font-medium">${sale.price.toLocaleString('es-CO')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total</Label>
                <p className="font-bold text-lg">${sale.total.toLocaleString('es-CO')}</p>
              </div>
            </div>

            {sale.notes && (
              <div>
                <Label className="text-muted-foreground">Notas</Label>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">Historial de Pagos</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pagos registrados</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium text-green-600">
                            ${payment.amount.toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleString('es-CO')}
                          </p>
                          {payment.note && (
                            <p className="text-xs text-muted-foreground">{payment.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="destructive"
              onClick={handleDeleteSale}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Venta
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold">${sale.total.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span className="font-medium text-green-600">${sale.paid.toLocaleString('es-CO')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Saldo:</span>
                  <span className={`text-xl font-bold ${sale.balance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                    ${sale.balance.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {sale.balance > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Registrar Abono</h4>
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Monto</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        placeholder="0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-note">Nota (opcional)</Label>
                      <Input
                        id="payment-note"
                        placeholder="Nota del pago"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAddPayment}
                      className="w-full"
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Registrar Abono
                    </Button>
                  </div>
                </>
              )}

              {sale.balance === 0 && (
                <div className="text-center py-4">
                  <Badge className="bg-green-600 text-lg px-4 py-2">
                    ✓ Pagado Completamente
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold">🐟 Deisy&Brian</h1>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-4 md:p-6">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/ventas" element={<VentasPage />} />
                  <Route path="/historial" element={<HistorialPage />} />
                  <Route path="/platos" element={<PlatosPage />} />
                  <Route path="/venta/:id" element={<DetalleVentaPage />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}

export default App
