"use client";

export default function Page() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-semibold">Embedded React App</h1>
      <iframe
        src="https://5173-i1jj0ernzkia5uwd1r1sw.e2b.app"
        title="React App"
        className="h-[80vh] w-[90vw] rounded-lg border shadow"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
