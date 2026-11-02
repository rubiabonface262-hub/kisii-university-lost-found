import { date, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const items = pgTable(
  'items',
  {
    id: serial().primaryKey(),
    // 'lost' = someone is looking for it, 'found' = someone is holding it
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    category: text('category').notNull(),
    location: text('location').notNull(),
    eventDate: date('event_date').notNull(),
    contactName: text('contact_name').notNull(),
    contactPhone: text('contact_phone').notNull().default(''),
    contactEmail: text('contact_email').notNull().default(''),
    imageKey: text('image_key'),
    // Private details only the real owner would know (found reports). Never shown publicly.
    secretDetails: text('secret_details').notNull().default(''),
    // 'open' until an admin marks it 'resolved'
    status: text('status').notNull().default('open'),
    resolvedNote: text('resolved_note'),
    resolvedBy: text('resolved_by'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('items_status_kind_idx').on(t.status, t.kind), index('items_created_idx').on(t.createdAt)],
)

export type Item = typeof items.$inferSelect

// Ownership claims on found items. Admins compare `proof` with the finder's secret details.
export const claims = pgTable(
  'claims',
  {
    id: serial().primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    claimantName: text('claimant_name').notNull(),
    regNumber: text('reg_number').notNull(),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    proof: text('proof').notNull(),
    // 'pending' until an admin approves or rejects it
    status: text('status').notNull().default('pending'),
    adminNote: text('admin_note'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('claims_status_idx').on(t.status), uniqueIndex('claims_item_reg_idx').on(t.itemId, t.regNumber)],
)

export type Claim = typeof claims.$inferSelect
