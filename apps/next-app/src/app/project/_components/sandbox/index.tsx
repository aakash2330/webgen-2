"use client";

import { api } from "@/trpc/react";
import { useSearchParams } from "next/navigation";
import { OrbitProgress } from "react-loading-indicators";

export function ProjectPageSandbox() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  if (!projectId) {
    return <div>Project Not Found</div>;
  }

  // initialize sandbox
  const { data, isPending } = api.sandbox.connect.useQuery({
    projectId,
  });
  if (isPending) {
    return <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />;
  }
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-semibold">Embedded React App</h1>
      <iframe
        src={`https://${data?.url}`}
        title="React App"
        className="h-screen w-[50vw] rounded-lg border shadow"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
