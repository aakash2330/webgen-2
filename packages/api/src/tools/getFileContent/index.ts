import { tool } from "ai";
import z from "zod";
import { getTextObject, projectKey, projectPrefix } from "../s3";

const getFileToolSchema = z.object({
  path: z.string().describe("file path whose content you wanna retrieve"),
});

type getFileToolSchemaType = z.infer<typeof getFileToolSchema>;

export function getFileContentTool(projectId: string) {
  return {
    getFileContent: tool({
      description: "takes the file path as input and returns it's contents.",
      inputSchema: getFileToolSchema,
      execute: async (params) =>
        getFileContent({ projectId, path: params.path }),
    }),
  };
}

export async function getFileContent({
  projectId,
  path,
}: getFileToolSchemaType & { projectId: string }) {
  console.log("get file content was called", { path });
  const key = projectKey(projectId, path);
  console.log({ key });
  const content = await getTextObject(key);
  return { content } as const;
}
