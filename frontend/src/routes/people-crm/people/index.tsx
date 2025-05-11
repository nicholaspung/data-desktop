// frontend/src/routes/people-crm/people/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { PEOPLE_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Users, MapPin, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { Person } from "@/store/people-crm-definitions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/people-crm/people/")({
  component: PeopleList,
});

function PeopleList() {
  const people = useStore(dataStore, (state) => state.people);
  const isLoading = useStore(loadingStore, (state) => state.people);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extract all unique tags
  const allTags = people
    .reduce((tags: string[], person) => {
      if (person.tags) {
        const personTags = person.tags.split(",").map((tag) => tag.trim());
        personTags.forEach((tag) => {
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }
      return tags;
    }, [])
    .sort();

  // Filter people based on search and tags
  const filteredPeople = people.filter((person) => {
    const matchesSearch =
      searchQuery === "" ||
      person.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) =>
        person.tags
          ?.split(",")
          .map((t) => t.trim())
          .includes(tag)
      );

    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const PersonCard = ({ person }: { person: Person }) => (
    <Link to={`/people-crm/people/$personId`} params={{ personId: person.id }}>
      <ReusableCard
        cardClassName="hover:border-primary/50 transition-colors cursor-pointer"
        content={
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                  {person.employment_history && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {person.employment_history.split("\n")[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {person.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {person.address}
                </div>
              )}
              {person.first_met_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Met: {format(person.first_met_date, "MMM yyyy")}
                </div>
              )}
            </div>

            {person.tags && (
              <div className="flex flex-wrap gap-1">
                {person.tags.split(",").map((tag) => (
                  <Badge
                    key={tag.trim()}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
              <span>
                Added: {new Date(person.createdAt).toLocaleDateString()}
              </span>
              {person.birthday && (
                <span>
                  Birthday:{" "}
                  {new Date(person.birthday).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        }
      />
    </Link>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            People
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your contacts and relationships
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={PEOPLE_FIELD_DEFINITIONS.fields}
            datasetId="people"
            title="People"
          />
          <Link to="/people-crm/people/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Tags:
            </span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* People List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading people...</p>
        </div>
      ) : filteredPeople.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTags.length > 0
                  ? "No people found matching your search"
                  : "No people added yet"}
              </p>
              <Link to="/people-crm/people/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Person
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}

export default PeopleList;
