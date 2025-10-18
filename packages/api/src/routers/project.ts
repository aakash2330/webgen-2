import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { SandboxManager } from "@webgen/sandbox";

export const projectRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany();
    return projects;
  }),
  get: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: { sandbox: true },
      });
      return project;
    }),
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          userId: ctx.user.id,
        },
      });

      const E2B_API_KEY = process.env.E2B_API_KEY;
      if (!E2B_API_KEY) {
        throw "E2B_API_KEY is not set.";
      }

      const sandboxManager = new SandboxManager(project.id, E2B_API_KEY);
      await sandboxManager.initializeSandbox();
      await sandboxManager.uploadFiles();

      return project;
    }),
});
