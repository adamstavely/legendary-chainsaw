import "trenchcoat";
import "trenchcoat/tokens.css";
import manifest from "trenchcoat/custom-elements.json";

const tags = manifest.modules.flatMap((m) => (m.declarations ?? []).map((d) => d.tagName).filter(Boolean));
const main = document.querySelector("#all");
for (const tag of tags) main.append(document.createElement(tag));
document.body.dataset.tags = String(tags.length);
