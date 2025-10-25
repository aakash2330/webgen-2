import { tool } from "ai";
import z from "zod";
import { db } from "@webgen/db";
import { writeFileToSandbox } from "@webgen/sandbox/utils";
import { getTextObject, projectKey, putTextObject } from "../s3";

const replaceSchema = z.object({
  file_path: z.string().describe("Target file path (relative)"),
  search: z.string().describe("Original content to match (supports ... as ellipsis)"),
  first_replaced_line: z.number().describe("First line number (1-indexed)"),
  last_replaced_line: z.number().describe("Last line number (1-indexed)"),
  replace: z.string().describe("Replacement content")
});

type ReplaceInput = z.infer<typeof replaceSchema>;

function matchesWithEllipsis(lines: string[], start: number, end: number, pattern: string) {
  const parts = pattern.split(/^\.{3}$/m);
  if (parts.length === 1) {
    return lines.slice(start - 1, end).join("\n") === pattern;
  }
  const segment = lines.slice(start - 1, end).join("\n");
  const escaped = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp("^" + escaped.join("[\s\S]*?") + "$", "m");
  return re.test(segment);
}

export function getLineReplaceTool(projectId: string) {
  return {
    "webgen-line-replace": tool({
      description: "Replace a specific range in a file with validation using an ellipsis matcher.",
      inputSchema: replaceSchema,
      execute: async (params) => lineReplace({ ...params, projectId })
    })
  };
}

export async function lineReplace({
  file_path,
  search,
  first_replaced_line,
  last_replaced_line,
  replace,
  projectId
}: ReplaceInput & { projectId: string }) {
  const key = projectKey(projectId, file_path);
  const current = await getTextObject(key);
  const lines = current.split(/\r?\n/);
  if (!matchesWithEllipsis(lines, first_replaced_line, last_replaced_line, search)) {
    throw new Error("provided search does not match specified line range");
  }
  const before = lines.slice(0, first_replaced_line - 1).join("\n");
  const after = lines.slice(last_replaced_line).join("\n");
  const nextContent = [before, replace, after].filter(Boolean).join("\n");

  await putTextObject(key, nextContent);

  const sandbox = await db.sandbox.findUnique({ where: { projectId } });
  if (!sandbox) throw new Error("no sandbox found");
  await writeFileToSandbox(sandbox.id, file_path, nextContent);
  return { success: true } as const;
}


