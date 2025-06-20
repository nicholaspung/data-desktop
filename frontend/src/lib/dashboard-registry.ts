import { ComponentType } from "react";
import { LucideIcon } from "lucide-react";

export interface DashboardSummaryConfig {
  id: string;
  size: "small" | "medium" | "large";
  height: "small" | "medium" | "large";
  order: number;
  visible: boolean;
}

export interface DashboardSummaryDefinition {
  route: string;
  component: ComponentType<any>;
  defaultConfig: DashboardSummaryConfig;
  datasets?: string[];
  name: string;
  description: string;
  icon: LucideIcon;
}

class DashboardRegistry {
  private summaries = new Map<string, DashboardSummaryDefinition>();
  private initializationOrder: string[] = [];

  register(definition: DashboardSummaryDefinition) {
    if (this.summaries.has(definition.route)) {
      console.warn(`Dashboard summary for route ${definition.route} is already registered`);
      return;
    }

    this.summaries.set(definition.route, definition);
    this.initializationOrder.push(definition.route);
  }

  get(route: string): DashboardSummaryDefinition | undefined {
    return this.summaries.get(route);
  }

  getAll(): DashboardSummaryDefinition[] {
    return this.initializationOrder.map(route => this.summaries.get(route)!);
  }

  getAllRoutes(): string[] {
    return this.initializationOrder;
  }

  getDefaultConfigs(): Record<string, DashboardSummaryConfig> {
    const configs: Record<string, DashboardSummaryConfig> = {};
    this.summaries.forEach((summary) => {
      configs[summary.route] = summary.defaultConfig;
    });
    return configs;
  }

  getRouteDatasetMapping(): Record<string, string[]> {
    const mapping: Record<string, string[]> = {};
    this.summaries.forEach((summary) => {
      if (summary.datasets && summary.datasets.length > 0) {
        mapping[summary.route] = summary.datasets;
      }
    });
    return mapping;
  }

  getRouteInfo(): Array<{
    path: string;
    name: string;
    description: string;
    icon: LucideIcon;
  }> {
    return this.getAll().map((summary) => ({
      path: summary.route,
      name: summary.name,
      description: summary.description,
      icon: summary.icon,
    }));
  }
}

export const dashboardRegistry = new DashboardRegistry();

export function registerDashboardSummary(definition: DashboardSummaryDefinition) {
  dashboardRegistry.register(definition);
}