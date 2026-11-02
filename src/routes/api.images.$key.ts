import { createFileRoute } from '@tanstack/react-router'
import { getStore } from '@netlify/blobs'

export const Route = createFileRoute('/api/images/$key')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[0-9a-f-]{36}$/.test(params.key)) return new Response('Not found', { status: 404 })
        const result = await getStore('item-photos').getWithMetadata(params.key, { type: 'arrayBuffer' })
        if (!result) return new Response('Not found', { status: 404 })
        const contentType = typeof result.metadata.contentType === 'string' ? result.metadata.contentType : 'image/jpeg'
        return new Response(result.data, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
        })
      },
    },
  },
})
