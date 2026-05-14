import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router.tsx'
import { useAuthStore } from './stores/authStore.ts'
import './styles/index.css'

async function bootstrap() {
  await useAuthStore.getState().init()
  createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
}

void bootstrap()
