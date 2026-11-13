import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RecipeIngredient, RecipeStep, RecipeUnits } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's team lunch after the audit: an assistant's vegetable curry for four. Change the servings or
   switch to imperial and every quantity follows; start a step's timer. */

const INGREDIENTS: RecipeIngredient[] = [
  { id: "oil", quantity: 2, unit: "tbsp", name: "vegetable oil" },
  { id: "onion", quantity: 2, name: "onions", note: "finely chopped" },
  { id: "garlic", quantity: 3, name: "garlic cloves", note: "crushed" },
  { id: "paste", quantity: 3, unit: "tbsp", name: "mild curry paste" },
  { id: "squash", quantity: 500, unit: "g", name: "butternut squash", note: "in 2 cm cubes" },
  { id: "chickpeas", quantity: 400, unit: "g", name: "chickpeas", note: "drained" },
  { id: "tomatoes", quantity: 400, unit: "g", name: "chopped tomatoes" },
  { id: "coconut", quantity: 400, unit: "ml", name: "coconut milk" },
  { id: "spinach", quantity: 100, unit: "g", name: "baby spinach" },
  { id: "salt", name: "salt and pepper" },
];
const STEPS: RecipeStep[] = [
  "Heat the oven to 200°C and roast the squash for 25 minutes, until golden at the edges.",
  "Warm the oil in a large pan and soften the onions for 8 minutes.",
  "Stir in the garlic and curry paste and cook for 1 minute.",
  "Add the tomatoes, chickpeas, coconut milk and roasted squash. Simmer for 15 minutes.",
  "Stir the spinach through until it wilts, then season and serve with rice.",
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RecipeCard } = ui;
  const [units, setUnits] = useState<RecipeUnits>("metric");
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <RecipeCard
        title="Squash and chickpea curry"
        description="For the team lunch after the audit – mild, and fine made the day before."
        prepMinutes={15}
        cookMinutes={40}
        baseServings={4}
        defaultServings={6}
        units={units}
        onUnitsChange={setUnits}
        defaultStep={1}
        ingredients={INGREDIENTS}
        steps={STEPS}
        checked={["oil", "onion"]}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Change the servings, tick off ingredients, or start a step's timer.{" "}
        <button type="button" style={textButton} onClick={() => setUnits(units === "metric" ? "imperial" : "metric")}>
          Show it in {units === "metric" ? "imperial" : "metric"}
        </button>
      </div>
    </div>
  );
}
