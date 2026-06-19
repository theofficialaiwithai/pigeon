import { DemoClient } from "./DemoClient";
import { DEMO_COHORT } from "./seed-data";

export const metadata = { title: "Pigeon Demo" };

export default function DemoPage() {
  return <DemoClient cohort={DEMO_COHORT} />;
}
