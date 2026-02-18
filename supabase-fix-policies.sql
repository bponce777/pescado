-- ================================================
-- FIX: POLÍTICAS RLS PARA PEDIDOS PÚBLICOS
-- ================================================
-- Este script corrige los problemas con pedidos anónimos
-- Ejecutar en Supabase SQL Editor

-- ================================================
-- 1. PERMITIR ACCESO ANÓNIMO A PLATOS ACTIVOS
-- ================================================
-- Permitir a usuarios NO autenticados (anónimos) ver platos activos
DROP POLICY IF EXISTS "Public users can view active dishes" ON dishes;
CREATE POLICY "Public users can view active dishes" ON dishes
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- ================================================
-- 2. PERMITIR CREACIÓN DE PEDIDOS ANÓNIMOS
-- ================================================
-- Permitir a usuarios NO autenticados crear pedidos públicos
DROP POLICY IF EXISTS "Public users can create orders" ON sales;
CREATE POLICY "Public users can create orders" ON sales
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (order_source = 'public');

-- ================================================
-- 3. VERIFICAR POLÍTICAS EXISTENTES
-- ================================================
-- Ejecutar esta consulta para verificar las políticas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('dishes', 'sales')
-- ORDER BY tablename, policyname;

-- ================================================
-- 4. VERIFICAR CONFIGURACIÓN DE RLS
-- ================================================
-- Asegurar que RLS esté habilitado en las tablas
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
-- - La cláusula 'TO anon, authenticated' permite acceso tanto a usuarios
--   anónimos como autenticados
-- - Los pedidos desde /tienda ahora funcionarán sin requerir login
-- - Los pedidos creados por el admin siguen protegidos por otras políticas
