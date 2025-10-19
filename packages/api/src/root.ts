import { chatRouter } from "./routers/chat/chat";
import { projectRouter } from "./routers/project";
import { sandboxRouter } from "./routers/sandbox";
import { userRouter } from "./routers/user";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
  chat: chatRouter,
  sandbox: sandboxRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
