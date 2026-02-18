import { supabase } from './supabase'

/**
 * Obtiene el número de WhatsApp del negocio desde app_config
 * @returns El número de WhatsApp o null si no está configurado
 */
export async function getWhatsAppNumber(): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'whatsapp_business_number')
    .single()

  if (error || !data) {
    console.error('Error fetching WhatsApp number:', error)
    return null
  }

  return data.value
}

/**
 * Formatea un mensaje de pedido para WhatsApp
 * @param order - Datos del pedido a formatear
 * @returns Mensaje formateado para WhatsApp
 */
export function formatOrderMessage(order: {
  customerName: string
  customerAddress: string
  product: string
  quantity: number
  total: number
}): string {
  const formattedTotal = order.total.toLocaleString('es-CO')

  return `🐟 *Nuevo Pedido desde la Tienda Online*

*Cliente:* ${order.customerName}
*Dirección:* ${order.customerAddress}

*Producto:* ${order.product}
*Cantidad:* ${order.quantity}
*Total:* $${formattedTotal}

_Por favor confirma tu pedido respondiendo este mensaje._`
}

/**
 * Genera URL de WhatsApp con mensaje pre-escrito
 * @param phoneNumber - Número de WhatsApp del destinatario
 * @param message - Mensaje a enviar
 * @returns URL de WhatsApp con el mensaje encodificado
 */
export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  // Limpiar número (quitar formato, espacios, guiones, paréntesis)
  const cleanNumber = phoneNumber.replace(/\D/g, '')

  // Encodear mensaje para URL
  const encodedMessage = encodeURIComponent(message)

  // Retornar URL de WhatsApp
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}
