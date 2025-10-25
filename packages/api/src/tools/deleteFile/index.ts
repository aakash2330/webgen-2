import { tool } from "ai";
import z from "zod";
import { db } from "@webgen/db";
import { deleteObject, projectKey } from "../s3";

const deleteSchema = z.object({
  file_path: z.string().describe("Path of file to delete")
});

type DeleteInput = z.infer<typeof deleteSchema>;

export function getDeleteFileTool(projectId: string) {
  return {
    "webgen-delete": tool({
      description: "Mark a file as deleted in DB (sandbox delete is not guaranteed).",
      inputSchema: deleteSchema,
      execute: async (params) => deleteFile({ ...params, projectId })
    })
  };
}

export async function deleteFile({ file_path, projectId }: DeleteInput & { projectId: string }) {
  const key = projectKey(projectId, file_path);
  await deleteObject(key);
  return { success: true } as const;
}


