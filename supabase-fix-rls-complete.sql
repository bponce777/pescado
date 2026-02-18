-- ================================================
-- SOLUCIÓN COMPLETA: POLÍTICAS RLS PARA PEDIDOS PÚBLICOS
-- ================================================
-- IMPORTANTE: Ejecutar TODO este script en Supabase SQL Editor

-- ================================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las políticas de la tabla sales
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON sales';
    END LOOP;

    -- Eliminar todas las políticas de la tabla dishes
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'dishes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON dishes';
    END LOOP;
END $$;

-- ================================================
-- PASO 2: CREAR POLÍTICAS PARA DISHES (PLATOS)
-- ================================================

-- 2.1. Usuarios ANÓNIMOS pueden VER platos activos
CREATE POLICY "allow_anon_select_active_dishes" ON dishes
  FOR SELECT
  TO anon
  USING (active = true);

-- 2.2. Usuarios AUTENTICADOS pueden VER todos los platos
CREATE POLICY "allow_authenticated_select_dishes" ON dishes
  FOR SELECT
  TO authenticated
  USING (true);

-- 2.3. Usuarios AUTENTICADOS pueden INSERTAR platos
CREATE POLICY "allow_authenticated_insert_dishes" ON dishes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2.4. Usuarios AUTENTICADOS pueden ACTUALIZAR platos
CREATE POLICY "allow_authenticated_update_dishes" ON dishes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2.5. Usuarios AUTENTICADOS pueden ELIMINAR platos
CREATE POLICY "allow_authenticated_delete_dishes" ON dishes
  FOR DELETE
  TO authenticated
  USING (true);

-- ================================================
-- PASO 3: CREAR POLÍTICAS PARA SALES (VENTAS)
-- ================================================

-- 3.1. Usuarios ANÓNIMOS pueden CREAR pedidos públicos
CREATE POLICY "allow_anon_insert_public_sales" ON sales
  FOR INSERT
  TO anon
  WITH CHECK (order_source = 'public');

-- 3.2. Usuarios AUTENTICADOS pueden VER todas las ventas
CREATE POLICY "allow_authenticated_select_sales" ON sales
  FOR SELECT
  TO authenticated
  USING (true);

-- 3.3. Usuarios AUTENTICADOS pueden CREAR ventas (admin)
CREATE POLICY "allow_authenticated_insert_sales" ON sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3.4. Usuarios AUTENTICADOS pueden ACTUALIZAR ventas
CREATE POLICY "allow_authenticated_update_sales" ON sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3.5. Usuarios AUTENTICADOS pueden ELIMINAR ventas
CREATE POLICY "allow_authenticated_delete_sales" ON sales
  FOR DELETE
  TO authenticated
  USING (true);

-- ================================================
-- PASO 4: HABILITAR RLS (por si acaso)
-- ================================================
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASO 5: VERIFICACIÓN
-- ================================================
-- Ejecutar para verificar:
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('dishes', 'sales')
-- ORDER BY tablename, policyname;

-- Deberías ver:
-- - allow_anon_insert_public_sales con roles = {anon}
-- - allow_anon_select_active_dishes con roles = {anon}
-- - Y políticas para authenticated

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================
-- Este script:
-- 1. Elimina TODAS las políticas existentes (limpieza completa)
-- 2. Crea nuevas políticas específicas para cada operación
-- 3. Separa explícitamente permisos de anon vs authenticated
-- 4. Permite a usuarios anónimos crear pedidos con order_source='public'
-- 5. Permite a usuarios autenticados hacer todo (admin)
