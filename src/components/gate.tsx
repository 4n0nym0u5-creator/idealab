import { isDatabaseReady } from "@/lib/db";
import { loadPortfolio } from "@/lib/store";
import type { Portfolio } from "@/lib/types";
import { SetupScreen } from "./setup-screen";

export function withPortfolio(render: (portfolio: Portfolio) => React.ReactNode) {
  if (!isDatabaseReady()) return <SetupScreen />;
  return render(loadPortfolio());
}
