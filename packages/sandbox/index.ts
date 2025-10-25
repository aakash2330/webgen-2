import Sandbox from "@e2b/code-interpreter";
import type { Sandbox as DbSandbox } from "@webgen/db";
import path from "node:path";
import {
  collectLocalFiles,
  filesToDbRecords,
  filesToSandboxPayload,
  getPublicURL,
  runInBackground,
} from "./utils";
import { db, SandboxStatus } from "@webgen/db";
import { deleteFolder } from "./s3/delete";
import { copyFolder } from "./s3/copy";

const TIMEOUT_MS = 60000 * 30;
export const REMOTE_PROJECT_DIR = "/home/user/e2b-react";

const PROJECT_DIR = path.resolve(
  process.cwd(),
  "../../packages/sandbox/e2b-react",
);
const PORT = 5173;

export class SandboxManager {
  private sbx: Sandbox | undefined = undefined;
  private projectId: string;
  private sandboxId: string | undefined = undefined;
  private apiKey: string;

  constructor(projectId: string, apiKey: string) {
    this.projectId = projectId;
    this.apiKey = apiKey;
  }

  public async initializeSandbox(): Promise<DbSandbox> {
    const existingSandbox = await db.sandbox.findUnique({
      where: { projectId: this.projectId },
    });
    if (!existingSandbox) {
      const sandbox = await this.createNewSandbox();
      await this.uploadFiles();
      return sandbox;
    }
    if (existingSandbox.status === SandboxStatus.FAILED) {
      const sandbox = await this.createNewSandbox();
      await this.uploadFiles();
      return sandbox;
    }
    if (
      existingSandbox.status === SandboxStatus.PENDING ||
      existingSandbox.status === SandboxStatus.RUNNING
    ) {
      return existingSandbox;
    }
    if (existingSandbox.status === SandboxStatus.KILLED) {
      await this.deleteSandbox(existingSandbox.id);
      const sandbox = await this.createNewSandbox();
      await this.uploadFiles();
      return sandbox;
    }
    if (existingSandbox.status === SandboxStatus.PAUSED) {
      return this.resumeSandbox(existingSandbox.id);
    }

    return existingSandbox;
  }

  public async resumeSandbox(sandboxId: string) {
    this.sbx = await Sandbox.connect(sandboxId);
    const sandbox = await db.sandbox.update({
      where: { id: sandboxId },
      data: {
        status: SandboxStatus.RUNNING,
      },
    });
    return sandbox;
  }

  public async deleteSandbox(sandboxId: string) {
    await db.sandbox.delete({
      where: { id: sandboxId },
    });
  }

  public async createNewSandbox(): Promise<DbSandbox> {
    try {
      this.sbx = await Sandbox.betaCreate({
        // will auto pause the sandbox after 10 mins
        autoPause: true,
        apiKey: this.apiKey,
      });

      console.log("Waiting for public URL...");
      const url = await getPublicURL(this.sbx, PORT);
      console.log("Public URL:", url);

      const sandbox = await db.sandbox.create({
        data: {
          id: this.sbx.sandboxId,
          url,
          status: SandboxStatus.PENDING,
          projectId: this.projectId,
        },
      });
      if (!sandbox) {
        throw new Error("couldn't create a sandbox");
      }
      this.sandboxId = sandbox.id;
      return sandbox;
    } catch (error) {
      console.error({ error });
      await this.sbx?.kill();
      this.sbx = undefined;
      throw error;
    }
  }

  public async uploadFiles() {
    try {
      console.log("Uploading project to sandbox...");
      if (!this.sbx) {
        throw "no sandbox";
      }
      console.log(`Using local project dir: ${PROJECT_DIR}`);
      const files = await collectLocalFiles(PROJECT_DIR);
      if (files.length === 0)
        throw new Error("No files to upload from e2b-react");
      await this.sbx.files.write(filesToSandboxPayload(files));

      console.log("Installing dependencies in sandbox...");
      await this.sbx.commands.run('bash -lc "npm i --no-fund --no-audit"', {
        cwd: REMOTE_PROJECT_DIR,
      });

      console.log("Starting Vite dev server in background...");
      runInBackground(
        this.sbx,
        `bash -lc "nohup npm run dev -- --host 0.0.0.0 --port 5173 > server.log 2>&1 &"`,
        REMOTE_PROJECT_DIR,
      );
      console.log("process started");
      console.log("Persisting project files to database...");
      //delete old folder
      await deleteFolder(this.projectId);
      await copyFolder("webgen-react", "react-base/", this.projectId);
      //create new folder

      await db.sandbox.update({
        where: { id: this.sandboxId },
        data: {
          status: SandboxStatus.RUNNING,
        },
      });
    } catch (error) {
      console.error({ error });
      await db.sandbox.update({
        where: { id: this.sandboxId },
        data: {
          status: SandboxStatus.FAILED,
        },
      });
    }
  }
}
