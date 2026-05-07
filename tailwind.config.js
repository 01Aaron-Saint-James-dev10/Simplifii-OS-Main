/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.5)',
        'glow-emerald-lg': '0 0 25px rgba(16, 185, 129, 0.6)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.5)',
        'glow-amber-lg': '0 0 25px rgba(245, 158, 11, 0.6)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
