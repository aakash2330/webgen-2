import { api } from "@/trpc/server";

export async function GET() {
  await api.sandbox.cron();
  return Response.json({ ok: true });
}
