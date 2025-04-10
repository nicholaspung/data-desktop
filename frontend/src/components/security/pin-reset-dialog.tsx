// src/components/security/pin-reset-dialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, KeyRound, RefreshCcw } from "lucide-react";
import { usePin } from "@/hooks/usePin";

// Form validation schema
const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    newPin: z.string().min(4, "PIN must be at least 4 digits"),
    confirmNewPin: z.string().min(4, "PIN must be at least 4 digits"),
  })
  .refine((data) => data.newPin === data.confirmNewPin, {
    message: "PINs do not match",
    path: ["confirmNewPin"],
  });

interface PinResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinResetDialog({ open, onOpenChange }: PinResetDialogProps) {
  const { resetPin } = usePin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      newPin: "",
      confirmNewPin: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const success = await resetPin(values.password, values.newPin);

      if (success) {
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Your PIN
          </DialogTitle>
          <DialogDescription>
            Enter your recovery password to reset your PIN.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Recovery Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recovery Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your recovery password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the password you set up when you created your PIN
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New PIN Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="newPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Enter new PIN"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Confirm new PIN"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Reset PIN
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
