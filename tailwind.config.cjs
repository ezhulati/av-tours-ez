module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: { 
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#1a1a1a', // Matte black
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#1a1a1a',
          900: '#0d0d0d',
        },
        secondary: {
          DEFAULT: '#f5f5f5', // Light grey
          50: '#ffffff',
          100: '#fafafa',
          200: '#f5f5f5',
          300: '#e8e8e8',
          400: '#d6d6d6',
          500: '#a3a3a3',
          600: '#737373',
          700: '#525252',
          800: '#404040',
          900: '#262626',
        },
        accent: {
          DEFAULT: '#DC2626', // Professional red
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#DC2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Status colors using shades of grey/red
        success: {
          DEFAULT: '#1a1a1a',
          light: '#404040',
        },
        warning: {
          DEFAULT: '#737373',
          light: '#a3a3a3',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#fca5a5',
        },
        // Override default grays with brand-appropriate tones
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Component-specific colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Merriweather', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    } 
  },
  plugins: []
}