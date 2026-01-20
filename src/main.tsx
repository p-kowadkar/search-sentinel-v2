import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set dark mode as default before React renders
const storedTheme = localStorage.getItem('theme');
if (!storedTheme) {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
} else {
  document.documentElement.classList.add(storedTheme);
}

createRoot(document.getElementById("root")!).render(<App />);
