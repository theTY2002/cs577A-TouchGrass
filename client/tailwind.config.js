/**
 * Tailwind config. Edit colors here to tweak palette.
 * Palette: brand-forest, brand-terracotta, bg-paper, bg-white
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-forest': '#748873',
        'brand-terracotta': '#D1A980',
        'bg-paper': '#E5E0D8',
        'bg-white': '#F7F8F6',
        page: '#F7F8F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        login: ['Nabla', 'cursive'],
      },
      fontSize: {
        'hero': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1' }],
        'card-title': ['1.125rem', { lineHeight: '1.35' }],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 28px rgba(0,0,0,0.12)',
        'image': '0 4px 20px rgba(0,0,0,0.15)',
        'fab':
          '0 2px 6px rgba(0, 0, 0, 0.06), 0 6px 18px rgba(116, 136, 115, 0.22)',
        'fab-hover':
          '0 4px 10px rgba(0, 0, 0, 0.07), 0 10px 26px rgba(116, 136, 115, 0.3)',
      },
      borderRadius: {
        'card': '20px',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
};
