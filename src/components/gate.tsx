import { ensureDatabase, loadPortfolio, DatabaseNotReadyError } from "@/lib/store";
import type { Portfolio } from "@/lib/types";
import { SetupScreen } from "./setup-screen";

export async function withPortfolio(render: (portfolio: Portfolio) => React.ReactNode) {
  let portfolio: Portfolio;
  try {
    await ensureDatabase();
    portfolio = await loadPortfolio();
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    const connection = error instanceof DatabaseNotReadyError || /DATABASE_URL|ECONN|ENOTFOUND|password authentication|timeout|connect/i.test(error.message);
    if (!connection) throw error;
    return <SetupScreen detail={error.message} />;
  }
  return render(portfolio);
}
