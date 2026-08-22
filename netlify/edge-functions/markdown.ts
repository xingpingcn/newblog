import {
  HOME_MARKDOWN,
  NEGOTIATED_RESPONSE_HEADERS,
  negotiateRepresentation,
} from '../../src/lib/agent-content.mjs'

type NetlifyContext = {
  next(): Promise<Response>
}

export default async (request: Request, context: NetlifyContext) => {
  if (!['GET', 'HEAD'].includes(request.method)) return context.next()

  const representation = negotiateRepresentation(request.headers.get('accept'))

  if (representation === 'html') return context.next()

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

export const config = {
  path: '/',
}
