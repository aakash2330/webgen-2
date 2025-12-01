"use server";

import { cookies } from "next/headers";
import { api } from "@/trpc/server";

export async function setAuthCookies(token: string, user: unknown) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  cookieStore.set("user", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function signInAction(username: string, password: string) {
  const result = await api.user.signin({ username, password });
  await setAuthCookies(result.token, result.user);
  return result;
}

export async function signUpAction(username: string, password: string) {
  const result = await api.user.signup({ username, password });
  await setAuthCookies(result.token, result.user);
  return result;
}

