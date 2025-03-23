import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <main className="container mx-auto py-8 px-4">Data Desktop</main>
    </>
  );
}
