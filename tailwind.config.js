import nativewind from "nativewind/preset";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [nativewind],
    theme: {
        extend: {
            colors: {
                primary: "#2563eb",
            },
        },
    },
    plugins: [],
};
