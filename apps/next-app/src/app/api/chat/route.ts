import { api } from "@/trpc/server";
import { type UIMessage } from "ai";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages?: UIMessage[];
    projectId?: string;
    data?: { projectId?: string };
  };

  const messages = body.messages ?? [];
  const projectId = body.projectId ?? body.data?.projectId;

  if (!projectId) {
    return new Response(JSON.stringify({ error: "projectId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const uiStreamResponse = api.chat.chat({ messages, projectId });

  return uiStreamResponse;
}
