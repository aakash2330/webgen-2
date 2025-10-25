import { tool } from "ai";
import z from "zod";
import { db } from "@webgen/db";
import { writeFileToSandbox } from "@webgen/sandbox/utils";
import { projectKey, putTextObject } from "../s3";

const updateFileToolSchema = z.object({
  path: z.string().describe("relative file path"),
  updatedContent: z.string().describe("updated file content"),
});

type UpdateFileToolSchemaType = z.infer<typeof updateFileToolSchema>;

export function getUpdateFileTool(projectId: string) {
  return {
    updateFile: tool({
      description: "update the file",
      inputSchema: updateFileToolSchema,
      execute: async (params) => updateFile({ ...params, projectId }),
    }),
  };
}

export async function updateFile({
  path,
  updatedContent,
  projectId,
}: UpdateFileToolSchemaType & { projectId: string }) {
  const key = projectKey(projectId, path);
  await putTextObject(key, updatedContent);

  const sandbox = await db.sandbox.findUnique({
    where: {
      projectId: projectId,
    },
  });
  if (!sandbox) {
    throw "no sandbox found";
  }

  try {
    await writeFileToSandbox(sandbox.id, path, updatedContent);
  } catch (err) {
    console.warn("Sandbox write failed (will remain consistent in DB):", err);
  }

  return { success: true } as const;
}
