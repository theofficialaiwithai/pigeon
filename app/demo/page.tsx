import { DemoClient } from "./DemoClient";
import { buildDemoCohort } from "./seed-data";

export const metadata = { title: "Pigeon Demo — Jordan's Launch Sequence" };

export default function DemoPage() {
  // Server-side: dynamic dates so demo always looks live
  const cohort = buildDemoCohort();
  return <DemoClient cohort={cohort} />;
}
