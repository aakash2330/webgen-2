import { db } from "@webgen/db";
import { tool } from "ai";
import z from "zod";

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
  const fileContent = await db.file.findUnique({
    where: { id: fileId },
    select: {
      content: true,
    },
  });
  return fileContent;
}
