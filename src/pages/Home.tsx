import { useState, useEffect } from 'react'
import { DollarSign, ShoppingCart, TrendingUp, Package, History } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FishLoader } from '@/components/FishLoader'

const DEFAULT_PRODUCT = {
  name: 'Pescado con arroz',
  price: 15000,
  description: 'Plato especial del día',
  available: true
}

export function Home() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    todaySales: 0
  })

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')

      if (error) {
        console.error('Error loading stats:', error)
        toast.error('Error al cargar estadísticas')
        setIsLoading(false)
        return
      }

      const today = new Date().toDateString()
      const todaySales = sales?.filter((sale: any) =>
        new Date(sale.created_at).toDateString() === today
      ) || []

      setStats({
        totalSales: sales?.length || 0,
        totalRevenue: sales?.reduce((sum: number, sale: any) => sum + sale.total, 0) || 0,
        todaySales: todaySales.length
      })
      setIsLoading(false)
    }

    loadStats()
  }, [])

  if (isLoading) {
    return <FishLoader text="Cargando estadísticas..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de ventas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSales > 0 ? Math.round(stats.totalRevenue / stats.totalSales).toLocaleString('es-CO') : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor promedio
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Plato del Día
            </CardTitle>
            <CardDescription>Producto destacado disponible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{DEFAULT_PRODUCT.name}</h3>
                <p className="text-sm text-muted-foreground">{DEFAULT_PRODUCT.description}</p>
              </div>
              <Badge
                variant={DEFAULT_PRODUCT.available ? "default" : "secondary"}
                className="text-base px-3 py-1"
              >
                ${DEFAULT_PRODUCT.price.toLocaleString('es-CO')}
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
            <CardDescription>Accesos directos a funciones principales</CardDescription>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
