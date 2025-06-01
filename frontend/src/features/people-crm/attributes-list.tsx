import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { PERSON_ATTRIBUTES_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Input } from "@/components/ui/input";
import { Search, Tag, User, Calendar } from "lucide-react";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { PersonAttribute } from "@/store/people-crm-definitions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import AddAttributeButton from "@/features/people-crm/add-attribute-button";

interface PersonAttributesListProps {
  onShowDetail?: (type: string, id: string) => void;
}

export default function PersonAttributesList({
  onShowDetail,
}: PersonAttributesListProps) {
  const attributes = useStore(dataStore, (state) => state.person_attributes);
  const isLoading = useStore(loadingStore, (state) => state.person_attributes);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttributes = attributes.filter((attribute) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      attribute.attribute_name.toLowerCase().includes(searchLower) ||
      attribute.attribute_value.toLowerCase().includes(searchLower) ||
      attribute.person_id_data?.name.toLowerCase().includes(searchLower) ||
      attribute.category?.toLowerCase().includes(searchLower)
    );
  });

  const sortedAttributes = filteredAttributes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "preferences":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hobbies":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "skills":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "allergies":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "dietary":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const PersonAttributeCard = ({
    attribute,
  }: {
    attribute: PersonAttribute;
  }) => (
    <div onClick={() => onShowDetail?.("attribute", attribute.id)}>
      <ReusableCard
        cardClassName="hover:border-primary/50 transition-colors cursor-pointer"
        content={
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {attribute.attribute_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {attribute.person_id_data?.name || "Unknown"}
                      </div>
                      {attribute.learned_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(attribute.learned_date, "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {attribute.category && (
                    <Badge
                      className={`${getCategoryColor(attribute.category)}`}
                    >
                      {attribute.category}
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">
                  {attribute.attribute_value}
                </p>

                {attribute.source && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: {attribute.source}
                  </p>
                )}
              </div>
            </div>
          </div>
        }
      />
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Person Attributes
          </h1>
          <p className="text-muted-foreground mt-1">
            Track various attributes and facts about people
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={PERSON_ATTRIBUTES_FIELD_DEFINITIONS.fields}
            datasetId="person_attributes"
            title="Attributes"
          />
          <AddAttributeButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search attributes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Attributes List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading attributes...</p>
        </div>
      ) : sortedAttributes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedAttributes.map((attribute) => (
            <PersonAttributeCard key={attribute.id} attribute={attribute} />
          ))}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No attributes found matching your search"
                  : "No attributes recorded yet"}
              </p>
              <AddAttributeButton />
            </div>
          }
        />
      )}
    </div>
  );
}
