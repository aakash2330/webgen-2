import { tool } from "ai";
import z from "zod";
import { getTextObject } from "../s3";

const getFileToolSchema = z.object({
  fileId: z.string().describe("file id whose content you wanna retrieve"),
});

type getFileToolSchemaType = z.infer<typeof getFileToolSchema>;

export function getFileContentTool() {
  return {
    getFileContent: tool({
      description: "takes the fileId as input and returns it's contents.",
      inputSchema: getFileToolSchema,
      execute: async (params) => getFileContent(params),
    }),
  };
}

export async function getFileContent({ fileId }: getFileToolSchemaType) {
  console.log("get file content was called", { fileId });
  // In S3 mode, fileId is the S3 key; fall back to current project-based key if needed by callers.
  const key = fileId;
  const content = await getTextObject(key);
  return { content } as const;
}
