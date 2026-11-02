import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, CheckCircle2, Loader2, Lock, Search, X } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CATEGORIES, IMAGE_TYPES, KINDS, LOCATIONS, MAX_IMAGE_BYTES, type Kind, type PublicItem } from '@/lib/catalog'

export const Route = createFileRoute('/report')({
  validateSearch: z.object({ kind: z.enum(KINDS).optional().catch(undefined) }),
  head: () => ({ meta: [{ title: 'Report a lost or found item · Kisii University' }] }),
  component: ReportPage,
})

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ReportPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const kind: Kind = search.kind ?? 'lost'
  const isLost = kind === 'lost'
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<PublicItem | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [maxDate, setMaxDate] = useState<string | undefined>(undefined)

  useEffect(() => setMaxDate(today()), [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)
    if (!file) return setPreview(null)
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      event.target.value = ''
      setError('Photo must be a JPG, PNG, WebP or GIF.')
      return setPreview(null)
    }
    if (file.size > MAX_IMAGE_BYTES) {
      event.target.value = ''
      setError('Photo must be 5 MB or smaller.')
      return setPreview(null)
    }
    setPreview(URL.createObjectURL(file))
  }

  function clearPhoto() {
    const input = formRef.current?.elements.namedItem('photo') as HTMLInputElement | null
    if (input) input.value = ''
    setPreview(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    data.set('kind', kind)
    if (!data.get('contactPhone') && !data.get('contactEmail')) {
      setError('Add a phone number or email so people can reach you.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/items', { method: 'POST', body: data })
      const body = (await response.json().catch(() => null)) as (PublicItem & { error?: string }) | null
      if (!response.ok || !body) throw new Error(body?.error ?? 'Something went wrong. Please try again.')
      setCreated(body)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-reading px-4 py-16 text-center sm:px-6">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-found-soft text-found">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Your report is live</h1>
        <p className="mt-2 text-muted-foreground">
          {created.kind === 'lost'
            ? 'Your item is on the board. When a matching found item comes in, the Lost & Found office checks it against your private details and contacts you.'
            : 'Thank you for helping! Please drop the item at the Lost & Found office. The owner has to prove it’s theirs and show their student ID before the office hands it over.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/items/$itemId" params={{ itemId: String(created.id) }}>
              <Search /> View report & matches
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setCreated(null); setPreview(null) }}>
            Report another item
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold sm:text-4xl">Report an item</h1>
      <p className="mt-1 text-muted-foreground">It takes about a minute. The more detail you add, the easier it is to match.</p>

      <div role="radiogroup" aria-label="What happened?" className="mt-6 grid grid-cols-2 gap-3">
        {KINDS.map((k) => {
          const active = k === kind
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => void navigate({ search: { kind: k }, replace: true })}
              className={cn(
                'rounded-2xl border-2 p-4 text-left transition-colors',
                active
                  ? k === 'lost' ? 'border-lost bg-lost-soft' : 'border-found bg-found-soft'
                  : 'border-border bg-card hover:border-muted-foreground/40',
              )}
            >
              <span className={cn('block font-display text-lg font-semibold', active && (k === 'lost' ? 'text-lost' : 'text-found'))}>
                {k === 'lost' ? 'I lost something' : 'I found something'}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {k === 'lost' ? 'Let finders know what to look for' : 'Help the owner track it down'}
              </span>
            </button>
          )
        })}
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="mt-8 grid gap-8">
        <fieldset disabled={pending} className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-semibold">About the item</legend>
          <div className="grid gap-2">
            <Label htmlFor="title">What is it?</Label>
            <Input id="title" name="title" required minLength={3} maxLength={80} placeholder={isLost ? 'e.g. Black HP laptop bag' : 'e.g. Student ID card – Faculty of Education'} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
                <SelectTrigger id="category" className="w-full"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eventDate">{isLost ? 'When did you lose it?' : 'When did you find it?'}</Label>
              <Input id="eventDate" name="eventDate" type="date" required max={maxDate} defaultValue={maxDate} key={maxDate} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">{isLost ? 'Where did you last have it?' : 'Where did you find it?'}</Label>
            <Select name="location" required>
              <SelectTrigger id="location" className="w-full"><SelectValue placeholder="Choose a place on campus" /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              maxLength={1000}
              rows={4}
              placeholder={isLost ? 'Colour, brand, general look… anything that helps people spot it.' : 'A general description only, e.g. “Black phone in a case”. Put identifying details in the private box below.'}
            />
            <p className="text-xs text-muted-foreground">Shown publicly.</p>
          </div>
          <div className="grid gap-2 rounded-xl border border-primary/25 bg-secondary/60 p-4">
            <Label htmlFor="secretDetails" className="flex items-center gap-1.5"><Lock className="size-3.5 text-primary" aria-hidden /> Private identifying details</Label>
            <Textarea
              id="secretDetails"
              name="secretDetails"
              maxLength={1000}
              rows={3}
              placeholder={isLost ? 'Serial/IMEI number, lock-screen wallpaper, what’s inside, scratches, name written inside…' : 'Serial number, name on ID, wallpaper, contents, marks, scratches — anything only the real owner would know.'}
            />
            <p className="text-xs text-muted-foreground">
              Only Lost & Found office staff can see this. They compare it with what claimants describe, so nobody can claim an item that isn’t theirs.
            </p>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Photo (optional)</span>
            {!isLost && <p className="text-xs text-muted-foreground">Photos of found items are kept private for staff, so they can’t be copied into a false claim.</p>}
            {preview ? (
              <div className="relative w-full max-w-xs overflow-hidden rounded-xl border">
                <img src={preview} alt="Selected photo preview" className="aspect-[4/3] w-full object-cover" />
                <Button type="button" size="icon-sm" variant="secondary" className="absolute top-2 right-2" onClick={clearPhoto} aria-label="Remove photo">
                  <X />
                </Button>
              </div>
            ) : null}
            <label
              htmlFor="photo"
              className={cn('flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50', preview && 'sr-only')}
            >
              <Camera className="size-5 text-primary" aria-hidden />
              <span><span className="font-medium text-foreground">Add a photo</span> · JPG, PNG or WebP up to 5 MB</span>
            </label>
            <input id="photo" name="photo" type="file" accept={IMAGE_TYPES.join(',')} onChange={onPhoto} className="sr-only" />
          </div>
        </fieldset>

        <fieldset disabled={pending} className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-semibold">How can the office reach you?</legend>
          <div className="grid gap-2">
            <Label htmlFor="contactName">Your name</Label>
            <Input id="contactName" name="contactName" required minLength={2} maxLength={80} autoComplete="name" placeholder="e.g. Brian Ombati" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Phone / WhatsApp</Label>
              <Input id="contactPhone" name="contactPhone" type="tel" maxLength={30} autoComplete="tel" placeholder="07XX XXX XXX" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" maxLength={120} autoComplete="email" placeholder="you@students.kisiiuniversity.ac.ke" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Add at least one. Your name and contact details are private. Only Lost & Found office staff can see them.</p>
          {/* Honeypot for spam bots — hidden from people and screen readers */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className={cn('h-12 text-base', isLost ? 'bg-lost hover:bg-lost/90' : 'bg-found hover:bg-found/90')}>
          {pending ? <><Loader2 className="animate-spin" /> Posting…</> : isLost ? 'Post lost item report' : 'Post found item report'}
        </Button>
      </form>
    </div>
  )
}
