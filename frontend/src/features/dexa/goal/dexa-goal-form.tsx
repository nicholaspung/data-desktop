import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoalStorageService } from "./goal-storage-service";
import { DexaGoal } from "../dexa";

const formSchema = z.object({
  bodyFatPercent: z.coerce
    .number({ required_error: "Body fat percentage is required" })
    .min(3, "Body fat percentage must be at least 3%")
    .max(50, "Body fat percentage must be less than 50%"),
  totalWeightLbs: z.coerce
    .number({ required_error: "Target weight is required" })
    .min(70, "Weight must be at least 70 lbs")
    .max(400, "Weight must be less than 400 lbs"),
  vatMassLbs: z.coerce
    .number({ required_error: "VAT mass is required" })
    .min(0, "VAT mass must be at least 0 lbs")
    .max(10, "VAT mass must be less than 10 lbs"),
});

export default function DexaGoalForm({
  onSuccess,
  existingGoal,
}: {
  onSuccess?: () => void;
  existingGoal?: DexaGoal;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingGoal
      ? {
          bodyFatPercent: existingGoal.bodyFatPercent,
          totalWeightLbs: existingGoal.totalWeightLbs,
          vatMassLbs: existingGoal.vatMassLbs,
        }
      : {
          bodyFatPercent: 15,
          totalWeightLbs: 170,
          vatMassLbs: 1,
        },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (existingGoal) {
        GoalStorageService.updateGoal({
          ...existingGoal,
          bodyFatPercent: values.bodyFatPercent,
          totalWeightLbs: values.totalWeightLbs,
          vatMassLbs: values.vatMassLbs,
        });
        toast.success("Goal updated successfully");
      } else {
        GoalStorageService.setGoal({
          bodyFatPercent: values.bodyFatPercent,
          totalWeightLbs: values.totalWeightLbs,
          vatMassLbs: values.vatMassLbs,
        });
        toast.success("Goal set successfully");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingGoal ? "Edit DEXA Goal" : "Set DEXA Goal"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Target date field removed */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="bodyFatPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Fat %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Target body fat percentage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalWeightLbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>Target total body weight</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatMassLbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Mass (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>Target visceral fat mass</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Goal"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
