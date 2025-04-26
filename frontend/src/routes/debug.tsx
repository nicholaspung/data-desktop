import { createFileRoute } from "@tanstack/react-router";
import DatabaseTester from "@/components/debug/database-tester";
import RelationDebugger from "@/components/debug/relation-debugger";
import ReusableTabs from "@/components/reusable/reusable-tabs";

export const Route = createFileRoute("/debug")({
  component: DebugPage,
  beforeLoad: ({ navigate }) => {
    if (!import.meta.env.DEV) {
      return navigate({ to: "/" });
    }
  },
});

function DebugPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Developer Tools</h1>
      <ReusableTabs
        tabs={[
          {
            id: "relation-debugger",
            label: "Relation Debugger",
            content: <RelationDebugger />,
          },
          {
            id: "database-tester",
            label: "Database Tester",
            content: <DatabaseTester />,
          },
        ]}
        defaultTabId="relation-debugger"
        className="w-full"
        tabsListClassName="w-full grid grid-cols-2"
      />
    </div>
  );
}
