import { db } from "@webgen/db";
import { tool } from "ai";
import z from "zod";

export function getAllFilesTool(projectId: string) {
  return {
    getFile: tool({
      description:
        "takes the project id and returns all the file paths and fileIds within that project .",
      inputSchema: z.object().describe("an empty object"),
      execute: async () => getProjectFiles(projectId),
    }),
  };
}

export async function getProjectFiles(projectId: string) {
  console.log("find files was called");
  const filePaths = await db.project.findUnique({
    where: { id: projectId },
    include: { files: { select: { id: true, path: true } } },
  });
  return filePaths;
}
