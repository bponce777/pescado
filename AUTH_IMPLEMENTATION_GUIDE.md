# Guía de Implementación del Sistema de Autenticación

## 📋 Resumen

Se ha implementado un sistema completo de autenticación para el CRM Deisy&Brian con las siguientes características:

- ✅ **Login y Registro de usuarios**
- ✅ **Sistema de roles** (admin, vendedor, supervisor)
- ✅ **Aprobación de usuarios** por parte del admin
- ✅ **Row Level Security (RLS)** en Supabase
- ✅ **Protección de rutas** con guards
- ✅ **Panel de administración** de usuarios

---

## 📁 Archivos Creados

### 1. Base de Datos
- ✅ `supabase-auth-schema.sql` - Schema completo de autenticación

### 2. Context y Hooks
- ✅ `src/contexts/AuthContext.tsx` - Context de autenticación

### 3. Componentes de Protección
- ✅ `src/components/auth/ProtectedRoute.tsx` - Protege rutas autenticadas
- ✅ `src/components/auth/AdminRoute.tsx` - Protege rutas de admin
- ✅ `src/components/auth/PublicRoute.tsx` - Rutas públicas (login/register)

### 4. Páginas
- ✅ `src/pages/auth/LoginPage.tsx` - Página de inicio de sesión
- ✅ `src/pages/auth/RegisterPage.tsx` - Página de registro
- ✅ `src/pages/admin/UserManagementPage.tsx` - Gestión de usuarios

### 5. Archivos Modificados
- ✅ `src/lib/supabase.ts` - Agregados tipos de `profiles` y `app_config`

### 6. Archivos Pendientes
- ⏳ `src/App.tsx` - Requiere integración manual (ver instrucciones abajo)

---

## 🚀 Pasos de Implementación

### **Paso 1: Ejecutar el Schema en Supabase**

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `supabase-auth-schema.sql`
4. **IMPORTANTE**: Edita la línea 113 y reemplaza el email del admin:
   ```sql
   INSERT INTO app_config (key, value)
   VALUES ('admin_email', 'TU_EMAIL_AQUI@example.com')  -- ← CAMBIAR AQUÍ
   ON CONFLICT (key) DO NOTHING;
   ```
5. Ejecuta el script completo
6. Verifica que se crearon las tablas:
   - `profiles`
   - `app_config`
7. Verifica que se actualizaron las políticas RLS en:
   - `dishes`
   - `sales`
   - `payments`

---

### **Paso 2: Actualizar App.tsx**

El archivo `App.tsx` necesita modificaciones manuales porque es muy grande. Aquí están los cambios necesarios:

#### **A. Agregar imports al inicio**

Agregar estas líneas después de los imports existentes (aprox. línea 19):

```typescript
// Auth imports
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { UserManagementPage } from '@/pages/admin/UserManagementPage'
import { Users as UsersIcon, LogOut } from 'lucide-react'
import { DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
```

#### **B. Modificar AppSidebar (línea 29-106)**

Reemplazar el componente `AppSidebar`:

```typescript
function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const currentPath = window.location.pathname
  const { isAdmin } = useAuth()  // ← AGREGAR ESTO

  const menuItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/ventas', icon: ShoppingCart, label: 'Nueva Venta' },
    { href: '/historial', icon: History, label: 'Historial' },
    { href: '/reportes', icon: FileText, label: 'Reportes' },
    { href: '/platos', icon: UtensilsCrossed, label: 'Platos' },
    { href: '/admin/usuarios', icon: UsersIcon, label: 'Usuarios', adminOnly: true },  // ← AGREGAR ESTO
  ]

  // ← AGREGAR ESTO
  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {/* ... resto del código del sidebar ... */}
      {visibleItems.map((item) => {  // ← CAMBIAR menuItems por visibleItems
        // ... resto del código
      })}
    </>
  )
}
```

#### **C. Crear componente AppHeader (agregar antes de App)**

Agregar este nuevo componente antes de la función `App()` (aprox. línea 1975):

```typescript
function AppHeader() {
  const { profile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 sm:h-16 sm:px-6">
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => {
              const sidebar = document.querySelector('aside')
              sidebar?.classList.toggle('-translate-x-full')
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xl sm:flex lg:hidden">
              🐟
            </div>
            <h1 className="brand-name text-base sm:text-lg">Deisy&Brian</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button onClick={generatePDF} variant="outline" size="sm" className="h-8 sm:h-9">
            <FileDown className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  {profile?.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm max-w-[150px] truncate">
                  {profile?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                      {profile?.role === 'admin' && '👑 '}
                      {profile?.role}
                    </Badge>
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
```

#### **D. Crear componente AppLayout (agregar antes de App)**

```typescript
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <AppHeader />
        <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 sm:min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/ventas" element={<VentasPage />} />
              <Route path="/historial" element={<HistorialPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/platos" element={<PlatosPage />} />
              <Route path="/venta/:id" element={<DetalleVentaPage />} />
              <Route path="/admin/usuarios" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
```

#### **E. Modificar función App (línea 1975-2040)**

Reemplazar completamente la función `App`:

```typescript
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

---

### **Paso 3: Verificar que funciona**

1. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Primera carga:**
   - El navegador debe redirigirte automáticamente a `/login`
   - Si no estás autenticado, no puedes acceder a ninguna ruta protegida

3. **Registrar usuario admin:**
   - Ve a `/register`
   - Regístrate con el **mismo email** que configuraste en `app_config.admin_email`
   - Usa una contraseña segura (mín. 8 caracteres, 1 mayúscula, 1 número)
   - El sistema automáticamente te convertirá en admin y activará tu cuenta

4. **Iniciar sesión:**
   - Ve a `/login`
   - Ingresa tu email y contraseña
   - Deberías ver el dashboard

5. **Verificar permisos de admin:**
   - En el sidebar, deberías ver el menú "Usuarios"
   - Haz clic en "Usuarios"
   - Deberías ver la página de gestión de usuarios

6. **Probar registro de usuario regular:**
   - Cierra sesión
   - Regístrate con otro email
   - El usuario quedará **inactivo** y no podrá iniciar sesión
   - Inicia sesión con el admin
   - Ve a "Usuarios" y activa al nuevo usuario
   - Cierra sesión del admin
   - Inicia sesión con el usuario regular

---

## 🔒 Seguridad Implementada

### **1. Row Level Security (RLS)**
Todas las tablas tienen políticas RLS que previenen acceso no autorizado:

- ✅ **profiles**: Solo usuarios activos pueden verse a sí mismos, admins ven a todos
- ✅ **dishes**: Solo usuarios activos pueden leer/escribir
- ✅ **sales**: Solo usuarios activos pueden leer/escribir
- ✅ **payments**: Solo usuarios activos pueden leer/escribir
- ✅ **app_config**: Solo admins pueden leer/escribir

### **2. Triggers Automáticos**
- ✅ Crear perfil automáticamente al registrarse
- ✅ Promover a admin si el email coincide con `admin_email`
- ✅ Actualizar `updated_at` automáticamente

### **3. Validaciones en Frontend**
- ✅ Contraseña fuerte (8+ chars, mayúscula, número)
- ✅ Confirmación de contraseña
- ✅ Verificación de cuenta activa al hacer login
- ✅ Protección de rutas con guards

### **4. Restricciones de Admin**
- ✅ No se puede cambiar el rol de un admin
- ✅ No se puede desactivar a un admin
- ✅ No se puede eliminar a un admin

---

## 🎨 UI/UX Implementada

### **Login Page**
- 🎨 Card centrado con branding
- 👁️ Toggle para mostrar/ocultar contraseña
- ✅ Validación de campos
- 🔗 Link a registro

### **Register Page**
- 🎨 Diseño coherente con login
- 🔐 Validación de fortaleza de contraseña
- ✅ Confirmación de contraseña
- 🎯 Selector de rol (vendedor, supervisor)
- 📝 Mensaje de "espera aprobación"

### **User Management (Admin)**
- 📋 Sección de usuarios pendientes
- ✅ Activar/eliminar usuarios pendientes
- 📊 Tabla de usuarios activos
- ✏️ Editar rol y estado de usuarios
- 🚫 Restricciones para admins

### **Header con Usuario**
- 👤 Avatar con inicial del usuario
- 📧 Email del usuario
- 🏷️ Badge con rol
- 🚪 Botón de logout

---

## 🧪 Testing Checklist

### ✅ Test 1: Registro de Usuario
- [ ] Usuario puede registrarse con email y password
- [ ] Perfil creado con `is_active = false`
- [ ] Mensaje de "espera aprobación" se muestra
- [ ] No puede iniciar sesión (cuenta inactiva)

### ✅ Test 2: Login de Admin
- [ ] Admin se registra con email configurado
- [ ] Automáticamente se marca como admin y activo
- [ ] Puede iniciar sesión exitosamente
- [ ] Ve el menú "Usuarios" en sidebar

### ✅ Test 3: Activación de Usuario
- [ ] Admin ve usuarios pendientes en `/admin/usuarios`
- [ ] Admin puede activar usuario
- [ ] Usuario activado puede iniciar sesión
- [ ] Usuario activado ve todas las páginas protegidas

### ✅ Test 4: Protección de Rutas
- [ ] Usuario no autenticado redirigido a `/login`
- [ ] Usuario inactivo no puede acceder
- [ ] Usuario regular no puede acceder a `/admin/usuarios`
- [ ] Admin puede acceder a todas las rutas

### ✅ Test 5: Persistencia de Sesión
- [ ] Sesión persiste después de cerrar navegador
- [ ] Refresh token funciona automáticamente
- [ ] Logout limpia sesión correctamente

### ✅ Test 6: RLS Policies
- [ ] Usuario inactivo no puede leer ventas
- [ ] Usuario activo puede leer y escribir
- [ ] Solo admin puede leer tabla `profiles`
- [ ] Políticas previenen acceso no autorizado

---

## 📝 Notas Importantes

1. **Email del Admin**:
   - ⚠️ Asegúrate de configurar el email correcto en `app_config.admin_email` antes de registrar usuarios
   - El primer usuario con ese email será automáticamente admin

2. **Passwords**:
   - Mínimo 8 caracteres
   - Al menos 1 mayúscula
   - Al menos 1 número

3. **Usuarios Inactivos**:
   - No pueden iniciar sesión
   - No aparecen en el sistema
   - Solo el admin puede activarlos

4. **Sesión**:
   - Se guarda en localStorage
   - Persiste entre recargas
   - Supabase maneja el refresh automáticamente

---

## 🐛 Troubleshooting

### Problema: "No puedo iniciar sesión"
**Solución**:
1. Verifica que tu cuenta esté activa en Supabase Dashboard
2. Ve a Authentication → Users
3. Verifica en la tabla `profiles` que `is_active = true`

### Problema: "Error al crear perfil"
**Solución**:
1. Verifica que el trigger `on_auth_user_created` esté creado
2. Ejecuta nuevamente el schema SQL

### Problema: "No puedo acceder a datos (dishes, sales, etc.)"
**Solución**:
1. Verifica que las políticas RLS estén creadas
2. Verifica que tu usuario esté activo
3. Revisa la consola del navegador para ver errores de Supabase

### Problema: "El admin no se crea automáticamente"
**Solución**:
1. Verifica que el email en `app_config.admin_email` coincida exactamente
2. Verifica que el trigger `check_admin` esté creado
3. Elimina al usuario y regístralo nuevamente

---

## ✨ Próximos Pasos (Opcional)

1. **Agregar más roles**: Crear permisos específicos para vendedor vs supervisor
2. **Password reset**: Implementar recuperación de contraseña
3. **Email verification**: Verificar emails antes de activar
4. **Audit logs**: Registrar acciones de usuarios
5. **Two-factor auth**: Agregar 2FA para admins

---

## 📞 Soporte

Si tienes problemas con la implementación, verifica:
1. Que todas las dependencias estén instaladas (`npm install`)
2. Que las variables de entorno de Supabase estén configuradas
3. Que el schema SQL se haya ejecutado correctamente
4. Que no haya errores en la consola del navegador

---

**Implementado por: Claude Code**
**Fecha: 2026-02-17**
**Versión: 1.0**
