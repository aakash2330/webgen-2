import { Sandbox } from "@webgen/db";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { SandboxManager } from "@webgen/sandbox";
import { updateSandboxStatus } from "@webgen/sandbox/cron";
import z from "zod";

export const sandboxRouter = createTRPCRouter({
  cron: publicProcedure.query(async () => {
    await updateSandboxStatus();
  }),
  connect: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const E2B_API_KEY = process.env.E2B_API_KEY;
      if (!E2B_API_KEY) {
        throw "E2B_API_KEY is not set.";
      }
      const sandboxManager = new SandboxManager(input.projectId, E2B_API_KEY);
      const sandbox: Sandbox = await sandboxManager.initializeSandbox();
      return sandbox;
    }),
});
