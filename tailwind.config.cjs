module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: { 
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#1A5F7A', // Deep sea blue
          50: '#E6F2F6',
          100: '#CCE5ED',
          200: '#99CBDB',
          300: '#66B1C9',
          400: '#3397B7',
          500: '#1A5F7A',
          600: '#154C62',
          700: '#103949',
          800: '#0B2631',
          900: '#051318',
        },
        secondary: {
          DEFAULT: '#4F7942', // Mountain green
          50: '#EDF2EC',
          100: '#DBE5D8',
          200: '#B7CBB1',
          300: '#93B18A',
          400: '#6F9763',
          500: '#4F7942',
          600: '#3F6135',
          700: '#2F4928',
          800: '#20301A',
          900: '#10180D',
        },
        accent: {
          DEFAULT: '#FF0000', // Bright red
          50: '#FFE6E6',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF3333',
          500: '#FF0000',
          600: '#CC0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
        earth: {
          DEFAULT: '#8B7355',
          light: '#A08975',
          dark: '#6B5940',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFF4CC',
          dark: '#B39700',
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
      },
      backdropBlur: {
        xs: '2px',
      },
    } 
  },
  plugins: []
}