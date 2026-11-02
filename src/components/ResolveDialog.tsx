import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { resolveItem } from '@/lib/items.functions'
import type { PublicItem } from '@/lib/catalog'

export function ResolveDialog({ item, onDone, trigger }: { item: PublicItem; onDone: () => void | Promise<void>; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = String(new FormData(event.currentTarget).get('note') ?? '')
    setPending(true)
    try {
      await resolveItem({ data: { id: item.id, note } })
      toast.success(`“${item.title}” marked as resolved`)
      setOpen(false)
      await onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resolve this report.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve this report?</DialogTitle>
          <DialogDescription>
            “{item.title}” will be marked as resolved and hidden from the open board. You can reopen it later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`note-${item.id}`}>Resolution note (optional)</Label>
            <Textarea
              id={`note-${item.id}`}
              name="note"
              maxLength={500}
              placeholder="e.g. Returned to owner at the Students Centre after ID check."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Resolving…' : 'Mark as resolved'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
