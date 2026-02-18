-- ================================================
-- FIX: PERMITIR LECTURA DE APP_CONFIG A USUARIOS ANÓNIMOS
-- ================================================
-- Este script permite que usuarios no autenticados puedan leer
-- el número de WhatsApp desde la tabla app_config

-- ================================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES DE APP_CONFIG
-- ================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'app_config') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON app_config';
    END LOOP;
END $$;

-- ================================================
-- 2. CREAR POLÍTICA PARA LECTURA ANÓNIMA
-- ================================================
-- Permitir a usuarios ANÓNIMOS leer SOLO el número de WhatsApp
CREATE POLICY "allow_anon_read_whatsapp" ON app_config
  FOR SELECT
  TO anon
  USING (key = 'whatsapp_business_number');

-- ================================================
-- 3. CREAR POLÍTICAS PARA USUARIOS AUTENTICADOS
-- ================================================
-- Permitir a usuarios AUTENTICADOS leer toda la configuración
CREATE POLICY "allow_authenticated_select_config" ON app_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir a usuarios AUTENTICADOS insertar configuración
CREATE POLICY "allow_authenticated_insert_config" ON app_config
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir a usuarios AUTENTICADOS actualizar configuración
CREATE POLICY "allow_authenticated_update_config" ON app_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir a usuarios AUTENTICADOS eliminar configuración
CREATE POLICY "allow_authenticated_delete_config" ON app_config
  FOR DELETE
  TO authenticated
  USING (true);

-- ================================================
-- 4. HABILITAR RLS EN APP_CONFIG
-- ================================================
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 5. VERIFICACIÓN
-- ================================================
-- Ejecutar para verificar:
-- SELECT tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'app_config'
-- ORDER BY policyname;

-- Deberías ver:
-- - allow_anon_read_whatsapp con roles = {anon}
-- - allow_authenticated_* con roles = {authenticated}
