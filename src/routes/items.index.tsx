import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { PackageSearch, Search, X } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ItemCard, ItemCardSkeleton } from '@/components/ItemCard'
import { cn } from '@/lib/utils'
import { CATEGORIES, KINDS, STATUS_FILTERS } from '@/lib/catalog'
import { searchItems } from '@/lib/items.functions'

const searchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  kind: z.enum(KINDS).optional().catch(undefined),
  category: z.enum(CATEGORIES).optional().catch(undefined),
  status: z.enum(STATUS_FILTERS).optional().catch(undefined),
})

export const Route = createFileRoute('/items/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => searchItems({ data: deps }),
  pendingComponent: ItemsPending,
  head: () => ({ meta: [{ title: 'Browse lost & found items · Kisii University' }] }),
  component: ItemsPage,
})

const KIND_TABS = [
  { value: undefined, label: 'All' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
] as const

function ItemsPage() {
  const items = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [query, setQuery] = useState(search.q ?? '')

  useEffect(() => setQuery(search.q ?? ''), [search.q])

  function update(next: Partial<z.infer<typeof searchSchema>>) {
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    update({ q: query.trim() || undefined })
  }

  const hasFilters = Boolean(search.q || search.kind || search.category || (search.status && search.status !== 'open'))

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Search the board</h1>
          <p className="mt-1 text-muted-foreground">Every item reported lost or found across Kisii University campuses.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/report">Can’t find it? Post a report</Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border bg-card p-3 shadow-xs sm:p-4">
        <form onSubmit={onSubmit} role="search" className="flex gap-2">
          <label htmlFor="items-search" className="sr-only">Search items</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="items-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, colour, brand or place…"
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" className="h-10">Search</Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Report type" className="inline-flex rounded-lg bg-muted p-1">
            {KIND_TABS.map((tab) => {
              const active = search.kind === tab.value
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ kind: tab.value })}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <Select value={search.category ?? 'any'} onValueChange={(v) => update({ category: v === 'any' ? undefined : (v as (typeof CATEGORIES)[number]) })}>
            <SelectTrigger className="h-9 w-[200px]" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.status ?? 'open'} onValueChange={(v) => update({ status: v === 'open' ? undefined : (v as 'resolved' | 'all') })}>
            <SelectTrigger className="h-9 w-[160px]" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open only</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">Open & resolved</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => void navigate({ search: {}, replace: true })}>
              <X /> Clear filters
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {items.length} {items.length === 1 ? 'report' : 'reports'}{search.q ? ` matching “${search.q}”` : ''}
      </p>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed bg-card p-10 text-center">
          <PackageSearch className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">Nothing matches yet</h2>
          <p className="mx-auto mt-1 max-w-md text-muted-foreground">
            Try a different word or category. If you’ve lost something, post a report so whoever finds it can reach you.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild><Link to="/report" search={{ kind: 'lost' }}>Report a lost item</Link></Button>
            <Button asChild variant="outline"><Link to="/report" search={{ kind: 'found' }}>Report a found item</Link></Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

function ItemsPending() {
  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6" role="status" aria-label="Loading items">
      <div className="h-9 w-64 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-6 h-28 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <ItemCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
