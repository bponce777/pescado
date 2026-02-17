import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar localStorage primero
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) return savedTheme

    // Verificar preferencia del sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    const body = window.document.body

    // Remover ambas clases primero
    root.classList.remove('light', 'dark')
    body.classList.remove('light', 'dark')

    // Agregar la clase del tema actual
    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.add('light')
      body.classList.add('light')
      root.style.colorScheme = 'light'
    }

    // Guardar en localStorage
    localStorage.setItem('theme', theme)

    // Debug: verificar que se aplicó
    console.log('Tema aplicado:', theme, 'Clases HTML:', root.className)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
