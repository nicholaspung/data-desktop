/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as MetricImport } from './routes/metric'
import { Route as ExperimentsImport } from './routes/experiments'
import { Route as DexaImport } from './routes/dexa'
import { Route as DebugImport } from './routes/debug'
import { Route as DatasetImport } from './routes/dataset'
import { Route as CalendarImport } from './routes/calendar'
import { Route as BloodworkImport } from './routes/bloodwork'
import { Route as IndexImport } from './routes/index'

// Create/Update Routes

const MetricRoute = MetricImport.update({
  id: '/metric',
  path: '/metric',
  getParentRoute: () => rootRoute,
} as any)

const ExperimentsRoute = ExperimentsImport.update({
  id: '/experiments',
  path: '/experiments',
  getParentRoute: () => rootRoute,
} as any)

const DexaRoute = DexaImport.update({
  id: '/dexa',
  path: '/dexa',
  getParentRoute: () => rootRoute,
} as any)

const DebugRoute = DebugImport.update({
  id: '/debug',
  path: '/debug',
  getParentRoute: () => rootRoute,
} as any)

const DatasetRoute = DatasetImport.update({
  id: '/dataset',
  path: '/dataset',
  getParentRoute: () => rootRoute,
} as any)

const CalendarRoute = CalendarImport.update({
  id: '/calendar',
  path: '/calendar',
  getParentRoute: () => rootRoute,
} as any)

const BloodworkRoute = BloodworkImport.update({
  id: '/bloodwork',
  path: '/bloodwork',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/bloodwork': {
      id: '/bloodwork'
      path: '/bloodwork'
      fullPath: '/bloodwork'
      preLoaderRoute: typeof BloodworkImport
      parentRoute: typeof rootRoute
    }
    '/calendar': {
      id: '/calendar'
      path: '/calendar'
      fullPath: '/calendar'
      preLoaderRoute: typeof CalendarImport
      parentRoute: typeof rootRoute
    }
    '/dataset': {
      id: '/dataset'
      path: '/dataset'
      fullPath: '/dataset'
      preLoaderRoute: typeof DatasetImport
      parentRoute: typeof rootRoute
    }
    '/debug': {
      id: '/debug'
      path: '/debug'
      fullPath: '/debug'
      preLoaderRoute: typeof DebugImport
      parentRoute: typeof rootRoute
    }
    '/dexa': {
      id: '/dexa'
      path: '/dexa'
      fullPath: '/dexa'
      preLoaderRoute: typeof DexaImport
      parentRoute: typeof rootRoute
    }
    '/experiments': {
      id: '/experiments'
      path: '/experiments'
      fullPath: '/experiments'
      preLoaderRoute: typeof ExperimentsImport
      parentRoute: typeof rootRoute
    }
    '/metric': {
      id: '/metric'
      path: '/metric'
      fullPath: '/metric'
      preLoaderRoute: typeof MetricImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/bloodwork': typeof BloodworkRoute
  '/calendar': typeof CalendarRoute
  '/dataset': typeof DatasetRoute
  '/debug': typeof DebugRoute
  '/dexa': typeof DexaRoute
  '/experiments': typeof ExperimentsRoute
  '/metric': typeof MetricRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/bloodwork': typeof BloodworkRoute
  '/calendar': typeof CalendarRoute
  '/dataset': typeof DatasetRoute
  '/debug': typeof DebugRoute
  '/dexa': typeof DexaRoute
  '/experiments': typeof ExperimentsRoute
  '/metric': typeof MetricRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/bloodwork': typeof BloodworkRoute
  '/calendar': typeof CalendarRoute
  '/dataset': typeof DatasetRoute
  '/debug': typeof DebugRoute
  '/dexa': typeof DexaRoute
  '/experiments': typeof ExperimentsRoute
  '/metric': typeof MetricRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/bloodwork'
    | '/calendar'
    | '/dataset'
    | '/debug'
    | '/dexa'
    | '/experiments'
    | '/metric'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/bloodwork'
    | '/calendar'
    | '/dataset'
    | '/debug'
    | '/dexa'
    | '/experiments'
    | '/metric'
  id:
    | '__root__'
    | '/'
    | '/bloodwork'
    | '/calendar'
    | '/dataset'
    | '/debug'
    | '/dexa'
    | '/experiments'
    | '/metric'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  BloodworkRoute: typeof BloodworkRoute
  CalendarRoute: typeof CalendarRoute
  DatasetRoute: typeof DatasetRoute
  DebugRoute: typeof DebugRoute
  DexaRoute: typeof DexaRoute
  ExperimentsRoute: typeof ExperimentsRoute
  MetricRoute: typeof MetricRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  BloodworkRoute: BloodworkRoute,
  CalendarRoute: CalendarRoute,
  DatasetRoute: DatasetRoute,
  DebugRoute: DebugRoute,
  DexaRoute: DexaRoute,
  ExperimentsRoute: ExperimentsRoute,
  MetricRoute: MetricRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/bloodwork",
        "/calendar",
        "/dataset",
        "/debug",
        "/dexa",
        "/experiments",
        "/metric"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/bloodwork": {
      "filePath": "bloodwork.tsx"
    },
    "/calendar": {
      "filePath": "calendar.tsx"
    },
    "/dataset": {
      "filePath": "dataset.tsx"
    },
    "/debug": {
      "filePath": "debug.tsx"
    },
    "/dexa": {
      "filePath": "dexa.tsx"
    },
    "/experiments": {
      "filePath": "experiments.tsx"
    },
    "/metric": {
      "filePath": "metric.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
