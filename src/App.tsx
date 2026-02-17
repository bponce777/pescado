import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Home, ShoppingCart, History, Menu, DollarSign, TrendingUp, Plus, Minus, Trash2, User, Eye, Banknote, FileDown, UtensilsCrossed, Filter, MoreVertical, Edit, Power, FileText, Users as UsersIcon, LogOut, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Toaster, toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'
import { FishLoader } from '@/components/FishLoader'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Auth imports
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { UserManagementPage } from '@/pages/admin/UserManagementPage'

// Public store imports
import CatalogoPage from '@/pages/public/CatalogoPage'
import CheckoutPage from '@/pages/public/CheckoutPage'

type Dish = {
  id: number
  name: string
  price: number
  description: string
  active: boolean
}

// Funciones para formatear dinero en formato colombiano
const formatCurrency = (value: string): string => {
  // Eliminar todo excepto números
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''

  // Formatear con separador de miles
  return parseInt(numbers).toLocaleString('es-CO')
}

const parseCurrency = (value: string): number => {
  // Eliminar puntos y convertir a número
  return parseInt(value.replace(/\./g, '') || '0')
}

function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const currentPath = window.location.pathname
  const { isAdmin } = useAuth()

  const menuItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/ventas', icon: ShoppingCart, label: 'Nueva Venta' },
    { href: '/historial', icon: History, label: 'Historial' },
    { href: '/reportes', icon: FileText, label: 'Reportes' },
    { href: '/platos', icon: UtensilsCrossed, label: 'Platos' },
    { href: '/admin/usuarios', icon: UsersIcon, label: 'Usuarios', adminOnly: true },
  ]

  // Filtrar items según permisos
  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del Sidebar */}
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-2xl shadow-sm">
            🐟
          </div>
          <div className="flex flex-col min-w-0">
            <span className="brand-name text-lg leading-tight truncate">Deisy&Brian</span>
            <span className="text-xs text-muted-foreground font-medium">CRM Ventas</span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menú Principal
          </p>
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-card p-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="font-medium">Sistema Activo</span>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground font-medium">
            © 2026 <span className="">Derechos reservados</span>
          </p>
        </div>
      </aside>
    </>
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
  const [salesByDay, setSalesByDay] = useState<any[]>([])
  const [topDishes, setTopDishes] = useState<any[]>([])

  useEffect(() => {
    const loadStats = async () => {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: true })

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

      // Procesar datos para gráfico de ventas por día (últimos 7 días)
      const last7Days: any[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
        const dayStr = date.toDateString()

        const daySales = sales?.filter((sale: any) =>
          new Date(sale.created_at).toDateString() === dayStr
        ) || []

        last7Days.push({
          fecha: dateStr,
          ventas: daySales.length,
          ingresos: daySales.reduce((sum: number, s: any) => sum + s.total, 0)
        })
      }
      setSalesByDay(last7Days)

      // Procesar datos para platos más vendidos
      const dishesMap = new Map<string, { cantidad: number, ingresos: number }>()
      sales?.forEach((sale: any) => {
        const existing = dishesMap.get(sale.product) || { cantidad: 0, ingresos: 0 }
        dishesMap.set(sale.product, {
          cantidad: existing.cantidad + sale.quantity,
          ingresos: existing.ingresos + sale.total
        })
      })

      const dishesArray = Array.from(dishesMap.entries())
        .map(([name, data]) => ({
          plato: name,
          cantidad: data.cantidad,
          ingresos: data.ingresos
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5)

      setTopDishes(dishesArray)
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Bienvenido al software de gestión de ventas
        </p>
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

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Últimos 7 Días</CardTitle>
            <CardDescription>Tendencia de ventas e ingresos diarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="fecha"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                  name="Ventas"
                />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                  name="Ingresos ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platos Más Vendidos</CardTitle>
            <CardDescription>Top 5 platos por cantidad vendida</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDishes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="plato"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="cantidad"
                  fill="#3b82f6"
                  name="Cantidad"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDishes = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        console.error('Error loading dishes:', error)
        toast.error('Error al cargar platos')
        setIsLoading(false)
        return
      }

      const activeDishes = data || []
      setDishes(activeDishes)

      // Seleccionar "Pescado con arroz" por defecto
      const defaultDish = activeDishes.find((d: Dish) => d.name === 'Pescado con arroz') || activeDishes[0]
      setSelectedDish(defaultDish)
      setIsLoading(false)
    }

    loadDishes()
  }, [])

  const handleContinue = () => {
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

    const payment = parseCurrency(initialPayment) || 0
    const total = quantity * selectedDish.price

    if (payment < 0) {
      toast.error('El abono no puede ser negativo')
      return
    }

    if (payment > total) {
      toast.error('El abono no puede ser mayor al total')
      return
    }

    // Si todas las validaciones pasan, abrir modal de confirmación
    setShowConfirmDialog(true)
  }

  const handleAddSale = async () => {
    if (!selectedDish) {
      toast.error('Error: No hay plato seleccionado')
      return
    }

    const payment = parseCurrency(initialPayment) || 0
    const total = quantity * selectedDish.price

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
        order_source: 'admin',
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

    // Cerrar modal y limpiar formulario
    setShowConfirmDialog(false)
    setQuantity(1)
    setCustomerName('')
    setNotes('')
    setInitialPayment('')

    setTimeout(() => navigate('/historial'), 1000)
  }

  if (isLoading) {
    return <FishLoader text="Cargando platos..." />
  }

  if (!selectedDish || dishes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay platos disponibles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes activar al menos un plato en la sección de Platos
            </p>
            <Button onClick={() => navigate('/platos')}>
              Ir a Platos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calcular totales solo cuando selectedDish existe
  const total = quantity * selectedDish.price
  const payment = parseCurrency(initialPayment) || 0
  const balance = total - payment

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Nueva Venta</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="initial-payment"
                    type="text"
                    placeholder="0"
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(formatCurrency(e.target.value))}
                    className="pl-7"
                  />
                </div>
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
                onClick={handleContinue}
                className="w-full"
                size="lg"
              >
                Continuar
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

      {/* Modal de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de registrar la venta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium text-muted-foreground">Cliente</span>
              <span className="font-semibold">{customerName}</span>
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Producto</span>
                <span className="font-medium">{selectedDish?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Precio unitario</span>
                <span className="text-sm">${selectedDish?.price.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cantidad</span>
                <span className="text-sm">{quantity}</span>
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">${total.toLocaleString('es-CO')}</span>
              </div>

              {payment > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Abono inicial</span>
                    <span className="text-sm text-green-600 font-medium">-${payment.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Saldo pendiente</span>
                    <span className="text-lg font-bold text-orange-500">${balance.toLocaleString('es-CO')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Notas */}
            {notes && (
              <div className="pt-2 border-t">
                <span className="text-sm font-medium text-muted-foreground">Notas</span>
                <p className="text-sm mt-1">{notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddSale}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Registrar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

    const price = parseCurrency(formData.price)
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
      price: dish.price.toLocaleString('es-CO'),
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Gestión de Platos</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="dish-price"
                    type="text"
                    placeholder="15.000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: formatCurrency(e.target.value) })}
                    className="pl-7"
                  />
                </div>
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

      {/* Header con contador */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Platos Registrados</h2>
          <p className="text-sm text-muted-foreground">
            {dishes.filter(d => d.active).length} activos de {dishes.length} totales
          </p>
        </div>
      </div>

      {/* Grid de Cards */}
      {dishes.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay platos registrados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza agregando tu primer plato
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Plato
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.id} className="overflow-hidden">
              {/* Imagen del producto */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <UtensilsCrossed className="h-20 w-20 text-primary/40" />

                {/* Badge de estado - esquina superior izquierda */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={dish.active ? 'default' : 'secondary'}
                    className={dish.active ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {dish.active ? 'ACTIVO' : 'INACTIVO'}
                  </Badge>
                </div>

                {/* Menú de acciones - esquina superior derecha */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEdit(dish)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(dish)}>
                        <Power className="mr-2 h-4 w-4" />
                        {dish.active ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(dish)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Contenido de la card */}
              <CardContent className="p-4 space-y-3">
                {/* Título del plato */}
                <h3 className="text-lg font-semibold leading-tight line-clamp-2 min-h-[3.5rem]">
                  {dish.name}
                </h3>

                {/* Descripción */}
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {dish.description || 'Sin descripción'}
                </p>

                {/* Precio */}
                <div className="pt-1 pb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Precio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${dish.price.toLocaleString('es-CO')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Historial de Ventas</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Registro de todas las ventas
        </p>
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

function ReportesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterProduct, setFilterProduct] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<Date | undefined>()
  const [isLoading, setIsLoading] = useState(true)

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

  // Extraer clientes y productos únicos
  const uniqueClients = Array.from(new Set(sales.map(sale => sale.customer_name).filter(Boolean))).sort()
  const uniqueProducts = Array.from(new Set(sales.map(sale => sale.product).filter(Boolean))).sort()

  const filteredSales = sales.filter(sale => {
    // Filtro por estado
    let statusMatch = true
    if (filterStatus === 'paid') statusMatch = sale.balance === 0
    else if (filterStatus === 'partial') statusMatch = sale.paid > 0 && sale.balance > 0
    else if (filterStatus === 'pending') statusMatch = sale.paid === 0

    // Filtro por cliente
    const clientMatch = filterClient === 'all' || sale.customer_name === filterClient

    // Filtro por producto
    const productMatch = filterProduct === 'all' || sale.product === filterProduct

    // Filtro por fecha (solo día, sin hora)
    let dateMatch = true
    if (filterDate) {
      const saleDate = new Date(sale.created_at)
      const filterDateCopy = new Date(filterDate)

      // Comparar solo año, mes y día
      dateMatch = saleDate.getFullYear() === filterDateCopy.getFullYear() &&
                  saleDate.getMonth() === filterDateCopy.getMonth() &&
                  saleDate.getDate() === filterDateCopy.getDate()
    }

    return statusMatch && clientMatch && productMatch && dateMatch
  })

  const generateFilteredPDF = async () => {
    if (filteredSales.length === 0) {
      toast.error('No hay ventas para exportar con este filtro')
      return
    }

    const doc = new jsPDF({
      putOnlyUsedFonts: true,
      compress: true
    })

    doc.setLanguage('es')

    // Título
    doc.setFontSize(20)
    doc.text('Deisy&Brian', 14, 20)
    doc.setFontSize(12)
    doc.text('Reporte de Ventas', 14, 28)

    // Filtros aplicados
    const statusLabel = filterStatus === 'all' ? 'Todos' :
                        filterStatus === 'paid' ? 'Pagado' :
                        filterStatus === 'partial' ? 'Pago Parcial' : 'Pendiente'
    const clientLabel = filterClient === 'all' ? 'Todos' : filterClient
    const productLabel = filterProduct === 'all' ? 'Todos' : filterProduct

    doc.setFontSize(10)
    doc.text(`Estado: ${statusLabel} | Cliente: ${clientLabel} | Producto: ${productLabel}`, 14, 35)
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 42)

    // Estadísticas
    const totalVentas = filteredSales.length
    const totalIngresos = filteredSales.reduce((sum: number, s: any) => sum + s.total, 0)
    const totalPagado = filteredSales.reduce((sum: number, s: any) => sum + s.paid, 0)
    const totalPendiente = filteredSales.reduce((sum: number, s: any) => sum + s.balance, 0)

    doc.setFontSize(11)
    doc.text(`Total Ventas: ${totalVentas}`, 14, 52)
    doc.text(`Total Ingresos: $${totalIngresos.toLocaleString('es-CO')}`, 14, 59)
    doc.text(`Total Pagado: $${totalPagado.toLocaleString('es-CO')}`, 14, 66)
    doc.text(`Total Pendiente: $${totalPendiente.toLocaleString('es-CO')}`, 14, 73)

    // Tabla de ventas
    const tableData = filteredSales.map((sale: any) => [
      sale.customer_name || '',
      sale.product || '',
      sale.quantity.toString(),
      `$${sale.total.toLocaleString('es-CO')}`,
      `$${sale.paid.toLocaleString('es-CO')}`,
      `$${sale.balance.toLocaleString('es-CO')}`,
      new Date(sale.created_at).toLocaleDateString('es-CO')
    ])

    autoTable(doc, {
      startY: 82,
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
        if (data.cell.raw) {
          data.cell.text = [String(data.cell.raw)]
        }
      }
    })

    const fileName = `reporte-ventas-${Date.now()}.pdf`
    doc.save(fileName)
    toast.success('Reporte descargado exitosamente')
  }

  const totalIngresos = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPendiente = filteredSales.reduce((sum, sale) => sum + sale.balance, 0)

  if (isLoading) {
    return <FishLoader text="Cargando reportes..." />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Reportes</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Genera reportes detallados de ventas
          </p>
        </div>
        <Button onClick={generateFilteredPDF} size="lg" className="w-full sm:w-auto">
          <FileDown className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Descargar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Filtros de Búsqueda</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Filtro por Estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado de Pago</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="partial">Pago Parcial</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Cliente</label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Producto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Producto</label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {uniqueProducts.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fecha</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal px-3 py-2 h-auto",
                      !filterDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">
                      {filterDate ? format(filterDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{filteredSales.length}</span> de <span className="font-semibold text-foreground">{sales.length}</span> ventas
            </span>
            {(filterStatus !== 'all' || filterClient !== 'all' || filterProduct !== 'all' || filterDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterClient('all')
                  setFilterProduct('all')
                  setFilterDate(undefined)
                }}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold sm:text-3xl">{filteredSales.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(filterStatus !== 'all' || filterClient !== 'all' || filterProduct !== 'all' || filterDate) ? 'Con filtros aplicados' : 'Todas las ventas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary sm:text-3xl">
              ${totalIngresos.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monto {(filterStatus !== 'all' || filterClient !== 'all' || filterProduct !== 'all' || filterDate) ? 'filtrado' : 'total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 sm:text-3xl">
              ${totalPendiente.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por cobrar {(filterStatus !== 'all' || filterClient !== 'all' || filterProduct !== 'all' || filterDate) ? '(filtrado)' : '(total)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Ventas</CardTitle>
          <CardDescription>
            {(() => {
              const filters = []
              if (filterStatus !== 'all') {
                const statusText = filterStatus === 'paid' ? 'pagadas' :
                                 filterStatus === 'partial' ? 'con pago parcial' : 'pendientes'
                filters.push(`estado: ${statusText}`)
              }
              if (filterClient !== 'all') filters.push(`cliente: ${filterClient}`)
              if (filterProduct !== 'all') filters.push(`producto: ${filterProduct}`)

              return filters.length > 0
                ? `Filtrado por ${filters.join(', ')}`
                : 'Todas las ventas registradas'
            })()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay ventas con este filtro
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.customer_name}</TableCell>
                      <TableCell>{sale.product}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{sale.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${sale.total.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${sale.paid.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right text-orange-500">
                        ${sale.balance.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            sale.balance === 0 ? 'default' :
                            sale.paid > 0 ? 'secondary' :
                            'outline'
                          }
                        >
                          {sale.balance === 0 ? 'Pagado' :
                           sale.paid > 0 ? 'Parcial' :
                           'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString('es-CO')}
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

    const amount = parseCurrency(paymentAmount)
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Detalle de Venta</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
            Información completa y pagos
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/historial')} className="w-full sm:w-auto">
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
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="payment-amount"
                          type="text"
                          placeholder="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(formatCurrency(e.target.value))}
                          className="pl-7"
                        />
                      </div>
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

function AppHeader() {
  const { profile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 sm:h-16 sm:px-6">
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => {
              const sidebar = document.querySelector('aside')
              sidebar?.classList.toggle('-translate-x-full')
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xl sm:flex lg:hidden">
              🐟
            </div>
            <h1 className="brand-name text-base sm:text-lg">Deisy&Brian</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button onClick={generatePDF} variant="outline" size="sm" className="h-8 sm:h-9">
            <FileDown className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  {profile?.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm max-w-[150px] truncate">
                  {profile?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                      {profile?.role === 'admin' && '👑 '}
                      {profile?.role}
                    </Badge>
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <AppHeader />
        <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 sm:min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/ventas" element={<VentasPage />} />
              <Route path="/historial" element={<HistorialPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/platos" element={<PlatosPage />} />
              <Route path="/venta/:id" element={<DetalleVentaPage />} />
              <Route path="/admin/usuarios" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Store Routes - Completely Open (No Auth Required) */}
          <Route path="/tienda" element={<CatalogoPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected Routes (Admin) */}
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
