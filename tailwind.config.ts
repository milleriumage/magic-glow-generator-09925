import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './screens/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#ef4444',
        'brand-secondary': '#ec4899',
        'brand-light': '#f9a8d4',
        'neutral-900': '#111827',
        'neutral-800': '#1F2937',
        'neutral-700': '#374151',
        'neutral-600': '#4B5563',
        'neutral-300': '#D1D5DB',
        'neutral-100': '#F3F4F6',
        'accent-gold': '#FBBF24',
        'accent-green': '#10B981',
        'accent-red': '#EF4444',
      }
    }
  },
  plugins: [],
} satisfies Config
