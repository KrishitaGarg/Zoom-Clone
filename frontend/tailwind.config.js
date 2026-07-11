/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tells Tailwind which frontend files contain utility class names.
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/services/**/*.{js,jsx}",
    "./src/utils/**/*.{js,jsx}",
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};