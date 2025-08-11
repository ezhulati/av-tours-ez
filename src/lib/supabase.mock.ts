// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  const mockClient = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: () => mockClient.from(table).select(columns),
        neq: () => mockClient.from(table).select(columns),
        gt: () => mockClient.from(table).select(columns),
        gte: () => mockClient.from(table).select(columns),
        lt: () => mockClient.from(table).select(columns),
        lte: () => mockClient.from(table).select(columns),
        like: () => mockClient.from(table).select(columns),
        ilike: () => mockClient.from(table).select(columns),
        contains: () => mockClient.from(table).select(columns),
        in: () => mockClient.from(table).select(columns),
        order: () => mockClient.from(table).select(columns),
        limit: () => mockClient.from(table).select(columns),
        range: () => mockClient.from(table).select(columns),
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
      }),
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
      }),
      upsert: (data: any) => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
  
  return mockClient
}