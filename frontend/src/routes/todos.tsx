// frontend/src/routes/todos.tsx
import { createFileRoute } from "@tanstack/react-router";
import {
  FeatureHeader,
  FeatureLayout,
  HelpSidebar,
} from "@/components/layout/feature-layout";
import { CompactInfoPanel } from "@/components/reusable/info-panel";
import TodoList from "@/features/todos/todo-list";
import AddTodoButton from "@/features/todos/add-todo-button";

export const Route = createFileRoute("/todos")({
  component: TodosPage,
});

// Define the guide content sections
const todosGuideContent = [
  {
    title: "Getting Started",
    content: `
## Understanding Todos with Deadlines

The Todos feature helps you:

- Create tasks with specific deadlines
- Track progress on your todos
- Get alerted when deadlines are approaching or have passed
- Connect todos with metrics to measure your work

Use this feature to stay on top of important tasks and ensure you're making progress on your goals.
    `,
  },
  {
    title: "Creating Todos",
    content: `
## Setting Up Effective Todos

To create a well-defined todo:

1. Give it a clear, specific title
2. Set a realistic deadline
3. Assign an appropriate priority level
4. Add descriptive tags for organization
5. Optionally connect it to a tracking metric
6. Set a reminder date if needed

The more detailed your todo, the easier it will be to track and complete.
    `,
  },
  {
    title: "Tracking Progress",
    content: `
## Monitoring Your Todos

The Todos feature provides several ways to track your progress:

- Filter todos by status (All, Active, Overdue, Completed)
- View deadline status with visual indicators
- Track metrics related to todo completion
- See your history of deadline extensions
- Receive alerts for overdue items

Regularly review your todos to stay on track with your commitments.
    `,
  },
  {
    title: "Handling Overdue Todos",
    content: `
## Managing Missed Deadlines

When a todo becomes overdue:

1. You'll receive an alert notification
2. The todo will be highlighted in the Overdue tab
3. You can extend the deadline with a new date
4. Add a reason for the extension if desired
5. Previous deadlines are tracked in the todo history

This approach helps you learn from missed deadlines while still making progress on important tasks.
    `,
  },
];

function TodosPage() {
  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Todos & Deadlines"
          description="Track tasks with deadlines and stay on top of your commitments"
          guideContent={todosGuideContent}
          storageKey="todos-page"
        >
          <AddTodoButton />
        </FeatureHeader>
      }
      sidebar={
        <HelpSidebar title="About Todos">
          <CompactInfoPanel
            title="Todo Overview"
            variant="info"
            storageKey="todos-overview"
          >
            Todos help you track tasks with specific deadlines. You'll receive
            alerts when deadlines approach or pass, and you can extend deadlines
            if needed. Each todo can also track your progress through associated
            metrics.
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Deadline Management"
            variant="tip"
            storageKey="todos-deadlines"
          >
            <ul className="mt-2 space-y-1">
              <li>• Create realistic deadlines for better success</li>
              <li>• Receive alerts for approaching deadlines</li>
              <li>• Extend deadlines if needed with documented reasons</li>
              <li>• Track your history of deadline changes</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Progress Tracking"
            variant="info"
            storageKey="todos-progress"
          >
            <ul className="mt-2 space-y-1">
              <li>• Link todos to metrics for detailed tracking</li>
              <li>• Choose between completion or time tracking</li>
              <li>• View progress in the metrics dashboard</li>
              <li>• Set goals to measure your success</li>
            </ul>
          </CompactInfoPanel>

          <CompactInfoPanel
            title="Organization Tips"
            variant="tip"
            storageKey="todos-organization"
          >
            <ul className="mt-2 space-y-1">
              <li>• Use priorities to focus on what matters most</li>
              <li>• Add tags to group related todos</li>
              <li>• Set reminders for important deadlines</li>
              <li>• Use the filters to focus on specific todos</li>
            </ul>
          </CompactInfoPanel>
        </HelpSidebar>
      }
      sidebarPosition="right"
    >
      <TodoList />
    </FeatureLayout>
  );
}
