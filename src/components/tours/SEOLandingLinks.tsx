import React from 'react'

interface SEOLink {
  href: string
  title: string
  description: string
  icon?: string
  count?: number
}

const popularSearches: SEOLink[] = [
  {
    href: '/tours/filter/albania',
    title: 'Albania Tours',
    description: 'Albanian Alps, Riviera & more',
    icon: '🇦🇱',
    count: 45
  },
  {
    href: '/tours/filter/kosovo',
    title: 'Kosovo Tours',
    description: 'Rugova Valley & Sharr Mountains',
    icon: '🇽🇰',
    count: 28
  },
  {
    href: '/tours/filter/montenegro',
    title: 'Montenegro Tours',
    description: 'Durmitor & Bay of Kotor',
    icon: '🇲🇪',
    count: 32
  },
  {
    href: '/tours/filter/albania-hiking',
    title: 'Albania Hiking',
    description: 'Valbona to Theth & more trails',
    icon: '🥾',
    count: 38
  },
  {
    href: '/tours/filter/easy',
    title: 'Easy Tours',
    description: 'Family-friendly adventures',
    icon: '😊',
    count: 22
  },
  {
    href: '/tours/filter/weekend',
    title: 'Weekend Trips',
    description: '2-3 day short breaks',
    icon: '📅',
    count: 18
  },
  {
    href: '/tours/filter/budget',
    title: 'Budget Tours',
    description: 'Under €500 adventures',
    icon: '💰',
    count: 26
  },
  {
    href: '/tours/filter/balkans',
    title: 'Multi-Country',
    description: 'Cross-border adventures',
    icon: '🗺️',
    count: 15
  }
]

export default function SEOLandingLinks() {
  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Popular Tour Searches</h2>
        <p className="text-sm text-gray-600">Quick links to our most popular tour categories</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularSearches.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group bg-white rounded-lg p-4 border border-gray-200 hover:border-accent hover:shadow-md transition-all duration-200 block"
          >
            <div className="flex items-center gap-3">
              {link.icon && (
                <span className="text-2xl flex-shrink-0" role="img" aria-label={link.title}>
                  {link.icon}
                </span>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-sm text-gray-900 group-hover:text-accent transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm sm:text-xs text-gray-500 mt-0.5">
                  {link.description}
                </p>
                {link.count && (
                  <span className="inline-block mt-1 text-xs text-accent font-semibold">
                    {link.count} tours
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Trending searches:</span>
          <a href="/tours/filter/challenging" className="text-sm text-accent hover:underline">challenging hikes</a>
          <span className="text-gray-400">•</span>
          <a href="/tours/filter/cultural" className="text-sm text-accent hover:underline">cultural tours</a>
          <span className="text-gray-400">•</span>
          <a href="/tours/filter/hiking" className="text-sm text-accent hover:underline">all hiking tours</a>
          <span className="text-gray-400">•</span>
          <a href="/tours/filter/week-long" className="text-sm text-accent hover:underline">week-long tours</a>
        </div>
      </div>
    </div>
  )
}