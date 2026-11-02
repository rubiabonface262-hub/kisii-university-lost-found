import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUser, handleAuthCallback, onAuthChange, type CallbackResult, type User } from '@netlify/identity'

type IdentityState = {
  user: User | null
  ready: boolean
  callback: CallbackResult | null
  clearCallback: () => void
}

const IdentityContext = createContext<IdentityState | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [callback, setCallback] = useState<CallbackResult | null>(null)

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthChange((_event, next) => {
      if (active) setUser(next)
    })
    async function initialize() {
      try {
        const parameters = new URLSearchParams(window.location.hash.slice(1))
        const hasCallback = ['confirmation_token', 'recovery_token', 'invite_token', 'email_change_token', 'access_token'].some(
          (name) => parameters.has(name),
        )
        const result = hasCallback ? await handleAuthCallback() : null
        const current = await getUser()
        if (!active) return
        setCallback(result)
        setUser(current)
      } catch {
        // Identity may be unavailable (e.g. plain local dev); the public site still works.
      } finally {
        if (active) setReady(true)
      }
    }
    void initialize()
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <IdentityContext.Provider value={{ user, ready, callback, clearCallback: () => setCallback(null) }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const state = useContext(IdentityContext)
  if (!state) throw new Error('IdentityProvider is required')
  return state
}
