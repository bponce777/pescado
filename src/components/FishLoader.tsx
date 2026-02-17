interface FishLoaderProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FishLoader({ text = 'Cargando...', size = 'md' }: FishLoaderProps) {
  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-bounce`}>
          🐟
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-30"></div>
        </div>
      </div>
      {text && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

export function FullPageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <FishLoader text={text} size="lg" />
    </div>
  )
}
