import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

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
      return project;
    }),
});
