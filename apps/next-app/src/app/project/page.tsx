import { api } from "@/trpc/server";
import { ProjectPageContent } from "./_components/sandbox";
import ChatSection from "./_components/chat";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const projectId = params.id;
  if (!projectId) {
    return <div>No Project Id</div>;
  }
  const project = await api.project.get({ projectId: projectId as string });
  if (!project) {
    return <div>Invalid Project Id</div>;
  }
  return (
    <div className="flex gap-8">
      <ChatSection projectId={projectId as string}></ChatSection>
      <ProjectPageContent project={project} />;
    </div>
  );
}
