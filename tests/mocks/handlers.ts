import { http, HttpResponse } from 'msw'
import { tourFactory } from '../factories/tourFactory'

export const handlers = [
  // Mock tour API endpoints
  http.get('/api/tours', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '12')
    
    const tours = Array.from({ length: 10 }, () => tourFactory.build())
    return HttpResponse.json({ 
      items: tours,
      pagination: {
        page,
        limit,
        total: tours.length,
        totalPages: Math.ceil(tours.length / limit)
      }
    })
  }),

  http.get('/api/tours/:slug', ({ params }) => {
    const tour = tourFactory.build({ slug: params.slug as string })
    return HttpResponse.json(tour)
  }),

  // Mock search endpoint
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const tours = Array.from({ length: 5 }, () => 
      tourFactory.build({ title: `${query} Tour` })
    )
    return HttpResponse.json({ tours, total: tours.length })
  }),

  // Mock inquiry submission
  http.post('/api/inquiries', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ 
      success: true, 
      id: Math.random().toString(36).substr(2, 9),
      message: 'Inquiry submitted successfully' 
    })
  }),

  // Mock affiliate tracking
  http.post('/api/track-click', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ 
      success: true,
      trackingId: Math.random().toString(36).substr(2, 9)
    })
  }),

  // Mock redirect endpoint
  http.get('/out/:slug', ({ params }) => {
    return HttpResponse.redirect(`https://partner.com/tours/${params.slug}`, 302)
  }),
]