import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { getWhatsAppNumber, formatOrderMessage, getWhatsAppUrl } from '@/lib/whatsapp'
import { toast } from 'sonner'

interface CheckoutState {
  dishId: number
  dishName: string
  price: number
  quantity: number
}

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as CheckoutState | null

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  // Validar que existe el state
  useEffect(() => {
    if (!state) {
      toast.error('No hay datos del pedido')
    }
  }, [state])

  // Calcular total
  const total = state ? state.price * state.quantity : 0

  // Validar formulario
  const isFormValid = name.trim() !== '' && address.trim() !== ''

  async function handleConfirmOrder() {
    if (!state) {
      toast.error('No hay datos del pedido')
      return
    }

    if (!isFormValid) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      setLoading(true)

      // 1. Guardar pedido en la base de datos
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          product: state.dishName,
          quantity: state.quantity,
          price: state.price,
          total: total,
          paid: 0,
          balance: total,
          customer_name: name.trim(),
          customer_phone: null,
          customer_address: address.trim(),
          order_source: 'public',
          notes: 'Pedido desde tienda pública'
        })
        .select()
        .single()

      if (saleError) {
        console.error('Error creating sale:', saleError)
        throw new Error('Error al guardar el pedido')
      }

      if (!sale) {
        throw new Error('No se pudo crear el pedido')
      }

      // 2. Obtener número de WhatsApp
      const whatsappNumber = await getWhatsAppNumber()

      if (!whatsappNumber) {
        toast.success('¡Pedido registrado exitosamente!')
        toast.info('Nos pondremos en contacto contigo pronto')
        setTimeout(() => {
          navigate('/tienda')
        }, 2000)
        return
      }

      // 3. Formatear mensaje
      const message = formatOrderMessage({
        id: sale.id,
        customerName: name.trim(),
        customerAddress: address.trim(),
        product: state.dishName,
        quantity: state.quantity,
        total: total
      })

      // 4. Generar URL de WhatsApp
      const whatsappUrl = getWhatsAppUrl(whatsappNumber, message)

      // 5. Mostrar éxito y redirigir
      toast.success('¡Pedido registrado exitosamente!')
      toast.info('Serás redirigido a WhatsApp...')

      setTimeout(() => {
        window.location.href = whatsappUrl
      }, 1500)

    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error(error instanceof Error ? error.message : 'Error al confirmar el pedido')
    } finally {
      setLoading(false)
    }
  }

  // Si no hay state, mostrar mensaje de error
  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              No hay datos del pedido. Por favor selecciona un plato desde el catálogo.
            </p>
            <Button onClick={() => navigate('/tienda')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/tienda')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🐟 Finalizar Pedido
              </h1>
              <p className="text-sm text-gray-500">
                Completa tus datos para confirmar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Formulario de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección de entrega *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Ej: Calle 123 #45-67"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                />
              </div>

              <p className="text-sm text-gray-500">
                * Campos obligatorios
              </p>
            </CardContent>
          </Card>

          {/* Resumen del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plato:</span>
                  <span className="font-semibold">{state.dishName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-semibold">{state.quantity}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Precio unitario:</span>
                  <span className="font-semibold">
                    ${state.price.toLocaleString('es-CO')}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-blue-600">
                    ${total.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <Separator />

              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirmOrder}
                disabled={!isFormValid || loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Al confirmar serás redirigido a WhatsApp para completar tu pedido
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
