import { tool } from "ai";
import z from "zod";
import { listKeys, projectPrefix } from "../s3";

export function getAllFilesTool(projectId: string) {
  return {
    getAllFiles: tool({
      description: "returns all file paths available in S3 for this project.",
      inputSchema: z.object().describe("an empty object"),
      execute: async () => getProjectFiles(projectId),
    }),
  };
}

export async function getProjectFiles(projectId: string) {
  console.log("find files was called");
  const prefix = projectPrefix(projectId);
  const keys = await listKeys(prefix);
  const files = keys
    .filter(
      (k) =>
        k.endsWith(".ts") ||
        k.endsWith(".tsx") ||
        k.endsWith(".js") ||
        k.endsWith(".json") ||
        k.endsWith(".css") ||
        k.endsWith(".md") ||
        k.endsWith(".html"),
    )
    .map((k) => ({ id: k, path: k.replace(prefix, "") }));
  return { files } as const;
}
