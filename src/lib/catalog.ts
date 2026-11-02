// Shared, client-safe constants for item reports.

export const KINDS = ['lost', 'found'] as const
export type Kind = (typeof KINDS)[number]

export const STATUSES = ['open', 'resolved'] as const
export type Status = (typeof STATUSES)[number]
export const STATUS_FILTERS = ['open', 'resolved', 'all'] as const

export const CATEGORIES = [
  'Phones & Electronics',
  'ID & Cards',
  'Keys',
  'Bags & Backpacks',
  'Books & Stationery',
  'Clothing',
  'Wallets & Money',
  'Jewellery & Watches',
  'Bottles & Lunch boxes',
  'Other',
] as const

export const LOCATIONS = [
  'Main Campus – Library',
  'Main Campus – Lecture Halls',
  'Main Campus – Science Complex',
  'Main Campus – Students Centre',
  'Main Campus – Cafeteria / Mess',
  'Main Campus – Sports Grounds',
  'Main Campus – Hostels',
  'Main Campus – Administration Block',
  'Main Campus – Main Gate',
  'Kisii Town Campus',
  'Other campus / off-campus',
] as const

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export type PublicItem = {
  id: number
  kind: Kind
  title: string
  description: string
  category: string
  location: string
  eventDate: string
  imageUrl: string | null
  // True when a found item has a photo that only the office can see.
  photoHidden: boolean
  status: Status
  resolvedNote: string | null
  resolvedAt: string | null
  createdAt: string
}

// What Lost & Found office admins see: reporter contacts, secret details and private photos.
export type AdminItem = PublicItem & {
  contactName: string
  contactPhone: string
  contactEmail: string
  secretDetails: string
  pendingClaims: number
}

export const CLAIM_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export type AdminClaim = {
  id: number
  itemId: number
  claimantName: string
  regNumber: string
  phone: string
  email: string
  proof: string
  status: ClaimStatus
  adminNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

export function imageSrc(imageUrl: string, width: number) {
  return `/.netlify/images?url=${encodeURIComponent(imageUrl)}&w=${width}&fm=webp`
}
