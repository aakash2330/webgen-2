import { api } from "@/trpc/server";

export async function GET() {
  return await api.sandbox.cron();
}
