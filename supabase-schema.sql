-- Script SQL para crear las tablas en Supabase - Es Pescado
-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla de Platos
CREATE TABLE IF NOT EXISTS dishes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ventas
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  product VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  paid DECIMAL(10, 2) DEFAULT 0,
  balance DECIMAL(10, 2) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_dishes_active ON dishes(active);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar el plato por defecto
INSERT INTO dishes (name, price, description, active)
VALUES ('Pescado con arroz', 15000, 'Plato especial del día', true)
ON CONFLICT DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir todo por ahora - ajusta según tus necesidades)
CREATE POLICY "Permitir lectura de platos" ON dishes
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura de platos" ON dishes
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura de ventas" ON sales
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura de ventas" ON sales
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura de pagos" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura de pagos" ON payments
  FOR ALL USING (true);
