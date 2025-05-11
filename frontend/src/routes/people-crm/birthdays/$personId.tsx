// frontend/src/routes/people-crm/birthdays/$personId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Person } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Gift,
  Calendar,
  User,
  Bell,
  PartyPopper,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import { format, differenceInDays, addYears } from "date-fns";
import { ApiService } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface BirthdayParams {
  personId: string;
}

export const Route = createFileRoute("/people-crm/birthdays/$personId")({
  component: BirthdayDetail,
});

function BirthdayDetail() {
  const { personId } = Route.useParams() as BirthdayParams;
  const people = useStore(dataStore, (state) => state.people);
  const birthdayReminders = useStore(
    dataStore,
    (state) => state.birthday_reminders
  );

  const [person, setPerson] = useState<Person | null>(null);

  useEffect(() => {
    const foundPerson = people.find((p) => p.id === personId);
    if (foundPerson) {
      setPerson(foundPerson);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(personId).then((data) => {
        if (data) {
          setPerson(data as Person);
        }
      });
    }
  }, [personId, people]);

  if (!person) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading person details...</p>
      </div>
    );
  }

  if (!person.birthday) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/people-crm/birthdays">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{person.name}'s Birthday</h1>
          </div>
        </div>

        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                No birthday set for {person.name}
              </p>
              <Link
                to={`/people-crm/people/$personId/edit`}
                params={{ personId: personId }}
              >
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Edit Contact to Add Birthday
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  // Calculate next birthday
  const birthday = new Date(person.birthday);
  const now = new Date();
  let nextBirthday = new Date(
    now.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  // If birthday has passed this year, use next year's date
  if (nextBirthday < now) {
    nextBirthday = addYears(nextBirthday, 1);
  }

  const daysUntil = differenceInDays(nextBirthday, now);
  const age = nextBirthday.getFullYear() - birthday.getFullYear();

  // Check for existing reminder
  const reminder = birthdayReminders.find((r) => r.person_id === person.id);

  // Calculate previous birthdays (last 5 years)
  const previousBirthdays = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - i - 1;
    return {
      year,
      date: new Date(year, birthday.getMonth(), birthday.getDate()),
      age: year - birthday.getFullYear(),
    };
  });

  // Calculate upcoming milestones
  const milestones = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100]
    .filter((milestone) => milestone > age)
    .slice(0, 3)
    .map((milestone) => ({
      age: milestone,
      year: birthday.getFullYear() + milestone,
      date: new Date(
        birthday.getFullYear() + milestone,
        birthday.getMonth(),
        birthday.getDate()
      ),
    }));

  const getBirthdayBadge = (daysUntil: number) => {
    if (daysUntil === 0) {
      return <Badge className="bg-green-500 text-white">Today!</Badge>;
    } else if (daysUntil === 1) {
      return <Badge className="bg-orange-500 text-white">Tomorrow</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="bg-blue-500 text-white">This Week</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge className="bg-purple-500 text-white">This Month</Badge>;
    }
    return null;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/people-crm/birthdays">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {daysUntil === 0 ? (
                <PartyPopper className="h-8 w-8 text-primary" />
              ) : (
                <Gift className="h-8 w-8" />
              )}
              {person.name}'s Birthday
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(birthday, "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/people-crm/people/$personId`}
            params={{ personId: personId }}
          >
            <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </Link>
          {!reminder && (
            <Link
              to={`/people-crm/birthday-reminders/add`}
              params={{ personId: personId }}
            >
              <Button>
                <Bell className="h-4 w-4 mr-2" />
                Set Reminder
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Next Birthday Info */}
      <ReusableCard
        content={
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-4">
              <div className="text-6xl font-bold text-primary">{age}</div>
              <div className="text-left">
                <div className="text-sm text-muted-foreground">Turning</div>
                <div className="font-semibold">
                  on {format(nextBirthday, "MMMM d, yyyy")}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {getBirthdayBadge(daysUntil)}
              <span className="text-lg font-medium">
                {daysUntil === 0
                  ? "Today!"
                  : daysUntil === 1
                    ? "Tomorrow"
                    : `In ${daysUntil} days`}
              </span>
            </div>

            {reminder && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                  <Bell className="h-4 w-4" />
                  <span>
                    Reminder set for {format(reminder.reminder_date, "MMMM d")}
                  </span>
                  <span>({reminder.advance_days} days before)</span>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previous Birthdays */}
        <ReusableCard
          title="Previous Birthdays"
          content={
            <div className="space-y-3">
              {previousBirthdays.map((birthday) => (
                <div
                  key={birthday.year}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">{birthday.year}</div>
                    <div className="text-sm text-muted-foreground">
                      Turned {birthday.age}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(birthday.date, "MMMM d")}
                  </div>
                </div>
              ))}
            </div>
          }
        />

        {/* Upcoming Milestones */}
        <ReusableCard
          title="Upcoming Milestones"
          content={
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.age}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium text-lg">{milestone.age}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(milestone.date, "MMMM d, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 dark:bg-purple-950"
                    >
                      {daysUntil === 0 && age === milestone.age
                        ? "Today!"
                        : `In ${differenceInDays(milestone.date, now)} days`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>

      {/* Quick Actions */}
      <ReusableCard
        title="Quick Actions"
        content={
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/people-crm/meetings/add`}
              params={{ personId: personId }}
            >
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Birthday Celebration
              </Button>
            </Link>
            <Link to={`/people-crm/notes/add`} params={{ personId: personId }}>
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                Add Birthday Note
              </Button>
            </Link>
            <Link
              to={`/people-crm/people/$personId/edit`}
              params={{ personId: personId }}
            >
              <Button variant="outline">
                <Gift className="h-4 w-4 mr-2" />
                Edit Birthday Date
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
