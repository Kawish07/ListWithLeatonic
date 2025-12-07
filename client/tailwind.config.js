module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand color updated to match provided image (client only)
        accent: {
          DEFAULT: '#2B6BFF',
          dark: '#0B3EC7'
        }
      },
      fontFamily: {
        headline: ['Onest', 'Montserrat', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
