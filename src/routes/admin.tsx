import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { CheckCircle2, ExternalLink, Loader2, LogOut, RotateCcw, Search, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import { login, logout, requestPasswordRecovery } from '@netlify/identity'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { KindBadge, ResolvedBadge, formatDate } from '@/components/ItemCard'
import { ResolveDialog } from '@/components/ResolveDialog'
import { ClaimReview } from '@/components/ClaimReview'
import { STATUS_FILTERS, imageSrc, type AdminClaim, type AdminItem } from '@/lib/catalog'
import { deleteItem, getViewer, listAllForAdmin, listClaims, reopenItem } from '@/lib/items.functions'

const searchSchema = z.object({
  status: z.enum([...STATUS_FILTERS, 'claims']).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
})

export const Route = createFileRoute('/admin')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const viewer = await getViewer()
    const none = { items: [] as AdminItem[], claims: [] as { claim: AdminClaim; item: AdminItem }[] }
    if (!viewer?.isAdmin) return { viewer, ...none }
    if (deps.status === 'claims') return { viewer, ...none, claims: await listClaims({ data: { status: 'pending' } }) }
    const items = await listAllForAdmin({ data: { status: deps.status ?? 'open', q: deps.q } })
    return { viewer, ...none, items }
  },
  head: () => ({ meta: [{ title: 'Admin desk · Kisii University Lost & Found' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminPage,
})

function AdminPage() {
  const { viewer } = Route.useLoaderData()
  if (!viewer) return <SignIn />
  if (!viewer.isAdmin) return <NotAdmin email={viewer.email} />
  return <Dashboard />
}

function SignIn() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'pending' | 'error' | 'reset-sent'>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'pending') return
    const fields = new FormData(event.currentTarget)
    setState('pending')
    try {
      await login(String(fields.get('email')), String(fields.get('password')))
      await router.invalidate()
      setState('idle')
    } catch {
      setState('error')
    }
  }

  async function forgot(event: React.MouseEvent<HTMLButtonElement>) {
    const email = (event.currentTarget.form?.elements.namedItem('email') as HTMLInputElement | null)?.value
    if (!email) return toast.error('Enter your email first, then choose “Forgot password”.')
    // Always show the same message so the form doesn't reveal which emails have accounts.
    await requestPasswordRecovery(email).catch(() => undefined)
    setState('reset-sent')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Admin desk sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">For Lost & Found office staff. Students don’t need an account to report or search.</p>
        <form onSubmit={submit} className="mt-6">
          <fieldset disabled={state === 'pending'} className="grid gap-4">
            <legend className="sr-only">Sign in details</legend>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state === 'error' && <p role="alert" className="text-sm text-destructive">We couldn’t sign you in. Check your details and try again.</p>}
            {state === 'reset-sent' && <p role="status" className="text-sm text-found">If that account exists, a reset link is on its way.</p>}
            <Button type="submit" size="lg">{state === 'pending' ? <><Loader2 className="animate-spin" /> Signing in…</> : 'Sign in'}</Button>
            <Button type="button" variant="link" size="sm" onClick={forgot}>Forgot password?</Button>
          </fieldset>
        </form>
      </div>
    </div>
  )
}

function SignOutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await logout()
        await router.invalidate()
      }}
    >
      <LogOut /> Sign out
    </Button>
  )
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold">No admin access</h1>
      <p className="mt-2 text-muted-foreground">
        You’re signed in as <span className="font-medium text-foreground">{email}</span>, but this account hasn’t been given the admin role.
        Ask the Lost & Found office to grant access.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild><Link to="/">Back to the board</Link></Button>
        <SignOutButton />
      </div>
    </div>
  )
}

function Dashboard() {
  const { viewer, items, claims } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [query, setQuery] = useState(search.q ?? '')
  const status = search.status ?? 'open'
  const refresh = () => router.invalidate()

  function onSearch(event: FormEvent) {
    event.preventDefault()
    void navigate({ search: (prev) => ({ ...prev, q: query.trim() || undefined }), replace: true })
  }

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Signed in as {viewer?.email}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Admin desk</h1>
          <p className="mt-1 text-muted-foreground">Verify ownership claims, then mark cases resolved once an item is back with its owner.</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={status} onValueChange={(v) => void navigate({ search: (prev) => ({ ...prev, status: v === 'open' ? undefined : (v as 'resolved' | 'all' | 'claims') }), replace: true })}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="claims"><UserCheck /> Claims</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={onSearch} role="search" className="flex gap-2 md:w-96">
          <label htmlFor="admin-search" className="sr-only">Search reports</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="admin-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Item, reporter or place" className="pl-9" />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      {status === 'claims' ? (
        claims.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">No claims waiting for review.</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {claims.map(({ claim, item }) => (
              <div key={claim.id} className="grid gap-2">
                <Link to="/items/$itemId" params={{ itemId: String(item.id) }} className="flex items-center gap-3 rounded-xl px-1 hover:underline">
                  <Thumb item={item} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">Claim for #{item.id}: {item.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{item.location} · found {formatDate(item.eventDate)} by {item.contactName}</span>
                  </span>
                </Link>
                <ClaimReview claim={claim} item={item} onDone={refresh} />
              </div>
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
          {status === 'open' ? 'No open reports. Nice work — everything is resolved.' : 'No reports match this view.'}
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="mt-6 grid gap-3 md:hidden">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border bg-card p-4">
                <div className="flex gap-3">
                  <Thumb item={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <KindBadge kind={item.kind} />
                      {item.status === 'resolved' && <ResolvedBadge />}
                      <ClaimsBadge item={item} />
                    </div>
                    <p className="mt-1.5 truncate font-semibold">{item.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.location} · {formatDate(item.eventDate)}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.contactName} {item.contactPhone && `· ${item.contactPhone}`}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RowActions item={item} onDone={refresh} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="mt-6 hidden overflow-hidden rounded-2xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Where & when</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Thumb item={item} />
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">#{item.id} · {item.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <KindBadge kind={item.kind} />
                        <ClaimsBadge item={item} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-48 truncate text-sm">{item.location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.eventDate)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.contactName}</p>
                      <p className="max-w-44 truncate text-xs text-muted-foreground">{item.contactPhone || item.contactEmail}</p>
                    </TableCell>
                    <TableCell>
                      {item.status === 'resolved' ? (
                        <div>
                          <ResolvedBadge />
                          {item.resolvedAt && <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.resolvedAt)}</p>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Open since {formatDate(item.createdAt)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <RowActions item={item} onDone={refresh} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function ClaimsBadge({ item }: { item: AdminItem }) {
  if (!item.pendingClaims) return null
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
      {item.pendingClaims} claim{item.pendingClaims === 1 ? '' : 's'} to review
    </span>
  )
}

function Thumb({ item }: { item: AdminItem }) {
  return item.imageUrl ? (
    <img src={imageSrc(item.imageUrl, 120)} alt="" className="size-12 shrink-0 rounded-lg object-cover" loading="lazy" />
  ) : (
    <div className="size-12 shrink-0 rounded-lg bg-muted" aria-hidden />
  )
}

function RowActions({ item, onDone }: { item: AdminItem; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)

  async function reopen() {
    setBusy(true)
    try {
      await reopenItem({ data: { id: item.id } })
      toast.success('Report reopened')
      await onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reopen this report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/items/$itemId" params={{ itemId: String(item.id) }} aria-label={`View ${item.title}`}>
          <ExternalLink /> View
        </Link>
      </Button>
      {item.status === 'open' ? (
        <ResolveDialog item={item} onDone={onDone} trigger={<Button size="sm"><CheckCircle2 /> Resolve</Button>} />
      ) : (
        <Button size="sm" variant="outline" onClick={reopen} disabled={busy}><RotateCcw /> Reopen</Button>
      )}
      <DeleteButton item={item} onDone={onDone} />
    </>
  )
}

function DeleteButton({ item, onDone }: { item: AdminItem; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await deleteItem({ data: { id: item.id } })
      toast.success('Report deleted')
      setOpen(false)
      await onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete this report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Delete ${item.title}`} className="text-muted-foreground hover:text-destructive">
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this report?</DialogTitle>
          <DialogDescription>Use this for spam or duplicates. “{item.title}” will be permanently removed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>{busy ? 'Deleting…' : 'Delete report'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
