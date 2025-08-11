import type { Meta, StoryObj } from '@storybook/react'
import FilterBarOptimized from '@/components/tours/FilterBarOptimized'
import type { TourFilters, PaginationParams } from '@/lib/dto'

const meta: Meta<typeof FilterBarOptimized> = {
  title: 'Tours/FilterBarOptimized',
  component: FilterBarOptimized,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## FilterBarOptimized Component

A high-performance, accessible filter bar for tour search with:

### Features
- **Debounced API calls** - 500ms delay prevents excessive requests
- **Keyboard navigation** - Full keyboard support with focus management
- **ARIA labels** - Comprehensive screen reader support
- **Mobile-first design** - Touch-friendly controls with collapsible panel
- **Loading states** - Visual feedback during filter operations
- **Error boundaries** - Graceful error handling and recovery
- **Performance optimized** - React.memo and memoized callbacks

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation with Escape to close on mobile
- Screen reader announcements for results
- Focus management when opening/closing panels
- Proper ARIA labels, roles, and descriptions

### Performance Metrics
- Debounced input: 500ms delay
- Memoized components prevent unnecessary re-renders
- Abort controller cancels stale requests
- Loading overlay provides immediate feedback

### Mobile Experience
- Collapsible filter panel on small screens
- Touch-friendly 48px minimum target size
- Active filter count badge
- Smooth animations and transitions
        `
      }
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'label', enabled: true }
        ]
      }
    }
  },
  argTypes: {
    onFiltersChange: {
      action: 'filters-changed',
      description: 'Callback when filters or pagination changes'
    },
    initialFilters: {
      control: 'object',
      description: 'Initial filter values'
    },
    initialPagination: {
      control: 'object',
      description: 'Initial pagination settings'
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Story />
        </div>
      </div>
    )
  ]
}

export default meta
type Story = StoryObj<typeof FilterBarOptimized>

// Mock successful API response
const mockSuccessResponse = () => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      items: Array(12).fill(null).map((_, i) => ({
        id: `tour-${i}`,
        title: `Tour ${i + 1}`,
        slug: `tour-${i + 1}`,
        description: 'A wonderful tour experience',
        price: 100 + i * 50,
        duration: 1 + i,
        difficulty: ['easy', 'moderate', 'challenging'][i % 3],
        country: ['Albania', 'Kosovo', 'Montenegro'][i % 3],
        groupSize: i % 2 === 0 ? 'small' : 'large'
      })),
      pagination: {
        page: 1,
        limit: 12,
        total: 42,
        totalPages: 4
      }
    })
  })
}

// Default story
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default filter bar with all filters available and no initial selections.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Mock fetch for this story
    global.fetch = vi.fn(() => mockSuccessResponse())
  }
}

// With initial filters
export const WithInitialFilters: Story = {
  args: {
    initialFilters: {
      country: 'Albania',
      difficulty: 'moderate',
      priceMin: 100,
      priceMax: 500
    },
    initialPagination: {
      page: 1,
      limit: 12,
      sort: 'price'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter bar with pre-selected filters showing Albania, moderate difficulty tours between €100-500.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    global.fetch = vi.fn(() => mockSuccessResponse())
  }
}

// Mobile view
export const MobileView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile responsive view with collapsible filter panel and touch-friendly controls.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    global.fetch = vi.fn(() => mockSuccessResponse())
  }
}

// Loading state
export const LoadingState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Filter bar showing loading overlay during API requests.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Mock slow fetch
    global.fetch = vi.fn(() => new Promise(resolve => {
      setTimeout(() => resolve(mockSuccessResponse()), 2000)
    }))
    
    // Trigger a filter change to show loading
    setTimeout(() => {
      const countrySelect = canvasElement.querySelector('[aria-label="Filter by country"]')
      if (countrySelect) {
        const event = new Event('change', { bubbles: true })
        Object.defineProperty(event, 'target', { value: { value: 'Albania' } })
        countrySelect.dispatchEvent(event)
      }
    }, 100)
  }
}

// Error state
export const ErrorState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Filter bar displaying error message when API request fails.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Mock failed fetch
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    
    // Trigger a filter change to show error
    setTimeout(() => {
      const countrySelect = canvasElement.querySelector('[aria-label="Filter by country"]')
      if (countrySelect) {
        const event = new Event('change', { bubbles: true })
        Object.defineProperty(event, 'target', { value: { value: 'Albania' } })
        countrySelect.dispatchEvent(event)
      }
    }, 100)
  }
}

// With many active filters
export const ManyActiveFilters: Story = {
  args: {
    initialFilters: {
      country: 'Albania',
      difficulty: 'moderate',
      priceMin: 100,
      priceMax: 500,
      durationMin: 3,
      durationMax: 7,
      groupSize: 'small'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter bar with multiple active filters showing filter count badge and clear button.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    global.fetch = vi.fn(() => mockSuccessResponse())
  }
}

// Tablet view
export const TabletView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet responsive view with optimized layout for medium screens.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    global.fetch = vi.fn(() => mockSuccessResponse())
  }
}

// With no results
export const NoResults: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Filter bar when search returns no results.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    // Mock empty response
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0
        }
      })
    }))
    
    // Trigger a filter
    setTimeout(() => {
      const difficultySelect = canvasElement.querySelector('[aria-label="Filter by difficulty level"]')
      if (difficultySelect) {
        const event = new Event('change', { bubbles: true })
        Object.defineProperty(event, 'target', { value: { value: 'difficult' } })
        difficultySelect.dispatchEvent(event)
      }
    }, 100)
  }
}

// Performance test - rapid filter changes
export const PerformanceTest: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates debouncing behavior with rapid filter changes. Only the final value triggers API call.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    let callCount = 0
    global.fetch = vi.fn(() => {
      callCount++
      console.log(`API call #${callCount}`)
      return mockSuccessResponse()
    })
    
    // Simulate rapid typing in price field
    setTimeout(() => {
      const priceInput = canvasElement.querySelector('[aria-label="Minimum price in euros"]')
      if (priceInput) {
        // Type rapidly
        ;[1, 10, 100, 1000].forEach((value, index) => {
          setTimeout(() => {
            const event = new Event('change', { bubbles: true })
            Object.defineProperty(event, 'target', { value: { value: value.toString() } })
            priceInput.dispatchEvent(event)
          }, index * 50) // 50ms between each keystroke
        })
      }
    }, 100)
  }
}

// Accessibility focused view
export const AccessibilityShowcase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
### Accessibility Features Demonstrated

- **Screen Reader Support**: All filters have proper ARIA labels and descriptions
- **Keyboard Navigation**: Tab through filters, Escape closes mobile panel
- **Focus Management**: Focus moves to first filter when panel opens
- **Live Regions**: Results announced to screen readers
- **Error Announcements**: Errors are announced immediately
- **High Contrast**: Works with Windows High Contrast mode

Try using keyboard navigation (Tab, Shift+Tab, Escape) to interact with the filters.
        `
      }
    }
  },
  play: async ({ canvasElement }) => {
    global.fetch = vi.fn(() => mockSuccessResponse())
    
    // Add visual focus indicators for demo
    const style = document.createElement('style')
    style.textContent = `
      *:focus {
        outline: 3px solid #ff0000 !important;
        outline-offset: 2px !important;
      }
    `
    document.head.appendChild(style)
  }
}