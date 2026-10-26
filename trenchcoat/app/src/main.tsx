import { createRoot } from "react-dom/client";
import { App } from "./App";
// Components read their values from the token dictionary (they carry no fallbacks of their own)
import "../../tokens/tokens.css";
import "./styles.css";

// Screenshot and axe runs drive the gallery through automation: the sticky top bar would cover the top of any stage
// taller than the viewport in element screenshots, so it scrolls with the page there (styles.css)
if (navigator.webdriver) document.documentElement.dataset.capture = "";

createRoot(document.getElementById("root")!).render(<App />);
