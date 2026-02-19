import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { FishLoader } from '@/components/FishLoader'
import { toast } from 'sonner'

interface Dish {
  id: number
  name: string
  price: number
  description: string
  active: boolean
}

export default function CatalogoPage() {
  const navigate = useNavigate()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    fetchActiveDishes()
  }, [])

  async function fetchActiveDishes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

      if (error) throw error

      setDishes(data || [])

      // Inicializar cantidades en 1 para cada plato
      const initialQuantities: { [key: number]: number } = {}
      data?.forEach(dish => {
        initialQuantities[dish.id] = 1
      })
      setQuantities(initialQuantities)
    } catch (error) {
      console.error('Error fetching dishes:', error)
      toast.error('Error al cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }

  function handleIncrement(dishId: number) {
    setQuantities(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 1) + 1
    }))
  }

  function handleDecrement(dishId: number) {
    setQuantities(prev => ({
      ...prev,
      [dishId]: Math.max(1, (prev[dishId] || 1) - 1)
    }))
  }

  function handleBuy(dish: Dish) {
    const quantity = quantities[dish.id] || 1
    navigate('/checkout', {
      state: {
        dishId: dish.id,
        dishName: dish.name,
        price: dish.price,
        quantity: quantity
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <FishLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <img src="/logo.png" alt="Deysi Restaurante" className="mx-auto mb-3 h-24 w-24 object-contain" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              DeisyRestaurant
            </h1>
            <p className="text-lg text-gray-600">Nuestro Menú</p>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona tu plato favorito
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {dishes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay platos disponibles en este momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map(dish => (
              <Card key={dish.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{dish.name}</CardTitle>
                  <CardDescription>{dish.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Precio */}
                  <div className="text-2xl font-bold text-blue-600">
                    ${dish.price.toLocaleString('es-CO')}
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDecrement(dish.id)}
                      disabled={quantities[dish.id] <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-semibold w-12 text-center">
                      {quantities[dish.id] || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleIncrement(dish.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Botón Comprar */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleBuy(dish)}
                  >
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
