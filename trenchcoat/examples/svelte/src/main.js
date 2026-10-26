import { mount } from "svelte";
import "trenchcoat";
import "trenchcoat/tokens.css";
import App from "./App.svelte";
mount(App, { target: document.getElementById("app") });
