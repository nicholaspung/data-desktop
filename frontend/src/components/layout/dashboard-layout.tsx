import React, { useState, useEffect } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@tanstack/react-store";
import settingsStore from "@/store/settings-store";
import { FEATURE_ICONS } from "@/lib/icons";

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

const defaultSidebarItems: SidebarItem[] = [
  {
    title: "Home",
    icon: <FEATURE_ICONS.HOME className="h-5 w-5" />,
    href: "/",
  },
  {
    title: "Time Tracker",
    icon: <FEATURE_ICONS.TIME_TRACKER className="h-5 w-5" />,
    href: "/time-tracker",
  },
  {
    title: "Daily Tracker",
    icon: <FEATURE_ICONS.DAILY_TRACkER className="h-5 w-5" />,
    href: "/calendar",
  },
  {
    title: "Todos",
    icon: <FEATURE_ICONS.TODOS className="h-5 w-5" />,
    href: "/todos",
  },
  {
    title: "Quick Metric Logger",
    icon: <FEATURE_ICONS.QUICK_METRIC_LOGGER className="h-5 w-5" />,
    href: "/metric",
  },
  {
    title: "Metric Calendar",
    icon: <FEATURE_ICONS.METRIC_CALENDAR className="h-5 w-5" />,
    href: "/metric-calendar",
  },
  {
    title: "Experiments",
    icon: <FEATURE_ICONS.EXPERIMENTS className="h-5 w-5" />,
    href: "/experiments",
  },
  {
    title: "Journaling",
    icon: <FEATURE_ICONS.JOURNALING className="h-5 w-5" />,
    href: "/journaling",
  },
  {
    title: "Time Planner",
    icon: <FEATURE_ICONS.TIME_PLANNER className="h-5 w-5" />,
    href: "/time-planner",
  },
  {
    title: "People CRM",
    icon: <FEATURE_ICONS.PEOPLE_CRM className="h-5 w-5" />,
    href: "/people-crm",
  },
  {
    title: "DEXA Scans",
    icon: <FEATURE_ICONS.DEXA_SCAN className="h-5 w-5" />,
    href: "/dexa",
  },
  {
    title: "Bloodwork",
    icon: <FEATURE_ICONS.BLOODWORK className="h-5 w-5" />,
    href: "/bloodwork",
  },
  {
    title: "Datasets",
    icon: <FEATURE_ICONS.DATASETS className="h-5 w-5" />,
    href: "/dataset",
  },
  {
    title: "Settings",
    icon: <FEATURE_ICONS.SETTINGS className="h-5 w-5" />,
    href: "/settings",
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

  const [isExpanded, setIsExpanded] = useState(true);

  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarExpanded");
    if (savedState !== null) {
      setIsExpanded(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("sidebarExpanded", String(newState));
  };

  const filteredSidebarItems = defaultSidebarItems.filter(
    (item) => visibleRoutes[item.href] !== false
  );

  const getFinalSidebarItems = () => {
    const sidebarItemsCopy = [...filteredSidebarItems];
    if (import.meta.env.DEV) {
      sidebarItemsCopy.push({
        title: "Debugger",
        icon: <FEATURE_ICONS.DEBUGGER className="h-5 w-5" />,
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
                    key={`final-sidebar${item.href}`}
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
                  <Tooltip key={`final-sidebar${item.href}`}>
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
            {finalSidebarItems.map((item) => (
              <Link
                key={`sidebar-item${item.href}`}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  currentPath === item.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground"
                )}
                onClick={() => setIsExpanded(false)}
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
            "transition-all duration-300 ease-in-out"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
