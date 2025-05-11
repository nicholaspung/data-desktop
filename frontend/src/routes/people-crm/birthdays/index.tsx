// frontend/src/routes/people-crm/birthdays/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { PEOPLE_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Gift, Calendar, Bell, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { format, differenceInDays, addYears } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/people-crm/birthdays/")({
  component: BirthdaysList,
});

function BirthdaysList() {
  const people = useStore(dataStore, (state) => state.people);
  const birthdayReminders = useStore(
    dataStore,
    (state) => state.birthday_reminders
  );
  const isPeopleLoading = useStore(loadingStore, (state) => state.people);
  const isRemindersLoading = useStore(
    loadingStore,
    (state) => state.birthday_reminders
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Get people with birthdays
  const peopleWithBirthdays = people.filter((person) => person.birthday);

  // Calculate next birthday for each person
  const enrichedPeople = peopleWithBirthdays.map((person) => {
    const birthday = new Date(person.birthday!);
    const now = new Date();

    // Get this year's birthday
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

    // Check if there's a reminder set for this person
    const reminder = birthdayReminders.find((r) => r.person_id === person.id);

    return {
      ...person,
      nextBirthday,
      daysUntil,
      age,
      reminder,
    };
  });

  // Filter based on search
  const filteredPeople = enrichedPeople.filter((person) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      person.name.toLowerCase().includes(searchLower) ||
      person.email?.toLowerCase().includes(searchLower)
    );
  });

  // Categorize birthdays
  const today = filteredPeople.filter((p) => p.daysUntil === 0);
  const tomorrow = filteredPeople.filter((p) => p.daysUntil === 1);
  const upcoming7Days = filteredPeople.filter(
    (p) => p.daysUntil > 1 && p.daysUntil <= 7
  );
  const upcoming30Days = filteredPeople.filter(
    (p) => p.daysUntil > 7 && p.daysUntil <= 30
  );
  const laterBirthdays = filteredPeople.filter((p) => p.daysUntil > 30);

  // Sort each category by days until birthday
  const sortByDaysUntil = (
    a: (typeof enrichedPeople)[0],
    b: (typeof enrichedPeople)[0]
  ) => a.daysUntil - b.daysUntil;

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

  const PersonBirthdayCard = ({
    person,
  }: {
    person: (typeof enrichedPeople)[0];
  }) => (
    <ReusableCard
      content={
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(person.birthday!, "MMMM d")}
                    </div>
                    <span>Turning {person.age}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm font-medium">
                  {person.daysUntil === 0
                    ? "Today!"
                    : person.daysUntil === 1
                      ? "Tomorrow"
                      : `In ${person.daysUntil} days`}
                </div>
                {getBirthdayBadge(person.daysUntil)}

                {person.reminder && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bell className="h-3 w-3" />
                    Reminder set
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Link
              to={`/people-crm/people/$personId`}
              params={{ personId: person.id }}
            >
              <Button variant="outline" size="sm">
                <User className="h-3 w-3 mr-1" />
                View Profile
              </Button>
            </Link>
            {!person.reminder && (
              <Link
                to={`/people-crm/birthday-reminders/add`}
                params={{ personId: person.id }}
              >
                <Button variant="outline" size="sm">
                  <Bell className="h-3 w-3 mr-1" />
                  Set Reminder
                </Button>
              </Link>
            )}
          </div>
        </div>
      }
    />
  );

  const isLoading = isPeopleLoading || isRemindersLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Birthdays
          </h1>
          <p className="text-muted-foreground mt-1">
            Keep track of important dates in your network
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={PEOPLE_FIELD_DEFINITIONS.fields}
            datasetId="people"
            title="People"
          />
          <Link to="/people-crm/birthday-reminders">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Manage Reminders
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ReusableCard
          content={
            <div className="text-center">
              <div className="text-2xl font-bold">{today.length}</div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
          }
        />
        <ReusableCard
          content={
            <div className="text-center">
              <div className="text-2xl font-bold">{tomorrow.length}</div>
              <div className="text-sm text-muted-foreground">Tomorrow</div>
            </div>
          }
        />
        <ReusableCard
          content={
            <div className="text-center">
              <div className="text-2xl font-bold">{upcoming7Days.length}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
          }
        />
        <ReusableCard
          content={
            <div className="text-center">
              <div className="text-2xl font-bold">{upcoming30Days.length}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
          }
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search birthdays..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Birthday Categories */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading birthdays...</p>
        </div>
      ) : filteredPeople.length > 0 ? (
        <div className="space-y-8">
          {/* Today's Birthdays */}
          {today.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                🎉 Today's Birthdays
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {today.sort(sortByDaysUntil).map((person) => (
                  <PersonBirthdayCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Birthdays */}
          {tomorrow.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tomorrow's Birthdays</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tomorrow.sort(sortByDaysUntil).map((person) => (
                  <PersonBirthdayCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          )}

          {/* This Week */}
          {upcoming7Days.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">This Week</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming7Days.sort(sortByDaysUntil).map((person) => (
                  <PersonBirthdayCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          )}

          {/* This Month */}
          {upcoming30Days.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">This Month</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming30Days.sort(sortByDaysUntil).map((person) => (
                  <PersonBirthdayCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          )}

          {/* Later This Year */}
          {laterBirthdays.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Later This Year</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {laterBirthdays.sort(sortByDaysUntil).map((person) => (
                  <PersonBirthdayCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No birthdays found matching your search"
                  : "No birthdays set yet"}
              </p>
              <Link to="/people-crm/people">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add People with Birthdays
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
