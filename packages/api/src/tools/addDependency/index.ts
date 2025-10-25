import { db } from "@webgen/db";
import { tool } from "ai";
import z from "zod";
import { writeFileToSandbox } from "@webgen/sandbox/utils";
import Sandbox from "@e2b/code-interpreter";
import { REMOTE_PROJECT_DIR } from "@webgen/sandbox";
import { getTextObject, projectKey, putTextObject } from "../s3";

const addDependencySchema = z.object({
  package: z.string().describe("e.g. lodash@latest or lodash"),
});

type AddDependencyInput = z.infer<typeof addDependencySchema>;

async function ensureSandbox(projectId: string) {
  const sandbox = await db.sandbox.findUnique({ where: { projectId } });
  if (!sandbox) throw new Error("no sandbox found");
  return sandbox;
}

export function getAddDependencyTool(projectId: string) {
  return {
    "webgen-add-dependency": tool({
      description:
        "Use this tool to add a dependency to the sandbox project and update package.json.",
      inputSchema: addDependencySchema,
      execute: async (params) => addDependency({ ...params, projectId }),
    }),
  };
}

export async function addDependency({
  package: pkg,
  projectId,
}: AddDependencyInput & { projectId: string }) {
  const key = projectKey(projectId, "package.json");
  let current: string;
  try {
    current = await getTextObject(key);
  } catch {
    throw new Error("package.json not found in S3 for this project");
  }

  const nameVersion = pkg.trim();
  let name: string;
  let version: string;
  const at = nameVersion.lastIndexOf("@");
  if (at > 0) {
    name = nameVersion.slice(0, at).trim();
    version = nameVersion.slice(at + 1).trim() || "latest";
  } else {
    name = nameVersion;
    version = "latest";
  }
  if (!name) throw new Error("invalid package name");

  let json: any;
  try {
    json = JSON.parse(current);
  } catch {
    throw new Error("package.json is not valid JSON");
  }
  if (!json.dependencies) json.dependencies = {} as Record<string, string>;
  (json.dependencies as Record<string, string>)[name] = version;
  const updated = JSON.stringify(json, null, 2);

  await putTextObject(key, updated);

  const sandbox = await ensureSandbox(projectId);
  await writeFileToSandbox(sandbox.id, "package.json", updated);

  try {
    const sbx = await Sandbox.connect(sandbox.id);
    await sbx.commands.run('bash -lc "npm i --no-fund --no-audit"', {
      cwd: REMOTE_PROJECT_DIR,
    });
  } catch (err) {
    console.warn(
      "Dependency install failed in sandbox (DB remains updated):",
      err,
    );
  }

  return { success: true } as const;
}
