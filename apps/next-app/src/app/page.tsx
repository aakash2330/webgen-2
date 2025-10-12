import { api, HydrateClient } from "../trpc/server";

export default async function Home() {
  const projects = await api.project.list();
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center text-white">
        {projects.map((p) => {
          return p.id;
        })}
      </main>
    </HydrateClient>
  );
}
