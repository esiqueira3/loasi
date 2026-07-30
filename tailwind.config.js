/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        /* ---- Marca L'Oasi: oro caldo + inchiostro ---- */
        gold: {
          50: '#FBF7F0',
          100: '#F4EBD9',
          200: '#E9D6B2',
          300: '#DCC08C',
          400: '#C8A165',
          500: '#B98C4A',
          600: '#A67C3D',
          700: '#8A6630',
          800: '#6B4E26',
          900: '#4A361A',
        },
        ink: {
          /* `text-ink` e i due livelli attenuati sono usati dal gestionale */
          DEFAULT: '#1A1815',
          'muted-80': 'rgba(26,24,21,0.80)',
          'muted-48': 'rgba(26,24,21,0.48)',
          /* la scala numerata è quella del sito pubblico (fondi scuri) */
          950: '#06090B',
          900: '#0B1013',
          800: '#11171B',
          700: '#182026',
          600: '#222C34',
          500: '#33414B',
        },
        cream: {
          50: '#FDFBF7',
          100: '#F7F3EC',
          200: '#EFE9DE',
          300: '#E2D9C9',
        },

        /* ---- Superfici del gestionale ---- */
        canvas: {
          DEFAULT: '#FBFAF7', // fondo della chrome (header, sidebar chiara)
          parchment: '#F5F2EC', // fondo dell'area di contenuto
        },
        'surface-pearl': '#FFFFFF', // card e pannelli
        hairline: '#E7E2D8', // bordo sottile onnipresente

        /* ---- Token Material 3 (usati dalle schermate del gestionale) ---- */
        primary: '#A67C3D',
        'primary-container': '#8A6630',
        'on-primary': '#FFFFFF',
        secondary: '#33414B',
        background: '#F7F4EF',
        surface: '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F4F0E9',
        'surface-container': '#EEE9E0',
        'surface-container-high': '#E7E1D6',
        'on-surface': '#1B1A17',
        'on-surface-variant': '#55524C',
        outline: '#8B857B',
        'outline-variant': '#D6D1C7',
        error: '#B3261E',
      },
      fontFamily: {
        headline: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', '"Lato"', 'system-ui', 'sans-serif'],
        script: ['Kalam', 'cursive'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      boxShadow: {
        soft: '0 24px 60px -24px rgba(11,16,19,0.35)',
        lift: '0 32px 64px -16px rgba(11,16,19,0.45)',
        glow: '0 0 0 1px rgba(200,161,101,0.35), 0 18px 50px -18px rgba(200,161,101,0.55)',
      },
      backgroundImage: {
        'gold-line': 'linear-gradient(90deg, transparent, #C8A165, transparent)',
        'scrim-b': 'linear-gradient(180deg, rgba(6,9,11,0) 0%, rgba(6,9,11,0.55) 55%, rgba(6,9,11,0.92) 100%)',
        'scrim-l': 'linear-gradient(90deg, rgba(6,9,11,0.92) 0%, rgba(6,9,11,0.55) 45%, rgba(6,9,11,0.15) 100%)',
      },
      keyframes: {
        mirror: {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '100%': { transform: 'translateX(350%) skewX(-20deg)' },
        },
        kenburns: {
          '0%': { transform: 'scale(1) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.12) translate3d(0,-1.5%,0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        mirror: 'mirror 3.2s ease-in-out infinite',
        kenburns: 'kenburns 16s ease-out forwards',
        floaty: 'floaty 5s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
