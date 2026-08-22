import { next } from '@vercel/functions'

import {
  HOME_MARKDOWN,
  NEGOTIATED_RESPONSE_HEADERS,
  negotiateRepresentation,
} from './src/lib/agent-content.mjs'

export const config = {
  matcher: '/',
}

export default function middleware(request: Request) {
  if (!['GET', 'HEAD'].includes(request.method)) return next()

  const representation = negotiateRepresentation(request.headers.get('accept'))

  if (representation === 'html') {
    return next({ headers: NEGOTIATED_RESPONSE_HEADERS })
  }

  if (representation === 'markdown') {
    return new Response(request.method === 'HEAD' ? null : HOME_MARKDOWN, {
      headers: {
        ...NEGOTIATED_RESPONSE_HEADERS,
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  }

  return new Response(
    request.method === 'HEAD'
      ? null
      : 'Not Acceptable. This resource provides text/html or text/markdown.\n',
    {
      status: 406,
      headers: {
        ...NEGOTIATED_RESPONSE_HEADERS,
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  )
}
