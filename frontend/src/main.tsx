import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// frontend/src/main.tsx or App.tsx
import { keepBackendAlive } from "@/lib/keepAlive";

keepBackendAlive();

createRoot(document.getElementById("root")!).render(<App />);
