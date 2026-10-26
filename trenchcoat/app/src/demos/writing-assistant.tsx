import type * as UI from "../../../src/elements/react";

const replies: [RegExp, string][] = [
  [/launch|announce/i, "Big news: Atlas 2.0 is here. Faster search, shared workspaces and a brand-new mobile app – all included in your plan at no extra cost. Take a look and tell us what you think!"],
  [/decline|no to/i, "Thanks so much for thinking of me – I'm honored. I'm fully booked through the end of the month, so I'll have to pass this time, but I'd love to be considered for the next one."],
  [/thank/i, "Thank you for jumping in on such short notice. Your review caught two issues we would have shipped – the release went out smoothly because of you."],
  [/shorter|short/i, "Shorter version: “Thanks for the fast review – it made Friday's release possible.”"],
];

const respond = (message: string) =>
  new Promise<string>((resolve) => {
    const hit = replies.find(([re]) => re.test(message));
    window.setTimeout(
      () =>
        resolve(
          hit?.[1] ??
            "Here's a first draft based on that. Want it warmer, more formal or shorter? I can adjust the tone or trim it down in one go.",
        ),
      700,
    );
  });

export default function Demo({ ui }: { ui: typeof UI }) {
  const { WritingAssistant } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 380 }}>
      <WritingAssistant
        name="Quill"
        tagline="Your writing assistant"
        greeting="What are we writing today?"
        suggestions={["Announce our product launch", "Politely decline an invite", "Thank a teammate"]}
        placeholder="Ask Quill to write or edit…"
        respond={respond}
        speech="simulate"
        dictation="Write a short thank-you note to Sam for reviewing the release on short notice"
      />
    </div>
  );
}
