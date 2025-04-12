export interface Record {
  id: string;
  [key: string]: any;
}

export interface RelationStat {
  total: number;
  resolved: number;
  failed: number;
  relatedDataset: string;
  values: Set<string>;
}

export interface RelationStats {
  [fieldKey: string]: RelationStat;
}

export interface RelatedData {
  [fieldKey: string]: Record | null;
}
