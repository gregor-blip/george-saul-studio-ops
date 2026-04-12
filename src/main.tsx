import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "geist/font/sans.css";
import "geist/font/mono.css";

createRoot(document.getElementById("root")!).render(<App />);
