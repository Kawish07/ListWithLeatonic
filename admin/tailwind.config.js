module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: '#0046FF',
      },
      fontFamily: {
        headline: ['Montserrat', 'sans-serif'],
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
