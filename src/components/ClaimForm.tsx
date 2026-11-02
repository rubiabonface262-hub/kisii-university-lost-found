import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitClaim } from '@/lib/items.functions'

export function ClaimForm({ itemId }: { itemId: number }) {
  const [state, setState] = useState<'idle' | 'pending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'pending') return
    const f = new FormData(event.currentTarget)
    const value = (name: string) => String(f.get(name) ?? '')
    if (!value('phone') && !value('email')) return setError('Add a phone number or email so the office can reach you.')
    setState('pending')
    setError(null)
    try {
      await submitClaim({
        data: {
          itemId,
          claimantName: value('claimantName'),
          regNumber: value('regNumber'),
          phone: value('phone'),
          email: value('email'),
          proof: value('proof'),
          website: value('website') || undefined,
        },
      })
      setState('sent')
    } catch (e) {
      setState('idle')
      setError(readError(e))
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="rounded-2xl border border-found/30 bg-found-soft p-5">
        <p className="flex items-center gap-2 font-semibold text-found"><CheckCircle2 className="size-5" aria-hidden /> Claim sent to the Lost & Found office</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Staff compare your description with the private details the finder recorded. If it matches, they contact you. Bring your student ID
          to collect the item.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-primary p-5 text-primary-foreground">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5" aria-hidden /> Is this yours? Claim it</h2>
      <p className="mt-1 text-sm text-primary-foreground/80">
        Prove it’s yours by describing details that aren’t shown here, like the serial number, wallpaper, contents or marks. The office checks
        every claim and asks for your student ID at handover.
      </p>
      <fieldset disabled={state === 'pending'} className="mt-4 grid gap-3 [&_input]:bg-background [&_input]:text-foreground [&_textarea]:bg-background [&_textarea]:text-foreground">
        <legend className="sr-only">Claim details</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="claimantName">Full name</Label>
            <Input id="claimantName" name="claimantName" required minLength={2} maxLength={80} autoComplete="name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="regNumber">Registration / staff no.</Label>
            <Input id="regNumber" name="regNumber" required minLength={4} maxLength={30} placeholder="e.g. EB1/12345/21" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="claim-phone">Phone / WhatsApp</Label>
            <Input id="claim-phone" name="phone" type="tel" maxLength={30} autoComplete="tel" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="claim-email">Email</Label>
            <Input id="claim-email" name="email" type="email" maxLength={120} autoComplete="email" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="proof">Proof of ownership</Label>
          <Textarea
            id="proof"
            name="proof"
            required
            minLength={20}
            maxLength={1500}
            rows={4}
            placeholder="What only the owner would know: serial/IMEI, what’s inside, stickers, scratches, name written inside, where and when you lost it…"
          />
        </div>
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="claim-website">Website</label>
          <input id="claim-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-background px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="secondary" size="lg">
          {state === 'pending' ? <><Loader2 className="animate-spin" /> Sending claim…</> : 'Send claim to the office'}
        </Button>
      </fieldset>
    </form>
  )
}

export function readError(e: unknown) {
  if (!(e instanceof Error)) return 'Something went wrong. Please try again.'
  // Validation failures arrive as a JSON list of issues; show the first message.
  try {
    const issues = JSON.parse(e.message) as { message?: string }[]
    if (Array.isArray(issues) && issues[0]?.message) return issues[0].message
  } catch {
    // not JSON
  }
  return e.message
}
