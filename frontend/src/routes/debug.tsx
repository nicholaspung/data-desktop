// src/routes/debug.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatabaseTester from "@/components/debug/database-tester";
import RelationDebugger from "@/components/debug/relation-debugger";

export const Route = createFileRoute("/debug")({
  component: DebugPage,
  // Only show this route in development mode
  beforeLoad: ({ navigate }) => {
    if (!import.meta.env.DEV) {
      // Redirect to home or 404 in production
      return navigate({ to: "/" });
    }
  },
});

function DebugPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Developer Tools</h1>

      <Tabs defaultValue="relation-debugger">
        <TabsList>
          <TabsTrigger value="relation-debugger">Relation Debugger</TabsTrigger>
          <TabsTrigger value="database-tester">Database Tester</TabsTrigger>
        </TabsList>

        <TabsContent value="relation-debugger">
          <RelationDebugger />
        </TabsContent>

        <TabsContent value="database-tester">
          <DatabaseTester />
        </TabsContent>
      </Tabs>
    </div>
  );
}
