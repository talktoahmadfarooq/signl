import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#0D1A2A',
        accent:     '#2E6DA4',
        gold:       '#F5A623',
        mist:       '#EEF3F8',
        mist2:      '#D5E2EE',
        fog:        '#F4F7FA',
        success:    '#1A7A3C',
        warning:    '#B8860B',
        danger:     '#C0392B',
        border:     '#D5E2EE',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        none:    '0px',
        sm:      '0px',
        md:      '0px',
        lg:      '0px',
        xl:      '0px',
        full:    '9999px',
      },
    },
  },
  plugins: [],
}
export default config
