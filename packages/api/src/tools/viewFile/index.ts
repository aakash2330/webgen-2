import { tool } from "ai";
import z from "zod";
import { getTextObject, projectKey } from "../s3";

const viewSchema = z.object({
  file_path: z.string().describe("Relative path to file"),
  lines: z.string().optional().describe("Optional line ranges like 1-200, 500-800")
});

type ViewInput = z.infer<typeof viewSchema>;

function parseRanges(ranges?: string): Array<[number, number]> | undefined {
  if (!ranges) return undefined;
  const arr = ranges.split(",").map((s) => s.trim()).filter(Boolean);
  const pairs: Array<[number, number]> = [];
  for (const r of arr) {
    const [aRaw, bRaw] = r.split("-");
    const a = parseInt(aRaw ?? "", 10);
    const b = parseInt(bRaw ?? "", 10);
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= a) {
      pairs.push([a, b]);
    }
  }
  return pairs.length ? pairs : undefined;
}

export function getViewFileTool(projectId: string) {
  return {
    "webgen-view": tool({
      description: "Read file contents from DB, optionally scoped to line ranges.",
      inputSchema: viewSchema,
      execute: async (params) => viewFile({ ...params, projectId })
    })
  };
}

export async function viewFile({ file_path, lines, projectId }: ViewInput & { projectId: string }) {
  const key = projectKey(projectId, file_path);
  const text = await getTextObject(key);
  const ranges = parseRanges(lines);
  if (!ranges) {
    const first500 = text.split(/\r?\n/).slice(0, 500).join("\n");
    return { content: first500 };
  }
  const srcLines = text.split(/\r?\n/);
  const chunks: string[] = [];
  for (const [a, b] of ranges) {
    chunks.push(srcLines.slice(a - 1, b).join("\n"));
  }
  return { content: chunks.join("\n") };
}


