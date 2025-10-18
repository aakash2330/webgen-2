import { api, HydrateClient } from "../trpc/server";
import { CreateProject } from "./_components/projects/CreateProject";

export default async function Home() {
  const projects = await api.project.list();
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <CreateProject></CreateProject>
        {projects.map((p) => {
          return p.id;
        })}
      </main>
    </HydrateClient>
  );
}
