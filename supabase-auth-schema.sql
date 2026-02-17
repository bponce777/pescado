-- ==============================================
-- SCHEMA DE AUTENTICACIÓN PARA CRM DEISY&BRIAN
-- ==============================================

-- 1. TABLA DE PERFILES DE USUARIO
-- ==============================================

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'vendedor', 'supervisor')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

-- Política: Los admins pueden actualizar perfiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

-- Política: Los admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users"
  ON profiles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

-- 2. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ==============================================

-- Función para crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función al crear usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. FUNCIÓN PARA ACTUALIZAR updated_at
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. CONFIGURACIÓN DE ADMIN
-- ==============================================

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden leer y escribir en configuración
CREATE POLICY "Admins manage config"
  ON app_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

-- IMPORTANTE: Reemplazar con el email del admin real
-- Este usuario será automáticamente promovido a admin al registrarse
INSERT INTO app_config (key, value)
VALUES ('admin_email', 'oroboruo566@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- 5. FUNCIÓN PARA PROMOVER A ADMIN AUTOMÁTICAMENTE
-- ==============================================

CREATE OR REPLACE FUNCTION promote_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Obtener el email del admin configurado
  SELECT value INTO admin_email FROM app_config WHERE key = 'admin_email';

  -- Si el email coincide, promover a admin y activar
  IF NEW.email = admin_email THEN
    UPDATE profiles
    SET role = 'admin', is_active = true
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para verificar si es admin al crear perfil
CREATE TRIGGER check_admin
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION promote_admin();

-- 6. ACTUALIZAR POLÍTICAS RLS DE TABLAS EXISTENTES
-- ==============================================

-- TABLA: dishes
-- Solo usuarios activos pueden acceder
DROP POLICY IF EXISTS "Permitir lectura de platos" ON dishes;
DROP POLICY IF EXISTS "Permitir escritura de platos" ON dishes;

CREATE POLICY "Active users read dishes"
  ON dishes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users write dishes"
  ON dishes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

-- TABLA: sales
-- Solo usuarios activos pueden acceder
DROP POLICY IF EXISTS "Permitir lectura de ventas" ON sales;
DROP POLICY IF EXISTS "Permitir escritura de ventas" ON sales;

CREATE POLICY "Active users read sales"
  ON sales FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users write sales"
  ON sales FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

-- TABLA: payments
-- Solo usuarios activos pueden acceder
DROP POLICY IF EXISTS "Permitir lectura de pagos" ON payments;
DROP POLICY IF EXISTS "Permitir escritura de pagos" ON payments;

CREATE POLICY "Active users read payments"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users write payments"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

-- ==============================================
-- FIN DEL SCHEMA
-- ==============================================

-- INSTRUCCIONES:
-- 1. Ejecuta este script en tu proyecto de Supabase (SQL Editor)
-- 2. Actualiza el email del admin en app_config.admin_email
-- 3. El primer usuario que se registre con ese email será admin automáticamente
