import { createFileRoute } from '@tanstack/react-router'
import { getStore } from '@netlify/blobs'
import { z } from 'zod'
import { db } from '../../db'
import { items } from '../../db/schema'
import { CATEGORIES, IMAGE_TYPES, KINDS, LOCATIONS, MAX_IMAGE_BYTES } from '@/lib/catalog'
import { toPublicItem } from '@/lib/items.server'

const reportInput = z
  .object({
    kind: z.enum(KINDS, { error: 'Choose lost or found.' }),
    title: z.string({ error: 'Say what the item is.' }).trim().min(3, 'Say what the item is (at least 3 characters).').max(80),
    description: z.string().trim().max(1000).default(''),
    secretDetails: z.string().trim().max(1000).default(''),
    category: z.enum(CATEGORIES, { error: 'Choose a category.' }),
    location: z.enum(LOCATIONS, { error: 'Choose a location.' }),
    eventDate: z.iso.date({ error: 'Pick a valid date.' }),
    contactName: z.string({ error: 'Add your name.' }).trim().min(2, 'Add your name.').max(80),
    contactPhone: z.string().trim().max(30).default(''),
    contactEmail: z.union([z.literal(''), z.email('Enter a valid email address.').max(120)]).default(''),
  })
  .refine((v) => v.contactPhone || v.contactEmail, { message: 'Add a phone number or email so people can reach you.' })

export const Route = createFileRoute('/api/items')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return Response.json({ error: 'Invalid form submission.' }, { status: 400 })
        }
        const field = (name: string) => {
          const value = form.get(name)
          return typeof value === 'string' ? value : undefined
        }
        // Honeypot: bots fill every field, people never see this one.
        if (field('website')) return Response.json({ error: 'Check the form and try again.' }, { status: 400 })
        const parsed = reportInput.safeParse({
          kind: field('kind'),
          title: field('title'),
          description: field('description'),
          secretDetails: field('secretDetails'),
          category: field('category'),
          location: field('location'),
          eventDate: field('eventDate'),
          contactName: field('contactName'),
          contactPhone: field('contactPhone'),
          contactEmail: field('contactEmail'),
        })
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }, { status: 400 })
        }
        // Allow a day of slack so reporters ahead of UTC (Kenya is UTC+3) aren't rejected.
        const latest = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
        if (parsed.data.eventDate > latest) {
          return Response.json({ error: 'The date can’t be in the future.' }, { status: 400 })
        }

        let imageKey: string | null = null
        const photo = form.get('photo')
        if (photo instanceof File && photo.size > 0) {
          if (photo.size > MAX_IMAGE_BYTES) return Response.json({ error: 'Photo must be 5 MB or smaller.' }, { status: 400 })
          if (!(IMAGE_TYPES as readonly string[]).includes(photo.type)) {
            return Response.json({ error: 'Photo must be a JPG, PNG, WebP or GIF.' }, { status: 400 })
          }
          imageKey = crypto.randomUUID()
          await getStore('item-photos').set(imageKey, await photo.arrayBuffer(), {
            metadata: { contentType: photo.type },
          })
        }

        const [row] = await db
          .insert(items)
          .values({ ...parsed.data, imageKey })
          .returning()
        return Response.json(toPublicItem(row), { status: 201 })
      },
    },
  },
})
