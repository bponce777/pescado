import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { SplashScreen } from './components/SplashScreen.tsx'

registerSW({ immediate: true })

function Root() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashShown') === '1'
  )

  const handleSplashFinish = () => {
    sessionStorage.setItem('splashShown', '1')
    setSplashDone(true)
  }

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <App />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
