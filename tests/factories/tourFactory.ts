import { faker } from '@faker-js/faker'
import { factory, primaryKey, manyOf, oneOf } from '@mswjs/data'

// Define tour data model
export const db = factory({
  tour: {
    id: primaryKey(() => faker.string.uuid()),
    slug: () => faker.helpers.slugify(faker.location.city()),
    title: () => faker.lorem.sentence({ min: 3, max: 6 }),
    description: () => faker.lorem.paragraph(),
    shortDescription: () => faker.lorem.sentence(),
    duration: () => faker.helpers.arrayElement(['1 day', '2 days', '3 days', '1 week']),
    price: () => faker.number.int({ min: 50, max: 2000 }),
    originalPrice: () => faker.number.int({ min: 100, max: 2500 }),
    currency: () => 'EUR',
    location: () => faker.location.city(),
    country: () => faker.helpers.arrayElement(['AL', 'MK', 'ME', 'XK']),
    category: () => faker.helpers.arrayElement(['adventure', 'cultural', 'beach', 'nature', 'city-tour']),
    difficulty: () => faker.helpers.arrayElement(['easy', 'moderate', 'challenging']),
    groupSize: () => faker.number.int({ min: 2, max: 20 }),
    languages: () => faker.helpers.arrayElements(['English', 'Albanian', 'German', 'Italian'], { min: 1, max: 3 }),
    included: () => faker.helpers.arrayElements([
      'Transportation',
      'Guide',
      'Lunch',
      'Equipment',
      'Insurance',
      'Entrance fees'
    ], { min: 2, max: 5 }),
    excluded: () => faker.helpers.arrayElements([
      'Personal expenses',
      'Tips',
      'Alcoholic beverages',
      'Souvenirs'
    ], { min: 1, max: 3 }),
    images: () => Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => ({
      url: faker.image.url(),
      alt: faker.lorem.sentence({ min: 3, max: 5 }),
    })),
    highlights: () => Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, () => 
      faker.lorem.sentence()
    ),
    itinerary: () => Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, (_, i) => ({
      day: i + 1,
      title: faker.lorem.sentence({ min: 2, max: 4 }),
      description: faker.lorem.paragraph(),
      activities: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () => 
        faker.lorem.sentence()
      ),
    })),
    rating: () => faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    reviewCount: () => faker.number.int({ min: 5, max: 500 }),
    availableFrom: () => faker.date.future().toISOString(),
    availableTo: () => faker.date.future({ years: 2 }).toISOString(),
    instantConfirmation: () => faker.datatype.boolean(),
    freeCancellation: () => faker.datatype.boolean(),
    affiliateUrl: () => faker.internet.url(),
    operator: () => ({
      id: faker.string.uuid(),
      name: faker.company.name(),
      logo: faker.image.url(),
      rating: faker.number.float({ min: 4, max: 5, fractionDigits: 1 }),
    }),
    seo: () => ({
      metaTitle: faker.lorem.sentence(),
      metaDescription: faker.lorem.paragraph(),
      keywords: faker.helpers.arrayElements([
        'albania tours',
        'adventure',
        'travel',
        'vacation',
        'balkans'
      ], { min: 3, max: 5 }),
    }),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },
  operator: {
    id: primaryKey(() => faker.string.uuid()),
    name: () => faker.company.name(),
    description: () => faker.lorem.paragraph(),
    logo: () => faker.image.url(),
    website: () => faker.internet.url(),
    email: () => faker.internet.email(),
    phone: () => faker.phone.number(),
    rating: () => faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    reviewCount: () => faker.number.int({ min: 10, max: 1000 }),
    tours: manyOf('tour'),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },
  inquiry: {
    id: primaryKey(() => faker.string.uuid()),
    tourId: () => faker.string.uuid(),
    tour: oneOf('tour'),
    name: () => faker.person.fullName(),
    email: () => faker.internet.email(),
    phone: () => faker.phone.number(),
    message: () => faker.lorem.paragraph(),
    travelDate: () => faker.date.future().toISOString(),
    groupSize: () => faker.number.int({ min: 1, max: 10 }),
    status: () => faker.helpers.arrayElement(['pending', 'contacted', 'booked', 'cancelled']),
    createdAt: () => faker.date.recent().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },
  booking: {
    id: primaryKey(() => faker.string.uuid()),
    tourId: () => faker.string.uuid(),
    tour: oneOf('tour'),
    userId: () => faker.string.uuid(),
    bookingDate: () => faker.date.recent().toISOString(),
    travelDate: () => faker.date.future().toISOString(),
    status: () => faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
    totalPrice: () => faker.number.int({ min: 100, max: 5000 }),
    currency: () => 'EUR',
    paymentStatus: () => faker.helpers.arrayElement(['pending', 'paid', 'refunded']),
    affiliateClickId: () => faker.string.uuid(),
    source: () => faker.helpers.arrayElement(['direct', 'google', 'facebook', 'instagram', 'email']),
    createdAt: () => faker.date.recent().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },
})

// Export convenience factory for tours
export const tourFactory = {
  build: (overrides?: Partial<ReturnType<typeof db.tour.create>>) => {
    const tour = db.tour.create()
    return { ...tour, ...overrides }
  },
  buildList: (count: number, overrides?: Partial<ReturnType<typeof db.tour.create>>) => {
    return Array.from({ length: count }, () => tourFactory.build(overrides))
  },
}

// Export convenience factory for operators
export const operatorFactory = {
  build: (overrides?: Partial<ReturnType<typeof db.operator.create>>) => {
    const operator = db.operator.create()
    return { ...operator, ...overrides }
  },
  buildList: (count: number, overrides?: Partial<ReturnType<typeof db.operator.create>>) => {
    return Array.from({ length: count }, () => operatorFactory.build(overrides))
  },
}

// Export convenience factory for inquiries
export const inquiryFactory = {
  build: (overrides?: Partial<ReturnType<typeof db.inquiry.create>>) => {
    const inquiry = db.inquiry.create()
    return { ...inquiry, ...overrides }
  },
  buildList: (count: number, overrides?: Partial<ReturnType<typeof db.inquiry.create>>) => {
    return Array.from({ length: count }, () => inquiryFactory.build(overrides))
  },
}

// Export convenience factory for bookings
export const bookingFactory = {
  build: (overrides?: Partial<ReturnType<typeof db.booking.create>>) => {
    const booking = db.booking.create()
    return { ...booking, ...overrides }
  },
  buildList: (count: number, overrides?: Partial<ReturnType<typeof db.booking.create>>) => {
    return Array.from({ length: count }, () => bookingFactory.build(overrides))
  },
}