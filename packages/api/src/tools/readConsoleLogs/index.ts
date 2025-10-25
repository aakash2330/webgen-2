import { tool } from "ai";
import z from "zod";
import { db } from "@webgen/db";
import Sandbox from "@e2b/code-interpreter";
import { REMOTE_PROJECT_DIR } from "@webgen/sandbox";

const logsSchema = z.object({
  search: z.string().describe("Substring to filter logs, e.g., error"),
});

type LogsInput = z.infer<typeof logsSchema>;

export function getReadConsoleLogsTool(projectId: string) {
  return {
    "webgen-read-console-logs": tool({
      description:
        "Read recent server.log from sandbox and optionally filter for a substring.",
      inputSchema: logsSchema,
      execute: async (params) => readConsoleLogs({ ...params, projectId }),
    }),
  };
}

export async function readConsoleLogs({
  search,
  projectId,
}: LogsInput & { projectId: string }) {
  const sandbox = await db.sandbox.findUnique({ where: { projectId } });
  if (!sandbox) throw new Error("no sandbox found");
  try {
    const sbx = await Sandbox.connect(sandbox.id);
    const result = await sbx.commands.run(
      'bash -lc "tail -n 1000 server.log || true"',
      { cwd: REMOTE_PROJECT_DIR },
    );
    const text =
      result && (result as any).output ? String((result as any).output) : "";
    if (!search) return { logs: text };
    const lines = text
      .split(/\r?\n/)
      .filter((l: string) => l.toLowerCase().includes(search.toLowerCase()));
    return { logs: lines.join("\n") };
  } catch (err) {
    return { logs: "" };
  }
}
