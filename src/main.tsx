import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-expect-error - CSS import from @fontsource-variable/inter
import "@fontsource-variable/inter";

createRoot(document.getElementById("root")!).render(<App />);
