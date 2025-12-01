import Sandbox from "@e2b/code-interpreter";
import type { Sandbox as DbSandbox } from "@webgen/db";
import fs from "fs";
import { getPublicURL, runInBackground } from "./utils";
import { db, SandboxStatus } from "@webgen/db";
import { getPreSignedUrl } from "./s3/getSignedUrl";
import path from "path";
import { deleteFolder } from "./s3/delete";
import { copyFolder } from "./s3/copy";

export const REMOTE_PROJECT_DIR = "/home/user/e2b-react";
const PROJECT_DIR = path.resolve(process.cwd(), "../../packages/sandbox");

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
      // get base zip signed url
      const url = await getPreSignedUrl({
        bucketName: "webgen-react",
        path: "react-base.zip",
      });
      const scriptPath = path.resolve(PROJECT_DIR, "./s3/download.js");
      const scriptContent = fs.readFileSync(scriptPath, "utf-8");

      await this.sbx.files.write(
        `${REMOTE_PROJECT_DIR}/download.js`,
        scriptContent,
      );

      await this.sbx.commands.run(`bash -lc "node download.js '${url}'"`, {
        cwd: REMOTE_PROJECT_DIR,
      });

      // unzip the downloaded archive into project directory
      await this.sbx.commands.run('bash -lc "unzip -o react-base.zip -d ."', {
        cwd: REMOTE_PROJECT_DIR,
      });

      console.log("Installing dependencies in sandbox...");
      await this.sbx.commands.run('bash -lc "npm i --no-fund --no-audit"', {
        cwd: path.resolve(REMOTE_PROJECT_DIR, "./react-base"),
      });

      console.log("Starting Vite dev server in background...");
      runInBackground(
        this.sbx,
        `bash -lc "nohup npm run dev -- --host 0.0.0.0 --port 5173 > server.log 2>&1 &"`,
        path.resolve(REMOTE_PROJECT_DIR, "./react-base"),
      );
      console.log("process started");
      console.log("Persisting project files to database...");

      //delete old folder
      await deleteFolder(this.projectId);
      //create new folder
      await copyFolder("webgen-react", "react-base/", `${this.projectId}/`);

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
