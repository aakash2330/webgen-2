import { createTRPCRouter, publicProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany();
    return projects;
  }),
});
