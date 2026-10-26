import type * as UI from "@blocks/testimonial-wall";

const ITEMS: UI.Testimonial[] = [
  { quote: "We replaced three tools with this in a week. The team actually likes opening it.", name: "Maya Kim", role: "Head of Product", company: "Fieldnote", rating: 5, verified: true },
  { quote: "Fast.", name: "Leo Brandt", role: "Staff Engineer", company: "Northwind", rating: 5 },
  { quote: "The agents draft, I review, and nothing ships without my sign-off. It finally feels like delegation instead of babysitting a script.", name: "Priya Shah", role: "Operations Lead", company: "Halcyon", rating: 5, verified: true },
  { quote: "Onboarding took ten minutes. Our first automated report went out before lunch.", name: "Jonas Ortiz", role: "Founder", company: "Kestrel", rating: 4 },
  { quote: "Calm, considered UI. Every interaction feels like someone sweated the details.", name: "Ana Ribeiro", role: "Design Engineer", company: "Mosaic", rating: 5, verified: true },
  { quote: "Support answered in under an hour on a Sunday. That alone sold our CFO.", name: "Tom Becker", role: "IT Manager", company: "Brightpath", rating: 5 },
  { quote: "I was skeptical about AI in our workflow. Seeing the plan before anything runs changed my mind completely.", name: "Sofia Laurent", role: "VP Engineering", company: "Lumen", rating: 5, verified: true },
  { quote: "Our weekly sync went from an hour to fifteen minutes.", name: "Kenji Watanabe", role: "Engineering Manager", company: "Orbitly", rating: 4 },
  { quote: "The audit trail is exactly what compliance asked for, and nobody had to build it.", name: "Rachel Green", role: "Security Lead", company: "Vantage", rating: 5, verified: true },
  { quote: "Pricing is honest and the free tier is genuinely useful.", name: "Omar Haddad", role: "Indie Developer", rating: 5 },
  { quote: "We roll it out to every new team now. It's the first tool people ask for by name.", name: "Elena Petrova", role: "COO", company: "Quanta", rating: 5, verified: true },
  { quote: "Love the keyboard shortcuts. I barely touch the mouse.", name: "Chris Morgan", role: "Product Designer", company: "Fernway", rating: 4 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TestimonialWall } = ui;
  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 24px" }}>Loved by teams who ship</h2>
      <TestimonialWall items={ITEMS} label="Customer testimonials" />
    </div>
  );
}
