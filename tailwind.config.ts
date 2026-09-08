import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // <-- AQUI ESTÁ A MÁGICA QUE LIBERA O NOSSO BOTÃO SOL/LUA
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;