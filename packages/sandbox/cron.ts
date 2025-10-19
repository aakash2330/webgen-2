import Sandbox from "@e2b/code-interpreter";
import { db, SandboxStatus } from "@webgen/db";

export async function updateSandboxStatus() {
  const pausedPaginator = Sandbox.list({ query: { state: ["paused"] } });
  const pausedSandboxes = [];
  while (pausedPaginator.hasNext) {
    const nextPausedSandboxes = await pausedPaginator.nextItems();
    pausedSandboxes.push(...nextPausedSandboxes.map((s) => s.sandboxId));
  }

  const runningPaginator = Sandbox.list({ query: { state: ["running"] } });
  const runningSandboxes = [];
  while (runningPaginator.hasNext) {
    const nextRunningSandboxes = await runningPaginator.nextItems();
    runningSandboxes.push(...nextRunningSandboxes.map((s) => s.sandboxId));
  }

  console.log({ runningSandboxes, pausedSandboxes });
  await Promise.all([
    db.sandbox.updateMany({
      where: { id: { in: pausedSandboxes } },
      data: {
        status: SandboxStatus.PAUSED,
      },
    }),
    db.sandbox.updateMany({
      where: { id: { in: runningSandboxes } },
      data: {
        status: SandboxStatus.RUNNING,
      },
    }),

    db.sandbox.updateMany({
      where: { id: { in: [...runningSandboxes, ...pausedSandboxes] } },
      data: {
        status: SandboxStatus.KILLED,
      },
    }),
  ]);
}
