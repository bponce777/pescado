# 🐟 Configuración de Supabase para Es Pescado

## ✅ Estado de la Integración
La aplicación ya está **completamente integrada con Supabase**. Todos los datos (ventas, pagos, platos) se almacenan en la base de datos de Supabase.

## 📋 Requisitos Previos
- Cuenta en [Supabase](https://supabase.com)
- Node.js instalado
- El proyecto ya tiene instalado @supabase/supabase-js

## 🚀 Pasos para Configurar Supabase

### 1. Crear un Proyecto en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Click en "New Project"
4. Completa:
   - Name: es-pescado
   - Database Password: Guarda esta contraseña
   - Region: Selecciona la más cercana
5. Click en "Create new project"
6. Espera 1-2 minutos

### 2. Obtener las Credenciales

1. Ve a Settings > API
2. Copia:
   - Project URL
   - anon public key

### 3. Configurar Variables de Entorno

Edita el archivo .env y reemplaza:

VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui

### 4. Crear las Tablas

1. Ve a SQL Editor en Supabase
2. Ejecuta el contenido de supabase-schema.sql
3. Click en "Run"

### 5. Reiniciar Servidor

npm run dev

¡Listo! 🚀

## 📊 Funcionalidades Integradas

La aplicación ahora utiliza Supabase para:

- ✅ **Gestión de Platos**: Crear, editar, activar/desactivar y eliminar platos
- ✅ **Registro de Ventas**: Crear nuevas ventas con abono inicial opcional
- ✅ **Sistema de Pagos**: Registrar abonos parciales para cada venta
- ✅ **Historial**: Ver todas las ventas con su estado de pago
- ✅ **Detalles de Venta**: Ver información completa y gestionar pagos
- ✅ **Exportar PDF**: Generar reportes de todas las ventas

## 🔄 Migración desde localStorage

Si tenías datos en localStorage (versión anterior), estos **NO se migrarán automáticamente**. Deberás:

1. Registrar nuevamente los platos en la sección "Platos"
2. Las nuevas ventas se guardarán en Supabase

## 🔐 Seguridad

Las credenciales de Supabase están en el archivo `.env` (que está excluido de git). Cada usuario debe configurar sus propias credenciales siguiendo los pasos de este documento.

## 🛠️ Solución de Problemas

### Error al cargar datos
Si ves errores de "Error al cargar..." en la aplicación:

1. Verifica que ejecutaste el script SQL en Supabase
2. Confirma que las credenciales en `.env` son correctas
3. Revisa la consola del navegador para más detalles

### Tablas no encontradas
Asegúrate de haber ejecutado **todo** el contenido de `supabase-schema.sql` en el SQL Editor de Supabase.

### RLS (Row Level Security)
Las políticas actuales permiten acceso completo. Para producción, considera restringir el acceso según tus necesidades de seguridad.
