import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, CheckCircle2, Lock, Mail, MapPin, PackageCheck, Phone, ShieldAlert, Sparkles, Tag, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ItemCard, KindBadge, ResolvedBadge, formatDate } from '@/components/ItemCard'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ResolveDialog } from '@/components/ResolveDialog'
import { ClaimForm } from '@/components/ClaimForm'
import { ClaimReview } from '@/components/ClaimReview'
import { imageSrc } from '@/lib/catalog'
import { getItemWithMatches } from '@/lib/items.functions'

export const Route = createFileRoute('/items/$itemId')({
  loader: async ({ params }) => {
    const id = Number(params.itemId)
    if (!Number.isInteger(id) || id <= 0) throw notFound()
    const result = await getItemWithMatches({ data: { id } })
    if (!result) throw notFound()
    return result
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.item.kind === 'lost' ? 'Lost' : 'Found'}: ${loaderData.item.title} · Kisii University Lost & Found` },
          { name: 'description', content: `${loaderData.item.category} · ${loaderData.item.location}` },
        ]
      : [],
  }),
  component: ItemPage,
})

function ItemPage() {
  const data = Route.useLoaderData()
  const { admin } = data
  // Admins see the private photo and full match details; everyone else sees the public view.
  const item = admin?.item ?? data.item
  const matches = admin?.matches ?? data.matches
  const isAdmin = Boolean(admin)
  const router = useRouter()
  const refresh = () => router.invalidate()
  const isLost = item.kind === 'lost'

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/items"><ArrowLeft /> Back to all items</Link>
      </Button>

      {item.status === 'resolved' && (
        <Alert className="mb-6 border-primary/30 bg-secondary">
          <CheckCircle2 className="text-primary" />
          <AlertTitle>This case has been resolved</AlertTitle>
          <AlertDescription>
            {item.resolvedNote || 'The item has been reunited with its owner.'}
            {item.resolvedAt && <> · {formatDate(item.resolvedAt)}</>}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-3xl border bg-muted">
          {item.imageUrl ? (
            <img
              src={imageSrc(item.imageUrl, 1000)}
              srcSet={`${imageSrc(item.imageUrl, 600)} 600w, ${imageSrc(item.imageUrl, 1000)} 1000w`}
              sizes="(min-width: 1024px) 55vw, 100vw"
              alt={item.title}
              className="aspect-[4/3] size-full object-cover"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-muted-foreground">
              <div className="max-w-xs px-6 text-center">
                <CategoryIcon category={item.category} className="mx-auto size-16 opacity-50" />
                {item.photoHidden ? (
                  <p className="mt-2 flex items-start justify-center gap-1.5 text-sm"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> The photo is kept private by the Lost & Found office so it can’t be copied into a false claim.</p>
                ) : (
                  <p className="mt-2 text-sm">No photo was added</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <KindBadge kind={item.kind} />
              {item.status === 'resolved' && <ResolvedBadge />}
            </div>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{item.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Report #{item.id} · posted {formatDate(item.createdAt)}</p>
          </div>

          <dl className="grid gap-3 rounded-2xl border bg-card p-5 text-sm">
            <Detail icon={<Tag />} label="Category" value={item.category} />
            <Detail icon={<MapPin />} label={isLost ? 'Last seen' : 'Found at'} value={item.location} />
            <Detail icon={<CalendarDays />} label={isLost ? 'Date lost' : 'Date found'} value={formatDate(item.eventDate)} />
          </dl>

          {item.description && (
            <div>
              <h2 className="font-sans text-sm font-semibold tracking-normal">Description</h2>
              <p className="mt-1.5 whitespace-pre-line text-muted-foreground">{item.description}</p>
            </div>
          )}

          {item.status === 'open' && !isAdmin && (isLost ? (
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><PackageCheck className="size-5" aria-hidden /> Found this item?</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                The owner’s contact details are private. Report it as found and drop it at the Lost & Found office. Staff check the owner’s
                private details and student ID before handing it back.
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link to="/report" search={{ kind: 'found' }}>Report it found</Link>
              </Button>
            </div>
          ) : (
            <ClaimForm itemId={item.id} />
          ))}

          <p className="flex gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="size-4 shrink-0" aria-hidden />
            Items are only handed over at the Lost & Found office after an ID check. Never send money to anyone to get an item back.
          </p>

          {admin && (
            <section aria-labelledby="office-heading" className="grid gap-3 rounded-2xl border border-primary/30 bg-secondary/50 p-5 text-sm">
              <h2 id="office-heading" className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal"><Lock className="size-4 text-primary" aria-hidden /> Office only</h2>
              <div className="grid gap-1.5">
                <p className="flex items-center gap-2"><User className="size-4" aria-hidden /> {admin.item.contactName} <span className="text-muted-foreground">({isLost ? 'owner' : 'finder'})</span></p>
                {admin.item.contactPhone && (
                  <a href={`tel:${admin.item.contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-2 underline-offset-4 hover:underline"><Phone className="size-4" aria-hidden /> {admin.item.contactPhone}</a>
                )}
                {admin.item.contactEmail && (
                  <a href={`mailto:${admin.item.contactEmail}?subject=${encodeURIComponent(`Lost & Found #${item.id}: ${item.title}`)}`} className="flex items-center gap-2 break-all underline-offset-4 hover:underline"><Mail className="size-4 shrink-0" aria-hidden /> {admin.item.contactEmail}</a>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Private identifying details</p>
                <p className="mt-1 whitespace-pre-line">{admin.item.secretDetails || <span className="text-muted-foreground">None added.</span>}</p>
              </div>
            </section>
          )}

          {isAdmin && item.status === 'open' && (
            <ResolveDialog
              item={item}
              onDone={refresh}
              trigger={<Button variant="outline" className="w-full"><CheckCircle2 /> Resolve this report (admin)</Button>}
            />
          )}
        </div>
      </div>

      {admin && item.kind === 'found' && (
        <section className="mt-14" aria-labelledby="claims-heading">
          <h2 id="claims-heading" className="text-2xl font-semibold">Ownership claims</h2>
          <p className="mt-1 text-muted-foreground">Compare each claimant’s proof with the finder’s private details. Check their student ID before approving.</p>
          {admin.claims.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">No one has claimed this item yet.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {admin.claims.map((c) => <ClaimReview key={c.id} claim={c} item={admin.item} onDone={refresh} showSecret={false} />)}
            </div>
          )}
        </section>
      )}

      {item.status === 'open' && (
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-accent-foreground" aria-hidden />
            <h2 className="text-2xl font-semibold">
              {isLost ? 'Possibly found by someone' : 'Possibly lost by someone'}
            </h2>
          </div>
          <p className="mt-1 text-muted-foreground">
            Open {isLost ? 'found' : 'lost'} reports in <span className="font-medium text-foreground">{item.category}</span>. Check if any of these match.
          </p>
          {matches.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
              No {isLost ? 'found' : 'lost'} reports in this category yet. Check back soon — new reports appear here automatically.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => <ItemCard key={m.id} item={m} compact />)}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4" aria-hidden>{icon}</span>
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
