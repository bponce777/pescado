import { useState, useEffect } from 'react'
import { ShoppingCart, Package, Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FishLoader } from '@/components/FishLoader'

export function Ventas() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [defaultDish, setDefaultDish] = useState<any>(null)

  useEffect(() => {
    const loadDefaultDish = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('name', 'Pescado con arroz')
        .eq('active', true)
        .single()

      if (error) {
        console.error('Error loading dish:', error)
        toast.error('Error al cargar plato')
        setIsLoading(false)
        return
      }

      setDefaultDish(data)
      setIsLoading(false)
    }

    loadDefaultDish()
  }, [])

  const handleAddSale = async () => {
    if (quantity <= 0) return
    if (!defaultDish) return
    if (!customerName.trim()) {
      toast.error('El nombre del cliente es obligatorio')
      return
    }

    setIsSaving(true)
    const total = quantity * defaultDish.price

    const { error } = await supabase
      .from('sales')
      .insert({
        product: defaultDish.name,
        quantity,
        price: defaultDish.price,
        total,
        paid: 0,
        balance: total,
        customer_name: customerName.trim(),
        notes: notes || null
      })

    if (error) {
      console.error('Error creating sale:', error)
      toast.error('Error al registrar venta')
      setIsSaving(false)
      return
    }

    toast.success('Venta registrada exitosamente')

    // Reset form
    setQuantity(1)
    setCustomerName('')
    setNotes('')
    setIsSaving(false)

    setTimeout(() => navigate('/historial'), 1000)
  }

  const total = defaultDish ? quantity * defaultDish.price : 0

  if (isLoading) {
    return <FishLoader text="Cargando plato..." />
  }

  return (
    <>
      {isSaving && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <FishLoader text="Guardando venta..." size="lg" />
        </div>
      )}
      <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Venta</h2>
        <p className="text-muted-foreground">
          Registra una nueva venta en el sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
            <CardDescription>
              Completa los detalles de la transacción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {defaultDish && (
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{defaultDish.name}</h3>
                      <p className="text-sm text-muted-foreground">{defaultDish.description}</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-2">
                    ${defaultDish.price.toLocaleString('es-CO')}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Input
                  id="customer"
                  placeholder="Nombre del cliente (opcional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
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
                  <span className="font-medium">{defaultDish?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio unit.:</span>
                  <span className="font-medium">${defaultDish?.price.toLocaleString('es-CO') || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${total.toLocaleString('es-CO')}
                  </span>
                </div>
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
    </>
  )
}
