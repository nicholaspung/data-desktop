// src/components/security/security-settings.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Lock,
  KeyRound,
  Shield,
  RefreshCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UnlockKeyhole,
} from "lucide-react";

export function SecuritySettings() {
  const {
    isConfigured,
    isUnlocked,
    openPinSetupDialog,
    clearSecuritySettings,
    openPinEntryDialog,
  } = usePin();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Manage your PIN and security settings for protecting sensitive data
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isConfigured ? (
          <Tabs defaultValue="status">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="change-pin" disabled={!isUnlocked}>
                Change PIN {!isUnlocked && <Lock className="h-3 w-3 ml-1" />}
              </TabsTrigger>
              <TabsTrigger value="change-password" disabled={!isUnlocked}>
                Change Password{" "}
                {!isUnlocked && <Lock className="h-3 w-3 ml-1" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4 py-4">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">Security Status</div>
                  <div className="flex items-center text-green-600 gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Active</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="font-medium">Lock Status</div>
                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      isUnlocked
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {isUnlocked ? (
                      <UnlockKeyhole className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  {isUnlocked ? (
                    <Button variant="outline" onClick={openPinSetupDialog}>
                      Update Settings
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={openPinEntryDialog}>
                      <UnlockKeyhole className="h-4 w-4 mr-2" />
                      Unlock to Change Settings
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Disable Security
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Disable Security Protection
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all security settings, including your
                          PIN and password. Your private data will no longer be
                          protected. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={clearSecuritySettings}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Disable Security
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="change-pin" className="py-4">
              <ChangePinForm />
            </TabsContent>

            <TabsContent value="change-password" className="py-4">
              <ChangePasswordForm />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Security Not Configured
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Setting up a PIN allows you to protect sensitive information from
              casual observers. Your data remains stored locally on your device.
            </p>
            <Button onClick={openPinSetupDialog}>
              <Shield className="h-4 w-4 mr-2" />
              Set Up Security
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Change PIN Form
function ChangePinForm() {
  const { changePin } = usePin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // PIN change schema
  const pinChangeSchema = z
    .object({
      currentPin: z.string().min(4, "PIN must be at least 4 digits"),
      newPin: z.string().min(4, "PIN must be at least 4 digits"),
      confirmNewPin: z.string().min(4, "PIN must be at least 4 digits"),
    })
    .refine((data) => data.newPin === data.confirmNewPin, {
      message: "PINs do not match",
      path: ["confirmNewPin"],
    });

  const form = useForm<z.infer<typeof pinChangeSchema>>({
    resolver: zodResolver(pinChangeSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
      confirmNewPin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof pinChangeSchema>) => {
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const result = await changePin(values.currentPin, values.newPin);

      if (result) {
        setSuccess(true);
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 p-3 rounded flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>PIN changed successfully</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="currentPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current PIN</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter current PIN"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
          )}
          Change PIN
        </Button>
      </form>
    </Form>
  );
}

// Change Password Form
function ChangePasswordForm() {
  const { changePassword } = usePin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password change schema
  const passwordChangeSchema = z
    .object({
      pin: z.string().min(4, "PIN must be at least 4 digits"),
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
      confirmNewPassword: z
        .string()
        .min(6, "Password must be at least 6 characters"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    });

  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      pin: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const result = await changePassword(values.pin, values.newPassword);

      if (result) {
        setSuccess(true);
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 p-3 rounded flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>Password changed successfully</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your PIN</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter your PIN"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You need to verify your PIN to change the recovery password
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4 mr-2" />
          )}
          Change Password
        </Button>
      </form>
    </Form>
  );
}

// Utility for conditional class names
import { cn } from "@/lib/utils";
import { usePin } from "@/hooks/usePin";
