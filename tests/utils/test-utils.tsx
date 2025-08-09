import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Utility to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Utility to mock window properties
export const mockWindowProperty = (property: string, value: any) => {
  const originalValue = (window as any)[property]
  delete (window as any)[property]
  Object.defineProperty(window, property, {
    configurable: true,
    writable: true,
    value,
  })
  return () => {
    delete (window as any)[property]
    Object.defineProperty(window, property, {
      configurable: true,
      writable: true,
      value: originalValue,
    })
  }
}

// Utility to mock viewport for mobile testing
export const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

// Touch event helpers
export const createTouchEvent = (type: string, touches: Touch[]) => {
  return new TouchEvent(type, {
    touches,
    targetTouches: touches,
    changedTouches: touches,
    bubbles: true,
    cancelable: true,
  })
}

export const createTouch = (target: Element, x: number, y: number): Touch => {
  return {
    identifier: Date.now(),
    target,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  } as Touch
}

// Network condition simulators
export const simulateSlowNetwork = () => {
  const originalFetch = global.fetch
  global.fetch = vi.fn(async (...args) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return originalFetch(...args)
  })
  return () => {
    global.fetch = originalFetch
  }
}

export const simulateOffline = () => {
  const originalNavigator = window.navigator
  Object.defineProperty(window, 'navigator', {
    writable: true,
    value: {
      ...originalNavigator,
      onLine: false,
    },
  })
  window.dispatchEvent(new Event('offline'))
  return () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: originalNavigator,
    })
    window.dispatchEvent(new Event('online'))
  }
}

// Performance measurement helpers
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Accessibility test helpers
export const getAccessibilityTree = (container: HTMLElement) => {
  const tree: any[] = []
  const walk = (element: Element, level = 0) => {
    const role = element.getAttribute('role') || element.tagName.toLowerCase()
    const label = element.getAttribute('aria-label') || element.textContent?.trim()
    tree.push({
      level,
      role,
      label,
      element,
    })
    Array.from(element.children).forEach(child => walk(child, level + 1))
  }
  walk(container)
  return tree
}

// SEO test helpers
export const getMetaTags = () => {
  const metaTags: Record<string, string> = {}
  document.querySelectorAll('meta').forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property')
    const content = meta.getAttribute('content')
    if (name && content) {
      metaTags[name] = content
    }
  })
  return metaTags
}

// Schema markup test helpers
export const getSchemaMarkup = () => {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  return Array.from(scripts).map(script => {
    try {
      return JSON.parse(script.textContent || '{}')
    } catch {
      return null
    }
  }).filter(Boolean)
}