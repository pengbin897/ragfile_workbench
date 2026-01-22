/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        dark: {
          bg: '#0f1117',
          secondary: '#1a1d29',
          card: '#252a3d',
          'card-hover': '#2d3348',
          border: '#374151',
        },
        light: {
          bg: '#f8fafc',
          secondary: '#ffffff',
          card: '#ffffff',
          'card-hover': '#f1f5f9',
          border: '#e2e8f0',
        },
        status: {
          green: '#10b981',
          'green-light': '#34d399',
          yellow: '#f59e0b',
          'yellow-light': '#fbbf24',
          red: '#ef4444',
          'red-light': '#f87171',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
