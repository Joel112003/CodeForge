import { useEffect } from 'react'
import { getMe } from '../services/api'
import useAuthStore from '../store/authStore'

export function useHydrate() {
  const { setAuth, setHydrated } = useAuthStore()

  useEffect(() => {
    let isMounted = true

    async function hydrate() {
      try {
        const res = await getMe()
        if (!isMounted) return
        const csrfToken = res.data.csrfToken || res.data.csrf_token
        setAuth(res.data.user, csrfToken)
      } catch {
        if (!isMounted) return
      } finally {
        if (isMounted) setHydrated(true)
      }
    }

    hydrate()
    return () => { isMounted = false }
  }, [setAuth, setHydrated])
}
