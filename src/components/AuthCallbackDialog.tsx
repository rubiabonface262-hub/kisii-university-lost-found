import { useState, type FormEvent } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { acceptInvite, updateUser } from '@netlify/identity'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIdentity } from './IdentityProvider'

/** Handles admin invite acceptance and password recovery links that land on any page. */
export function AuthCallbackDialog() {
  const { callback, clearCallback } = useIdentity()
  const router = useRouter()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsPassword = callback?.type === 'invite' || callback?.type === 'recovery'
  if (!needsPassword) return null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    setPending(true)
    setError(null)
    try {
      if (callback?.type === 'invite' && callback.token) await acceptInvite(callback.token, password)
      else await updateUser({ password })
      clearCallback()
      toast.success('Password saved. You’re signed in.')
      await router.invalidate()
      await navigate({ to: '/admin' })
    } catch {
      setError('We couldn’t save your password. The link may have expired.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && clearCallback()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{callback?.type === 'invite' ? 'Welcome, administrator' : 'Choose a new password'}</DialogTitle>
          <DialogDescription>Set a password to finish signing in to the Lost & Found admin desk.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
