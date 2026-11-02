import { useState } from 'react'
import { CheckCircle2, IdCard, Lock, Mail, Phone, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/components/ItemCard'
import { reviewClaim } from '@/lib/items.functions'
import type { AdminClaim, AdminItem } from '@/lib/catalog'
import { cn } from '@/lib/utils'

const STATUS_STYLE = {
  pending: 'bg-accent text-accent-foreground',
  approved: 'bg-found-soft text-found',
  rejected: 'bg-muted text-muted-foreground',
} as const

// Shows a claimant's proof next to the finder's private details so staff can compare them.
export function ClaimReview({ claim, item, onDone, showSecret = true }: { claim: AdminClaim; item: AdminItem; onDone: () => void | Promise<void>; showSecret?: boolean }) {
  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{claim.claimantName}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><IdCard className="size-4" aria-hidden /> {claim.regNumber}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', STATUS_STYLE[claim.status])}>{claim.status}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {claim.phone && <a href={`tel:${claim.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:underline"><Phone className="size-3.5" aria-hidden /> {claim.phone}</a>}
        {claim.email && <a href={`mailto:${claim.email}`} className="flex items-center gap-1.5 break-all hover:underline"><Mail className="size-3.5" aria-hidden /> {claim.email}</a>}
        <span className="text-muted-foreground">Sent {formatDate(claim.createdAt)}</span>
      </div>

      <div className={cn('mt-4 grid gap-3', showSecret && 'md:grid-cols-2')}>
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Claimant’s proof</p>
          <p className="mt-1 text-sm whitespace-pre-line">{claim.proof}</p>
        </div>
        {showSecret && (
          <div className="rounded-xl border border-primary/25 bg-secondary/60 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold tracking-wide text-primary uppercase"><Lock className="size-3" aria-hidden /> Finder’s private details</p>
            <p className="mt-1 text-sm whitespace-pre-line">{item.secretDetails || <span className="text-muted-foreground">The finder didn’t add any. Check the item itself.</span>}</p>
          </div>
        )}
      </div>

      {claim.status !== 'pending' && (claim.adminNote || claim.reviewedBy) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {claim.adminNote && <>{claim.adminNote} · </>}Reviewed by {claim.reviewedBy}{claim.reviewedAt && ` on ${formatDate(claim.reviewedAt)}`}
        </p>
      )}

      {claim.status === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <DecisionDialog claim={claim} item={item} decision="approve" onDone={onDone} />
          <DecisionDialog claim={claim} item={item} decision="reject" onDone={onDone} />
        </div>
      )}
    </article>
  )
}

function DecisionDialog({ claim, item, decision, onDone }: { claim: AdminClaim; item: AdminItem; decision: 'approve' | 'reject'; onDone: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const approve = decision === 'approve'

  async function confirm(note: string) {
    setPending(true)
    try {
      await reviewClaim({ data: { id: claim.id, decision, note } })
      toast.success(approve ? `Claim approved. “${item.title}” is now resolved.` : 'Claim rejected')
      setOpen(false)
      await onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update this claim.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {approve ? (
          <Button size="sm"><CheckCircle2 /> Approve & hand over</Button>
        ) : (
          <Button size="sm" variant="outline"><XCircle /> Reject</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approve ? 'Approve this claim?' : 'Reject this claim?'}</DialogTitle>
          <DialogDescription>
            {approve
              ? `Only approve after checking ${claim.claimantName}’s student ID (${claim.regNumber}) in person. “${item.title}” is marked resolved and any other claims are rejected.`
              : `${claim.claimantName}’s claim is closed. The item stays open for its real owner.`}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void confirm(String(new FormData(e.currentTarget).get('note') ?? ''))
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={`claim-note-${claim.id}`}>Internal note (optional)</Label>
            <Textarea
              id={`claim-note-${claim.id}`}
              name="note"
              maxLength={500}
              placeholder={approve ? 'e.g. ID checked, IMEI matched. Collected at the office.' : 'e.g. Description didn’t match the serial number.'}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant={approve ? 'default' : 'destructive'} disabled={pending}>
              {pending ? 'Saving…' : approve ? 'Approve claim' : 'Reject claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
