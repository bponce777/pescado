import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [paymentMethod, setPaymentMethod] = useState<'Nequi' | 'Efectivo' | ''>('')
  const [billAmount, setBillAmount] = useState('')
  const [loading, setLoading] = useState(false)

  // Validar que existe el state
  useEffect(() => {
    if (!state) {
      toast.error('No hay datos del pedido')
    }
  }, [state])

  // Calcular total
  const total = state ? state.price * state.quantity : 0

  // Funciones para formatear moneda
  const formatCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    return parseInt(numbers).toLocaleString('es-CO')
  }

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\./g, '') || '0')
  }

  // Validar formulario
  const isFormValid =
    name.trim() !== '' &&
    address.trim() !== '' &&
    paymentMethod !== '' &&
    (paymentMethod === 'Nequi' ||
     (paymentMethod === 'Efectivo' &&
      billAmount.trim() !== '' &&
      parseCurrency(billAmount) >= total))

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

      // 1. Obtener número de WhatsApp
      const whatsappNumber = await getWhatsAppNumber()

      if (!whatsappNumber) {
        toast.error('WhatsApp no configurado. Por favor contacta al administrador.')
        setLoading(false)
        return
      }

      // 2. Formatear mensaje
      const message = formatOrderMessage({
        customerName: name.trim(),
        customerAddress: address.trim(),
        product: state.dishName,
        quantity: state.quantity,
        total: total,
        paymentMethod: paymentMethod,
        billAmount: paymentMethod === 'Efectivo' ? parseCurrency(billAmount) : undefined
      })

      // 3. Generar URL de WhatsApp
      const whatsappUrl = getWhatsAppUrl(whatsappNumber, message)

      // 4. Redirigir a WhatsApp
      toast.success('Redirigiendo a WhatsApp...')

      setTimeout(() => {
        window.location.href = whatsappUrl
      }, 800)

    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error('Error al procesar el pedido')
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

              <div className="space-y-2">
                <Label htmlFor="payment">Método de pago *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: 'Nequi' | 'Efectivo') => {
                    setPaymentMethod(value)
                    if (value === 'Nequi') {
                      setBillAmount('')
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Selecciona método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'Efectivo' && (
                <div className="space-y-2">
                  <Label htmlFor="bill">Billete a pagar *</Label>
                  <Input
                    id="bill"
                    type="text"
                    placeholder="Ej: 50.000"
                    value={billAmount}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setBillAmount(formatted)
                    }}
                    disabled={loading}
                  />
                  {billAmount && parseCurrency(billAmount) < total && (
                    <p className="text-sm text-red-500">
                      El billete debe ser mayor o igual al total
                    </p>
                  )}
                  {billAmount && parseCurrency(billAmount) >= total && (
                    <p className="text-sm text-green-600">
                      Cambio: ${(parseCurrency(billAmount) - total).toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              )}

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
