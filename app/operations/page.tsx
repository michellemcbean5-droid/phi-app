import type { Metadata } from "next";

import PHIOperationsWorkspace from "../components/PHIOperationsWorkspace";

export const metadata: Metadata = {
  title: "PHI Operations | Private Lead Engine",
  description: "Private Prince Haul Intelligence customer-acquisition command center.",
  robots: { index: false, follow: false },
};

export default function OperationsPage() {
  return <PHIOperationsWorkspace />;
}
