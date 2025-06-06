import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface ReusableTabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
  className?: string;
  tabsListClassName?: string;
  tabsContentClassName?: string;
  onChange?: (tabId: string) => void;
  value?: string;
}

export default function ReusableTabs({
  tabs,
  defaultTabId,
  orientation = "horizontal",
  fullWidth = true,
  className = "",
  tabsListClassName = "",
  tabsContentClassName = "",
  onChange,
  value,
}: ReusableTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTabId || tabs[0]?.id || "",
  );

  const activeTab = value !== undefined ? value : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <Tabs
      defaultValue={defaultTabId || tabs[0]?.id}
      orientation={orientation === "vertical" ? "vertical" : "horizontal"}
      className={className}
      onValueChange={handleTabChange}
      value={activeTab}
    >
      <TabsList
        className={cn(
          `${fullWidth ? "w-full" : ""} ${orientation === "vertical" ? "flex-col h-auto" : ""}`,
          orientation === "horizontal" && tabs.length > 0
            ? "flex flex-wrap justify-center gap-1"
            : "",
          tabsListClassName,
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              tab.icon ? "flex gap-2 items-center" : "",
              orientation === "horizontal" && tabs.length > 5
                ? "flex-grow-0"
                : "flex-1",
            )}
          >
            {tab.icon && tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className={tabsContentClassName}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
