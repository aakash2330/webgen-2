import { SandboxState } from "@e2b/code-interpreter";
import { SandboxStatus } from "@webgen/db";

export const sandboxStatusMap: Record<SandboxState, SandboxStatus> = {
  running: SandboxStatus.RUNNING,
  paused: SandboxStatus.PAUSED,
};
