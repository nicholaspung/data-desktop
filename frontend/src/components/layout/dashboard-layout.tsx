// src/components/layout/dashboard-layout.tsx
import React from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  FileSpreadsheet,
  HeartPulse,
  Home,
  ListTodo,
  PieChart,
} from "lucide-react";

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Home",
    icon: <Home className="h-5 w-5" />,
    href: "/",
  },
  {
    title: "DEXA Scans",
    icon: <PieChart className="h-5 w-5" />,
    href: "/dexa",
  },
  {
    title: "Bloodwork",
    icon: <HeartPulse className="h-5 w-5" />,
    href: "/bloodwork",
  },
  {
    title: "Paychecks",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    href: "/paychecks",
  },
  {
    title: "Habits",
    icon: <ListTodo className="h-5 w-5" />,
    href: "/habits",
  },
  {
    title: "Reports",
    icon: <BarChart className="h-5 w-5" />,
    href: "/reports",
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const matches = useMatches();
  const currentPath =
    matches.length > 0 ? matches[matches.length - 1].pathname : "";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background">
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  currentPath === item.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="container py-6">{children}</div>
        </ScrollArea>
      </div>
    </div>
  );
}
