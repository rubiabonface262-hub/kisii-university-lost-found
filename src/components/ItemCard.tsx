import { Link } from '@tanstack/react-router'
import { CalendarDays, CheckCircle2, ImageOff, Lock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { imageSrc, type Kind, type PublicItem } from '@/lib/catalog'
import { CategoryIcon } from './CategoryIcon'

export function KindBadge({ kind, className }: { kind: Kind; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        kind === 'lost' ? 'bg-lost-soft text-lost' : 'bg-found-soft text-found',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', kind === 'lost' ? 'bg-lost' : 'bg-found')} aria-hidden />
      {kind === 'lost' ? 'Lost' : 'Found'}
    </span>
  )
}

export function ResolvedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground', className)}>
      <CheckCircle2 className="size-3.5" aria-hidden /> Resolved
    </span>
  )
}

export function formatDate(value: string) {
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ItemCard({ item, compact = false }: { item: PublicItem; compact?: boolean }) {
  return (
    <Link
      to="/items/$itemId"
      params={{ itemId: String(item.id) }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs outline-none transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className={cn('relative bg-muted', compact ? 'aspect-[16/9]' : 'aspect-[4/3]')}>
        {item.imageUrl ? (
          <img
            src={imageSrc(item.imageUrl, 480)}
            alt=""
            loading="lazy"
            className={cn('size-full object-cover', item.status === 'resolved' && 'grayscale-[60%]')}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <CategoryIcon category={item.category} className="size-9 opacity-60" />
              {item.photoHidden ? (
                <span className="flex items-center gap-1 text-xs"><Lock className="size-3" aria-hidden /> Photo kept private</span>
              ) : (
                <span className="flex items-center gap-1 text-xs"><ImageOff className="size-3" aria-hidden /> No photo</span>
              )}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <KindBadge kind={item.kind} className="shadow-sm" />
          {item.status === 'resolved' && <ResolvedBadge className="shadow-sm" />}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-muted-foreground">{item.category}</p>
        <h3 className="line-clamp-2 font-sans text-base leading-snug font-semibold tracking-normal group-hover:text-primary">
          {item.title}
        </h3>
        <div className="mt-auto space-y-1 pt-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" aria-hidden /><span className="truncate">{item.location}</span></p>
          <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" aria-hidden />{item.kind === 'lost' ? 'Lost' : 'Found'} {formatDate(item.eventDate)}</p>
        </div>
      </div>
    </Link>
  )
}

export function ItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted motion-reduce:animate-none" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  )
}
