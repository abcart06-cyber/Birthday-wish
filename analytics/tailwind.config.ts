import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#F4F9F8',
          100: '#E2F0ED',
          500: '#5BADA6',
          600: '#4A9A93',
          700: '#3D827C',
        },
        charcoal: {
          100: '#EBEBEB',
          700: '#3D3D3D',
          800: '#2A2A2A',
          950: '#141414',
        },
      },
    },
  },
  plugins: [],
};
export default config;
