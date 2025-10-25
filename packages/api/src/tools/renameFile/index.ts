import { tool } from "ai";
import z from "zod";
import { db } from "@webgen/db";
import { writeFileToSandbox } from "@webgen/sandbox/utils";
import { deleteObject, getTextObject, projectKey, putTextObject } from "../s3";

const renameSchema = z.object({
  original_file_path: z.string().describe("Existing file path"),
  new_file_path: z.string().describe("New file path"),
});

type RenameInput = z.infer<typeof renameSchema>;

export function getRenameFileTool(projectId: string) {
  return {
    "webgen-rename": tool({
      description:
        "Rename a file within DB and write new file to sandbox (no delete on disk).",
      inputSchema: renameSchema,
      execute: async (params) => renameFile({ ...params, projectId }),
    }),
  };
}

export async function renameFile({
  original_file_path,
  new_file_path,
  projectId,
}: RenameInput & { projectId: string }) {
  const srcKey = projectKey(projectId, original_file_path);
  const dstKey = projectKey(projectId, new_file_path);
  const text = await getTextObject(srcKey);
  // Copy then delete for rename semantics
  await putTextObject(dstKey, text);
  await deleteObject(srcKey);
  const sandbox = await db.sandbox.findUnique({ where: { projectId } });
  if (!sandbox) throw new Error("no sandbox found");
  await writeFileToSandbox(sandbox.id, new_file_path, text);
  return { success: true } as const;
}
