import { mount } from "svelte";
import "@adamstavely/trenchcoat";
import "@adamstavely/trenchcoat/tokens.css";
import App from "./App.svelte";
mount(App, { target: document.getElementById("app") });
