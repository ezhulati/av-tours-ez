import { faker } from '@faker-js/faker'
import type { TourCardDTO, TourDetailDTO, Difficulty, Currency } from '@lib/dto'

export const createMockTourCard = (overrides?: Partial<TourCardDTO>): TourCardDTO => ({
  id: faker.string.uuid(),
  slug: faker.helpers.slugify(faker.location.city() + ' ' + faker.word.noun()),
  title: faker.location.city() + ' ' + faker.word.adjective() + ' Tour',
  shortDescription: faker.lorem.sentence(),
  priceMin: faker.number.float({ min: 10, max: 200, fractionDigits: 2 }),
  priceMax: faker.number.float({ min: 200, max: 500, fractionDigits: 2 }),
  currency: 'USD' as Currency,
  durationDays: faker.number.int({ min: 1, max: 7 }),
  durationDisplay: faker.helpers.arrayElement(['2 hours', '4 hours', '1 day', '2 days']),
  difficulty: faker.helpers.arrayElement(['easy', 'moderate', 'challenging', 'difficult'] as Difficulty[]),
  primaryImageUrl: faker.image.urlLoremFlickr({ category: 'nature' }),
  countries: [faker.helpers.arrayElement(['Albania', 'Kosovo', 'Montenegro', 'North Macedonia'])],
  categorySlugs: [faker.helpers.arrayElement(['adventure', 'cultural', 'beach', 'city-tours'])],
  featured: faker.datatype.boolean(),
  ...overrides,
})

export const createMockTourDetail = (overrides?: Partial<TourDetailDTO>): TourDetailDTO => {
  const base = createMockTourCard()
  return {
    ...base,
    fullDescription: faker.lorem.paragraphs(3),
    inclusions: Array(5).fill(null).map(() => faker.lorem.sentence()),
    exclusions: Array(3).fill(null).map(() => faker.lorem.sentence()),
    departureNotes: faker.lorem.paragraph(),
    images: Array(4).fill(null).map((_, i) => ({
      url: faker.image.urlLoremFlickr({ category: 'travel' }),
      alt: faker.lorem.sentence(),
      width: 1200,
      height: 800
    })),
    operator: {
      id: faker.string.uuid(),
      name: faker.company.name(),
      slug: faker.helpers.slugify(faker.company.name()),
      logoUrl: faker.image.urlLoremFlickr({ category: 'business' })
    },
    affiliateUrl: 'https://bnadventure.com/tour/' + base.slug,
    ...overrides,
  }
}

export const createMockTourList = (count: number = 10): TourCardDTO[] => {
  return Array(count).fill(null).map(() => createMockTourCard())
}

export const createMockFilteredTours = (
  category?: string,
  priceRange?: { min: number; max: number }
): TourCardDTO[] => {
  const tours = createMockTourList(20)
  
  return tours.filter(tour => {
    if (category && !tour.categorySlugs.includes(category)) return false
    if (priceRange) {
      const tourPrice = tour.priceMin || 0
      if (tourPrice < priceRange.min || tourPrice > priceRange.max) return false
    }
    return true
  })
}