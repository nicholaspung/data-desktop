// frontend/src/routes/people-crm/attributes/$attributeId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { PersonAttribute } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit,
  Tag,
  Calendar,
  User,
  Info,
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

interface AttributeParams {
  attributeId: string;
}

export const Route = createFileRoute("/people-crm/attributes/$attributeId")({
  component: AttributeDetail,
});

function AttributeDetail() {
  const { attributeId } = Route.useParams() as AttributeParams;
  const navigate = useNavigate();
  const attributes = useStore(dataStore, (state) => state.person_attributes);

  const [attribute, setAttribute] = useState<PersonAttribute | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundAttribute = attributes.find((a) => a.id === attributeId);
    if (foundAttribute) {
      setAttribute(foundAttribute);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(attributeId).then((data) => {
        if (data) {
          setAttribute(data as PersonAttribute);
        }
      });
    }
  }, [attributeId, attributes]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiService.deleteRecord(attributeId);
      deleteEntry(attributeId, "person_attributes");
      toast.success("Attribute deleted successfully");
      navigate({ to: "/people-crm/attributes" });
    } catch (error) {
      console.error("Error deleting attribute:", error);
      toast.error("Failed to delete attribute");
    } finally {
      setDeleting(false);
    }
  };

  if (!attribute) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">
          Loading attribute details...
        </p>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/people-crm" search={{ tab: "attributes" }}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Tag className="h-8 w-8" />
              {attribute.attribute_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Attribute of {attribute.person_id_data?.name || "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/people-crm/attributes/$attributeId/edit`}
            params={{ attributeId: attributeId }}
          >
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDeleteDialog
            title="Delete Attribute"
            description="Are you sure you want to delete this attribute? This action cannot be undone."
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      </div>

      {/* Attribute Details */}
      <ReusableCard
        content={
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {attribute.person_id_data?.name || "Unknown"}
                </span>
              </div>
              {attribute.learned_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Learned: {format(attribute.learned_date, "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              {attribute.category && (
                <Badge className={getCategoryColor(attribute.category)}>
                  {attribute.category}
                </Badge>
              )}
            </div>

            {/* Attribute Value */}
            <div>
              <h3 className="font-medium mb-3">Value</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-lg">{attribute.attribute_value}</p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {attribute.source && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Source
                  </h3>
                  <p className="text-muted-foreground">{attribute.source}</p>
                </div>
              )}

              {attribute.notes && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-muted-foreground">{attribute.notes}</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>
                  Created:{" "}
                  {format(attribute.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </span>
                <span>
                  Last modified:{" "}
                  {format(attribute.lastModified, "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </div>
        }
      />

      {/* Related Actions */}
      <ReusableCard
        title="Related Actions"
        content={
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/people-crm/people/$personId`}
              params={{ personId: attribute.person_id }}
            >
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Contact
              </Button>
            </Link>
            <Link
              to={`/people-crm/attributes/add`}
              params={{ personId: attribute.person_id }}
            >
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Add Another Attribute
              </Button>
            </Link>
            <Link
              to={`/people-crm/notes/add`}
              params={{ personId: attribute.person_id }}
            >
              <Button variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
