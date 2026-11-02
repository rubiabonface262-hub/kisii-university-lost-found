import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'
import { and, count, desc, eq, ilike, inArray, ne, or, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { claims, items } from '../../db/schema'
import { CATEGORIES, CLAIM_STATUSES, KINDS, STATUS_FILTERS } from './catalog'
import { toAdminClaim, toAdminItem, toPublicItem } from './items.server'

const searchInput = z.object({
  q: z.string().trim().max(100).optional(),
  kind: z.enum(KINDS).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUS_FILTERS).optional(),
  limit: z.number().int().min(1).max(200).optional(),
})

export type SearchInput = z.infer<typeof searchInput>

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export const searchItems = createServerFn({ method: 'GET' })
  .validator(searchInput)
  .handler(async ({ data }) => {
    const where: SQL[] = []
    const status = data.status ?? 'open'
    if (status !== 'all') where.push(eq(items.status, status))
    if (data.kind) where.push(eq(items.kind, data.kind))
    if (data.category) where.push(eq(items.category, data.category))
    if (data.q) {
      const pattern = `%${escapeLike(data.q)}%`
      where.push(
        or(
          ilike(items.title, pattern),
          ilike(items.description, pattern),
          ilike(items.location, pattern),
          ilike(items.category, pattern),
        )!,
      )
    }
    const rows = await db
      .select()
      .from(items)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(items.createdAt))
      .limit(data.limit ?? 60)
    return rows.map(toPublicItem)
  })

export const getItemWithMatches = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const [row] = await db.select().from(items).where(eq(items.id, data.id)).limit(1)
    if (!row) return null
    const user = await getUser()
    const isAdmin = Boolean(user?.roles?.includes('admin'))
    // Possible matches: open reports of the opposite kind in the same category.
    const matches = await db
      .select()
      .from(items)
      .where(
        and(
          ne(items.kind, row.kind),
          eq(items.category, row.category),
          eq(items.status, 'open'),
          ne(items.id, row.id),
        ),
      )
      .orderBy(desc(items.createdAt))
      .limit(6)
    // Admins also get reporter contacts, secret details, the private photo and claims.
    let admin = null
    if (isAdmin) {
      const itemClaims = await db.select().from(claims).where(eq(claims.itemId, row.id)).orderBy(desc(claims.createdAt))
      admin = {
        item: toAdminItem(row, itemClaims.filter((c) => c.status === 'pending').length),
        claims: itemClaims.map(toAdminClaim),
        matches: matches.map((m) => toAdminItem(m)),
      }
    }
    return { item: toPublicItem(row), matches: matches.map(toPublicItem), admin }
  })

export const getStats = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db
    .select({ kind: items.kind, status: items.status, total: count() })
    .from(items)
    .groupBy(items.kind, items.status)
  const pick = (kind: string, status: string) =>
    rows.find((r) => r.kind === kind && r.status === status)?.total ?? 0
  return {
    openLost: pick('lost', 'open'),
    openFound: pick('found', 'open'),
    resolved: pick('lost', 'resolved') + pick('found', 'resolved'),
  }
})

// ---------- Ownership claims (public) ----------

const claimInput = z
  .object({
    itemId: z.number().int().positive(),
    claimantName: z.string().trim().min(2, 'Add your full name.').max(80),
    regNumber: z
      .string()
      .trim()
      .transform((v) => v.replace(/\s+/g, '').toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9/-]{4,30}$/, 'Enter your registration or staff number, e.g. EB1/12345/21.')),
    phone: z.string().trim().max(30).default(''),
    email: z.union([z.literal(''), z.email('Enter a valid email address.').max(120)]).default(''),
    proof: z
      .string()
      .trim()
      .min(20, 'Describe the item in more detail (at least 20 characters) so the office can verify it’s yours.')
      .max(1500),
    // Honeypot: real people never fill this hidden field.
    website: z.string().max(0).optional(),
  })
  .refine((v) => v.phone || v.email, { message: 'Add a phone number or email so the office can reach you.' })

export const submitClaim = createServerFn({ method: 'POST' })
  .validator(claimInput)
  .handler(async ({ data }) => {
    const [item] = await db.select().from(items).where(eq(items.id, data.itemId)).limit(1)
    if (!item || item.kind !== 'found') throw new Error('Only found items can be claimed.')
    if (item.status !== 'open') throw new Error('This item has already been returned to its owner.')
    const [existing] = await db
      .select({ id: claims.id })
      .from(claims)
      .where(and(eq(claims.itemId, item.id), eq(claims.regNumber, data.regNumber)))
      .limit(1)
    if (existing) throw new Error('A claim with this registration number has already been sent for this item.')
    await db.insert(claims).values({
      itemId: item.id,
      claimantName: data.claimantName,
      regNumber: data.regNumber,
      phone: data.phone,
      email: data.email,
      proof: data.proof,
    })
    return { ok: true }
  })

// ---------- Admin ----------

export const getViewer = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getUser()
  if (!user) return null
  return {
    email: user.email ?? '',
    name: user.name ?? '',
    isAdmin: Boolean(user.roles?.includes('admin')),
  }
})

const requireAdmin = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const user = await getUser()
  if (!user) throw new Error('Please sign in as an administrator.')
  if (!user.roles?.includes('admin')) throw new Error('Only administrators can do this.')
  return next({ context: { admin: { id: user.id, email: user.email ?? '' } } })
})

export const listAllForAdmin = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .validator(searchInput)
  .handler(async ({ data }) => {
    const where: SQL[] = []
    if (data.status && data.status !== 'all') where.push(eq(items.status, data.status))
    if (data.kind) where.push(eq(items.kind, data.kind))
    if (data.q) {
      const pattern = `%${escapeLike(data.q)}%`
      where.push(or(ilike(items.title, pattern), ilike(items.contactName, pattern), ilike(items.location, pattern))!)
    }
    const rows = await db
      .select()
      .from(items)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(items.createdAt))
      .limit(200)
    const ids = rows.map((r) => r.id)
    const pending = ids.length
      ? await db
          .select({ itemId: claims.itemId, total: count() })
          .from(claims)
          .where(and(inArray(claims.itemId, ids), eq(claims.status, 'pending')))
          .groupBy(claims.itemId)
      : []
    return rows.map((r) => toAdminItem(r, pending.find((p) => p.itemId === r.id)?.total ?? 0))
  })

export const resolveItem = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.number().int().positive(), note: z.string().trim().max(500).optional() }))
  .handler(async ({ data, context }) => {
    const [row] = await db
      .update(items)
      .set({
        status: 'resolved',
        resolvedNote: data.note || null,
        resolvedBy: context.admin.email,
        resolvedAt: new Date(),
      })
      .where(eq(items.id, data.id))
      .returning()
    if (!row) throw new Error('Report not found.')
    return toAdminItem(row)
  })

export const reopenItem = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(items)
      .set({ status: 'open', resolvedNote: null, resolvedBy: null, resolvedAt: null })
      .where(eq(items.id, data.id))
      .returning()
    if (!row) throw new Error('Report not found.')
    return toAdminItem(row)
  })

export const deleteItem = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await db.delete(items).where(eq(items.id, data.id))
    return { ok: true }
  })

export const listClaims = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .validator(z.object({ status: z.enum(CLAIM_STATUSES).optional() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({ claim: claims, item: items })
      .from(claims)
      .innerJoin(items, eq(claims.itemId, items.id))
      .where(eq(claims.status, data.status ?? 'pending'))
      .orderBy(desc(claims.createdAt))
      .limit(200)
    return rows.map((r) => ({ claim: toAdminClaim(r.claim), item: toAdminItem(r.item) }))
  })

export const reviewClaim = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(
    z.object({
      id: z.number().int().positive(),
      decision: z.enum(['approve', 'reject']),
      note: z.string().trim().max(500).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const [claim] = await db.select().from(claims).where(eq(claims.id, data.id)).limit(1)
    if (!claim) throw new Error('Claim not found.')
    if (claim.status !== 'pending') throw new Error('This claim has already been reviewed.')
    const reviewed = { reviewedBy: context.admin.email, reviewedAt: new Date() }

    if (data.decision === 'reject') {
      await db
        .update(claims)
        .set({ status: 'rejected', adminNote: data.note || null, ...reviewed })
        .where(and(eq(claims.id, claim.id), eq(claims.status, 'pending')))
      return { ok: true }
    }

    // Approving hands the item over: resolve it (only if still open) and close competing claims.
    const [item] = await db
      .update(items)
      .set({
        status: 'resolved',
        resolvedNote: 'Returned to its owner after the Lost & Found office verified their claim and student ID.',
        resolvedBy: context.admin.email,
        resolvedAt: reviewed.reviewedAt,
      })
      .where(and(eq(items.id, claim.itemId), eq(items.status, 'open')))
      .returning()
    if (!item) throw new Error('This item is no longer open. Reopen it first if you need to change the owner.')
    await db
      .update(claims)
      .set({ status: 'approved', adminNote: data.note || null, ...reviewed })
      .where(eq(claims.id, claim.id))
    await db
      .update(claims)
      .set({ status: 'rejected', adminNote: 'Another claim for this item was verified.', ...reviewed })
      .where(and(eq(claims.itemId, claim.itemId), eq(claims.status, 'pending')))
    return { ok: true }
  })
