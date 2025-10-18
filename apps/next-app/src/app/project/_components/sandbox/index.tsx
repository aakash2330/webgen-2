"use client";

import { type Sandbox, type Project } from "@webgen/db";

export function ProjectPageContent({
  project,
}: {
  project: Project & { sandbox: Sandbox | null };
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-semibold">Embedded React App</h1>
      <iframe
        src={`https://${project.sandbox?.url}`}
        title="React App"
        className="h-screen w-[50vw] rounded-lg border shadow"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
