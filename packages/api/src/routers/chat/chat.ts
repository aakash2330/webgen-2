import { createTRPCRouter, publicProcedure } from "../../trpc";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { getTools } from "../../tools";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const systemPrompt = readFileSync(join(__dirname, "system-prompt.md"), "utf8");

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const chatRouter = createTRPCRouter({
  chat: publicProcedure
    .input((val) => val as { messages: UIMessage[]; projectId: string })
    .query(({ input }) => {
      const tools = getTools(input.projectId);

      const result = streamText({
        model: openrouter.chat("google/gemini-2.5-flash:online"),
        system: systemPrompt,
        messages: convertToModelMessages(input.messages),
        tools,
      });
      return result.toUIMessageStreamResponse();
    }),
});
