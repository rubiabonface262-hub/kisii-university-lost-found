import { Link } from '@tanstack/react-router'
import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const NAV = [
  { to: '/items', label: 'Browse items' },
  { to: '/report', label: 'Report an item' },
  { to: '/admin', label: 'Admin desk' },
] as const

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Search className="size-4.5" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold">Lost & Found</span>
        <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Kisii University</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="ml-2">
            <Link to="/report" search={{ kind: 'lost' }}>
              I lost something
            </Link>
          </Button>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Kisii University Lost & Found</SheetDescription>
            </SheetHeader>
            <nav aria-label="Mobile" className="grid gap-1 px-4">
              <Link to="/" className="rounded-md px-3 py-2.5 font-medium hover:bg-muted">
                Home
              </Link>
              {NAV.map((item) => (
                <Link key={item.to} to={item.to} className="rounded-md px-3 py-2.5 font-medium hover:bg-muted">
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/50">
      <div className="mx-auto grid max-w-content gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            A shared board for the Kisii University community to reunite people with the things they’ve lost on campus.
          </p>
        </div>
        <div className="text-sm">
          <h2 className="mb-2 font-sans text-sm font-semibold tracking-normal">Get started</h2>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/report" search={{ kind: 'lost' }} className="hover:text-foreground">Report a lost item</Link></li>
            <li><Link to="/report" search={{ kind: 'found' }} className="hover:text-foreground">Report a found item</Link></li>
            <li><Link to="/items" className="hover:text-foreground">Search the board</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h2 className="mb-2 font-sans text-sm font-semibold tracking-normal">Stay safe</h2>
          <p className="text-muted-foreground">
            Meet in a public place on campus to hand over items, and ask the owner to describe the item before returning it.
          </p>
        </div>
      </div>
    </footer>
  )
}
