-- ================================================
-- SCHEMA PARA PEDIDOS PÚBLICOS CON WHATSAPP
-- ================================================
-- Este archivo contiene las modificaciones necesarias para soportar
-- pedidos desde la tienda pública con integración de WhatsApp

-- ================================================
-- 1. MODIFICAR TABLA SALES
-- ================================================
-- Agregar campos para pedidos públicos
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS order_source VARCHAR(20) DEFAULT 'admin'
  CHECK (order_source IN ('admin', 'public'));

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sales_order_source ON sales(order_source);

-- ================================================
-- 2. CONFIGURAR WHATSAPP
-- ================================================
-- Insertar número de WhatsApp del negocio
-- IMPORTANTE: Reemplazar '573001234567' con el número real del negocio
-- Formato: código país + número (sin espacios, guiones ni paréntesis)
-- Ejemplo Colombia: 573001234567 (57 + 3001234567)
INSERT INTO app_config (key, value)
VALUES ('whatsapp_business_number', '573001234567')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ================================================
-- 3. POLÍTICAS RLS PARA ACCESO PÚBLICO
-- ================================================

-- Permitir a usuarios anónimos ver platos activos
DROP POLICY IF EXISTS "Public users can view active dishes" ON dishes;
CREATE POLICY "Public users can view active dishes" ON dishes
  FOR SELECT
  USING (active = true);

-- Permitir a usuarios anónimos crear pedidos públicos
DROP POLICY IF EXISTS "Public users can create orders" ON sales;
CREATE POLICY "Public users can create orders" ON sales
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (order_source = 'public');

-- Nota: Las políticas existentes para usuarios autenticados permanecen intactas

-- ================================================
-- 4. VERIFICACIÓN
-- ================================================
-- Ejecutar estas consultas después de aplicar el schema para verificar:

-- Verificar que las columnas se agregaron correctamente:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'sales'
-- AND column_name IN ('customer_phone', 'customer_address', 'order_source');

-- Verificar configuración de WhatsApp:
-- SELECT * FROM app_config WHERE key = 'whatsapp_business_number';

-- Verificar políticas RLS:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('dishes', 'sales')
-- ORDER BY tablename, policyname;
