import { tool } from "ai";
import z from "zod";
import { db } from "@webgen/db";
import { writeFileToSandbox } from "@webgen/sandbox/utils";
import { projectKey, putTextObject } from "../s3";

const writeSchema = z.object({
  file_path: z.string().describe("Relative path from project root"),
  content: z.string().describe("File contents to write (overwrites if exists)")
});

type WriteInput = z.infer<typeof writeSchema>;

export function getWriteFileTool(projectId: string) {
  return {
    "webgen-write": tool({
      description: "Write a file to DB and sandbox (overwrites if exists)",
      inputSchema: writeSchema,
      execute: async (params) => writeFile({ ...params, projectId })
    })
  };
}

export async function writeFile({ file_path, content, projectId }: WriteInput & { projectId: string }) {
  const key = projectKey(projectId, file_path);
  await putTextObject(key, content);
  const sandbox = await db.sandbox.findUnique({ where: { projectId } });
  if (!sandbox) throw new Error("no sandbox found");
  await writeFileToSandbox(sandbox.id, file_path, content);
  return { success: true } as const;
}


