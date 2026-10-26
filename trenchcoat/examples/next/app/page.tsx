import { ClientDemo } from "./client-demo";

// A server component: the elements render on the client only (decision L10), behind a sized placeholder
export default function Page() {
  return <ClientDemo />;
}
