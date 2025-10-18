"use server";

import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const name = formData.get("projectName") as string;
  const project = await api.project.create({ name });
  redirect(`/project?id=${project.id}`);
}
