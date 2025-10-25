import { db } from "@webgen/db";
import { tool } from "ai";
import z from "zod";
import { writeFileToSandbox } from "@webgen/sandbox/utils";
import Sandbox from "@e2b/code-interpreter";
import { REMOTE_PROJECT_DIR } from "@webgen/sandbox";
import { getTextObject, projectKey, putTextObject } from "../s3";

const removeDependencySchema = z.object({
  package: z.string().describe("package name to remove"),
});

type RemoveDependencyInput = z.infer<typeof removeDependencySchema>;

async function ensureSandbox(projectId: string) {
  const sandbox = await db.sandbox.findUnique({ where: { projectId } });
  if (!sandbox) throw new Error("no sandbox found");
  return sandbox;
}

export function getRemoveDependencyTool(projectId: string) {
  return {
    "webgen-remove-dependency": tool({
      description:
        "Uninstall a dependency from the sandbox project and update package.json.",
      inputSchema: removeDependencySchema,
      execute: async (params) => removeDependency({ ...params, projectId }),
    }),
  };
}

export async function removeDependency({
  package: pkg,
  projectId,
}: RemoveDependencyInput & { projectId: string }) {
  const key = projectKey(projectId, "package.json");
  let current: string;
  try {
    current = await getTextObject(key);
  } catch {
    throw new Error("package.json not found in S3 for this project");
  }
  let json: any;
  try {
    json = JSON.parse(current);
  } catch {
    throw new Error("package.json is not valid JSON");
  }
  if (json.dependencies && json.dependencies[pkg]) {
    delete json.dependencies[pkg];
  }
  if (json.devDependencies && json.devDependencies[pkg]) {
    delete json.devDependencies[pkg];
  }
  const updated = JSON.stringify(json, null, 2);

  await putTextObject(key, updated);

  const sandbox = await ensureSandbox(projectId);
  await writeFileToSandbox(sandbox.id, "package.json", updated);

  try {
    const sbx = await Sandbox.connect(sandbox.id);
    await sbx.commands.run(
      `bash -lc "npm uninstall ${pkg} --no-fund --no-audit"`,
      { cwd: REMOTE_PROJECT_DIR },
    );
  } catch (err) {
    console.warn(
      "Dependency uninstall failed in sandbox (DB remains updated):",
      err,
    );
  }

  return { success: true } as const;
}
