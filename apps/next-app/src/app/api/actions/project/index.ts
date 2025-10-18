"use server";

import { api } from "@/trpc/server";
import _ from "lodash";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const name = formData.get("projectName") as string;
  if (_.isEmpty(name)) {
    throw new Error("No project name given");
  }
  const project = await api.project.create({ name });
  redirect(`/project?id=${project.id}`);
}
