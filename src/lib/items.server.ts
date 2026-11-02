import type { Claim, Item } from '../../db/schema'
import type { AdminClaim, AdminItem, ClaimStatus, Kind, PublicItem, Status } from './catalog'

// Public view: no reporter contacts or secret details. Found-item photos stay private so
// someone can't copy what they see into a false claim.
export function toPublicItem(row: Item): PublicItem {
  const photoHidden = row.kind === 'found' && Boolean(row.imageKey)
  return {
    id: row.id,
    kind: row.kind as Kind,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    eventDate: row.eventDate,
    imageUrl: row.imageKey && !photoHidden ? `/api/images/${row.imageKey}` : null,
    photoHidden,
    status: row.status as Status,
    resolvedNote: row.resolvedNote,
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

export function toAdminItem(row: Item, pendingClaims = 0): AdminItem {
  return {
    ...toPublicItem(row),
    imageUrl: row.imageKey ? `/api/images/${row.imageKey}` : null,
    photoHidden: false,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    secretDetails: row.secretDetails,
    pendingClaims,
  }
}

export function toAdminClaim(row: Claim): AdminClaim {
  return {
    id: row.id,
    itemId: row.itemId,
    claimantName: row.claimantName,
    regNumber: row.regNumber,
    phone: row.phone,
    email: row.email,
    proof: row.proof,
    status: row.status as ClaimStatus,
    adminNote: row.adminNote,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}
