/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#4F46E5',
        light: '#ffffff',
        dark: '#0f0f23',
        'gray-dark': '#6b7280',
        'blue-500': '#3b82f6'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'spin': 'spin 1s linear infinite',
        'spin-3d': 'spin-3d 8s linear infinite',
        'magnetic-ring-1': 'magnetic-ring-1 4s ease-in-out infinite',
        'magnetic-ring-2': 'magnetic-ring-2 4s ease-in-out infinite 0.5s',
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
        'scroll-testimonials': 'scroll-testimonials 40s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'spin-3d': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' }
        },
        'magnetic-ring-1': {
          '0%': { transform: 'rotate3d(1, 1, 0, 0deg) scale(1.2)', opacity: '0.4' },
          '50%': { transform: 'rotate3d(1, 1, 0, 180deg) scale(1.25)', opacity: '1' },
          '100%': { transform: 'rotate3d(1, 1, 0, 360deg) scale(1.2)', opacity: '0.4' }
        },
        'magnetic-ring-2': {
          '0%': { transform: 'rotate3d(1, -1, 0, 0deg) scale(1.2)', opacity: '1' },
          '50%': { transform: 'rotate3d(1, -1, 0, -180deg) scale(1.25)', opacity: '0.4' },
          '100%': { transform: 'rotate3d(1, -1, 0, -360deg) scale(1.2)', opacity: '1' }
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79, 70, 229, 0.6)' },
          '50%': { boxShadow: '0 0 0 12px rgba(79, 70, 229, 0)' }
        },
        'scroll-testimonials': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    },
  },
  plugins: [],
}
