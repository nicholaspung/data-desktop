// src/components/layout/dashboard-layout.tsx
import React, { useState, useEffect } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  BarChart,
  HeartPulse,
  Home,
  ListTodo,
  PieChart,
  ChevronLeft,
  ChevronRight,
  MenuIcon,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    title: "Experiments",
    icon: <ListTodo className="h-5 w-5" />,
    href: "/experiments",
  },
  {
    title: "Reports",
    icon: <BarChart className="h-5 w-5" />,
    href: "/reports",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const matches = useMatches();
  const currentPath =
    matches.length > 0 ? matches[matches.length - 1].pathname : "";

  // State to track whether sidebar is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(true);

  // Get the saved preference from localStorage on initial load
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarExpanded");
    if (savedState !== null) {
      setIsExpanded(savedState === "true");
    }
  }, []);

  // Toggle sidebar state
  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("sidebarExpanded", String(newState));
  };

  const getFinalSidebarItems = () => {
    const sidebarItemsCopy = [...sidebarItems];
    if (import.meta.env.DEV) {
      sidebarItemsCopy.push({
        title: "Debugger",
        icon: <Bug className="h-5 w-5" />,
        href: "/debug",
      });
    }
    return sidebarItemsCopy;
  };
  const finalSidebarItems = getFinalSidebarItems();

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow-md"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar - hidden on mobile by default, shown when toggled */}
      <div
        className={cn(
          "hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        {/* Toggle button */}
        <div
          className={cn(
            "flex justify-end p-2 border-b",
            isExpanded ? "justify-end" : "justify-center"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              "space-y-1 p-2",
              !isExpanded && "flex flex-col items-center"
            )}
          >
            <TooltipProvider delayDuration={100}>
              {finalSidebarItems.map((item) =>
                isExpanded ? (
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
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
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
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Mobile sidebar (slide in from left) */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 bg-background border-r w-64 transform transition-transform duration-300 ease-in-out",
          isExpanded ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-lg">Data Desktop</h2>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem-64px)]">
          {" "}
          {/* Viewport height minus top header (4rem) minus sidebar header (64px) */}
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
                onClick={() => setIsExpanded(false)} // Close sidebar when an item is clicked on mobile
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isExpanded && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div
          className={cn(
            "w-full px-4 py-6",
            // Add padding transition when sidebar state changes
            "transition-all duration-300 ease-in-out"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
