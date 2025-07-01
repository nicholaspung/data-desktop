import React from "react";
import QuickAddPerson from "./quick-add-person";
import QuickAddMeeting from "./quick-add-meeting";
import RecentEntries from "./recent-entries";
import ReusableCard from "@/components/reusable/reusable-card";
import { Users, Calendar, Activity } from "lucide-react";

interface QuickActionsProps {
  onShowDetail: (type: string, id: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onShowDetail }) => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold mb-2">Quick Actions</h2>
        <p className="text-muted-foreground">
          Add new entries and view your recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column - Add Forms */}
        <div className="space-y-6">
          <ReusableCard
            title={
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Add Person</span>
              </div>
            }
            description={
              <p className="text-sm text-muted-foreground mt-1">
                Create a new contact in your CRM
              </p>
            }
            content={<QuickAddPerson />}
          />

          <ReusableCard
            title={
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Add Meeting</span>
              </div>
            }
            description={
              <p className="text-sm text-muted-foreground mt-1">
                Record a new meeting or interaction
              </p>
            }
            content={<QuickAddMeeting />}
          />
        </div>

        {/* Right Column - Recent Entries */}
        <div>
          <ReusableCard
            title={
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </div>
            }
            description={
              <p className="text-sm text-muted-foreground mt-1">
                Latest additions to your CRM
              </p>
            }
            content={<RecentEntries onShowDetail={onShowDetail} />}
          />
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Use the tabs above to explore more features like notes, attributes,
          and birthdays
        </p>
      </div>
    </div>
  );
};

export default QuickActions;
