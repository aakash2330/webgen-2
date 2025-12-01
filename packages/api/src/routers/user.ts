import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = process.env.JWT_SECRET || "S3CR3T";

export const userRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          username: input.username,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return {
        user,
        token,
      };
    }),

  signin: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find user by username
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };
    }),

  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
});
