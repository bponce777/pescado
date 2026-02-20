interface FishLoaderProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FishLoader({ text = 'Cargando...', size = 'md' }: FishLoaderProps) {
  const ringSize = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-24 w-24' }
  const imgSize  = { sm: 'h-7 w-7',   md: 'h-10 w-10', lg: 'h-14 w-14' }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`relative ${ringSize[size]}`}>
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/logo.png" alt="" className={`${imgSize[size]} object-contain`} />
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
