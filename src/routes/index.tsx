import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { ArrowRight, BellRing, HandHeart, PackageSearch, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemCard } from '@/components/ItemCard'
import { CategoryIcon } from '@/components/CategoryIcon'
import { CATEGORIES } from '@/lib/catalog'
import { getStats, searchItems } from '@/lib/items.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [stats, recent] = await Promise.all([getStats(), searchItems({ data: { limit: 8 } })])
    return { stats, recent }
  },
  component: Home,
})

function Home() {
  const { stats, recent } = Route.useLoaderData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function onSearch(event: FormEvent) {
    event.preventDefault()
    void navigate({ to: '/items', search: query.trim() ? { q: query.trim() } : {} })
  }

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src="/.netlify/images?url=/img/hero.png&w=1600&fm=webp&q=75"
          srcSet="/.netlify/images?url=/img/hero.png&w=800&fm=webp&q=70 800w, /.netlify/images?url=/img/hero.png&w=1600&fm=webp&q=75 1600w"
          sizes="100vw"
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[oklch(0.2_0.05_155/0.92)] via-[oklch(0.22_0.05_155/0.75)] to-[oklch(0.22_0.05_155/0.25)]" />
        <div className="mx-auto max-w-content px-4 py-20 sm:px-6 md:py-28">
          <div className="max-w-2xl text-primary-foreground">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-accent-foreground uppercase">
              <HandHeart className="size-3.5" aria-hidden /> Kisii University community board
            </p>
            <h1 className="text-4xl leading-[1.05] font-semibold sm:text-5xl md:text-6xl">
              Lost it on campus? <span className="text-accent">Let’s find it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
              Report what you’ve lost, post what you’ve found, and search every open report in one place — from the library to the hostels.
            </p>
            <form onSubmit={onSearch} role="search" className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-card p-2 shadow-xl sm:flex-row">
              <label htmlFor="hero-search" className="sr-only">Search lost and found items</label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="hero-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try “student ID”, “black backpack”, “keys”…"
                  className="h-12 border-0 pl-10 text-base text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6">Search</Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 bg-lost text-white hover:bg-lost/90">
                <Link to="/report" search={{ kind: 'lost' }}>I lost something</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/report" search={{ kind: 'found' }}>I found something</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Board statistics" className="mx-auto -mt-10 max-w-content px-4 sm:px-6">
        <div className="grid grid-cols-3 divide-x rounded-2xl border bg-card shadow-sm">
          <Stat label="Open lost reports" value={stats.openLost} tone="text-lost" />
          <Stat label="Items waiting to be claimed" value={stats.openFound} tone="text-found" />
          <Stat label="Reunited & resolved" value={stats.resolved} tone="text-primary" />
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Latest reports</h2>
            <p className="mt-1 text-muted-foreground">Fresh from around campus. Recognise something? Open it to get in touch.</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/items">View all <ArrowRight /></Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <PackageSearch className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <h3 className="mt-3 text-lg font-semibold">The board is empty — for now</h3>
            <p className="mx-auto mt-1 max-w-md text-muted-foreground">Be the first to post. Every report helps someone get their things back.</p>
            <Button asChild className="mt-5"><Link to="/report">Post the first report</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
        <Button asChild variant="outline" className="mt-6 w-full sm:hidden">
          <Link to="/items">View all reports</Link>
        </Button>
      </section>

      <section className="mx-auto max-w-content px-4 pt-16 sm:px-6">
        <h2 className="text-2xl font-semibold sm:text-3xl">Browse by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to="/items"
              search={{ category }}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-secondary"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <CategoryIcon category={category} className="size-4.5" />
              </span>
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 pt-16 sm:px-6">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            <Step n={1} icon={<BellRing className="size-5" aria-hidden />} title="Report it">
              Lost something? Post what it looks like and where you last had it. Found something? Post it so the owner can find you.
            </Step>
            <Step n={2} icon={<Search className="size-5" aria-hidden />} title="Search & match">
              Anyone can search the board. Each report shows possible matches from the other side — lost meets found.
            </Step>
            <Step n={3} icon={<ShieldCheck className="size-5" aria-hidden />} title="Hand over & resolve">
              Meet safely on campus to return the item. The Lost & Found admin then marks the case resolved.
            </Step>
          </ol>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="px-3 py-5 text-center sm:px-6">
      <p className={`font-display text-3xl font-semibold sm:text-4xl ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  )
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl bg-white/8 p-5 ring-1 ring-white/15">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground">{icon}</span>
        <span className="text-sm font-semibold text-primary-foreground/70">Step {n}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-primary-foreground/80">{children}</p>
    </li>
  )
}
