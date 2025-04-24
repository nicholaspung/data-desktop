// src/components/reusable/reusable-tabs.tsx
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}: ReusableTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabId || tabs[0]?.id || "");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
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
        className={`${fullWidth ? "w-full" : ""} ${orientation === "vertical" ? "flex-col h-auto" : "grid"} ${
          orientation === "horizontal" ? `grid-cols-${tabs.length}` : ""
        } ${tabsListClassName}`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={tab.icon ? "flex gap-2 items-center" : ""}
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
