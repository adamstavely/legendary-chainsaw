import type * as UI from "@components/stepper-form";
import { button } from "../demo-kit";

type Values = {
  workspace: string;
  slug: string;
  invites: string[];
  plan: string;
};

const PLANS: UI.StepperChoice[] = [
  { value: "starter", title: "Starter", aside: "Free", description: "Up to 3 members and 1 GB of storage." },
  { value: "team", title: "Team", aside: "$12 / seat", description: "Unlimited projects, guests and integrations.", badge: "Popular" },
  { value: "business", title: "Business", aside: "$24 / seat", description: "SSO, audit logs and priority support." },
];

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StepperForm, StepperField, StepperInput, StepperTags, StepperChoices, StepperReview, StepperSuccess } = ui;

  const steps: UI.Step<Values>[] = [
    {
      id: "workspace",
      title: "Workspace",
      heading: "Name your workspace",
      description: "This is what your team will see when they sign in.",
      validate: (v) => ({
        workspace: v.workspace.trim().length < 2 ? "Give it a name of at least 2 characters" : undefined,
        slug: !/^[a-z0-9-]{3,}$/.test(v.slug) ? "Use 3 or more lowercase letters, numbers or dashes" : undefined,
      }),
      render: ({ values, setValues }) => (
        <>
          <StepperField name="workspace" label="Workspace name">
            <StepperInput
              value={values.workspace}
              placeholder="Northwind Studio"
              onChange={(e) => {
                const workspace = e.target.value;
                // Keep the address in step with the name until it's edited by hand
                const follow = values.slug === toSlug(values.workspace);
                setValues(follow ? { workspace, slug: toSlug(workspace) } : { workspace });
              }}
            />
          </StepperField>
          <StepperField name="slug" label="Workspace address" hint="You can change this later in settings.">
            <StepperInput prefix="affect.app/" value={values.slug} placeholder="northwind" onChange={(e) => setValues({ slug: e.target.value.toLowerCase() })} />
          </StepperField>
        </>
      ),
    },
    {
      id: "team",
      title: "Team",
      heading: "Invite your team",
      description: "Press Enter or comma after each address – or paste a whole list.",
      render: ({ values, setValues }) => (
        <StepperField name="invites" label="Email addresses" optional>
          <StepperTags value={values.invites} onChange={(invites) => setValues({ invites })} max={10} />
        </StepperField>
      ),
    },
    {
      id: "plan",
      title: "Plan",
      heading: "Pick a plan",
      description: "Every plan starts with a 14-day trial of Business.",
      validate: (v) => ({ plan: v.plan ? undefined : "Choose a plan to continue" }),
      render: ({ values, setValues }) => (
        <StepperField name="plan" label="Plan">
          <StepperChoices label="Plan" value={values.plan} onChange={(plan) => setValues({ plan })} options={PLANS} />
        </StepperField>
      ),
    },
    {
      id: "review",
      title: "Review",
      heading: "Check everything",
      description: "Edit anything before we create your workspace.",
      render: ({ values, goTo }) => (
        <StepperReview
          onEdit={goTo}
          rows={[
            { label: "Workspace", value: values.workspace, step: "workspace" },
            { label: "Address", value: `affect.app/${values.slug}`, step: "workspace" },
            {
              label: "Invites",
              value: values.invites.length ? `${values.invites.length} ${values.invites.length === 1 ? "person" : "people"}` : "Just you for now",
              step: "team",
            },
            { label: "Plan", value: PLANS.find((p) => p.value === values.plan)?.title ?? "—", step: "plan" },
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <StepperForm<Values>
        steps={steps}
        initialValues={{ workspace: "", slug: "", invites: ["maya@northwind.studio"], plan: "team" }}
        submitLabel="Create workspace"
        submittingLabel="Creating…"
        onComplete={() => new Promise<void>((resolve) => setTimeout(resolve, 1400))}
        success={(values, reset) => (
          <StepperSuccess
            title={`${values.workspace} is ready`}
            description={
              values.invites.length
                ? `We sent ${values.invites.length} invite${values.invites.length === 1 ? "" : "s"}. Your workspace lives at affect.app/${values.slug}.`
                : `Your workspace lives at affect.app/${values.slug}.`
            }
          >
            <button
              type="button"
              onClick={reset}
              style={button}
            >
              Start over
            </button>
          </StepperSuccess>
        )}
      />
    </div>
  );
}
