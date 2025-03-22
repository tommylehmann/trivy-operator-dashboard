export interface NodeDataDto {
  id?: string;
  name?: string | null;
  dependsOn?: Array<string> | null;
  groupName?: string;
  isMain?: boolean;
}

export interface DeletedNodes {
  deleteType: "single" | "multiple" | "multiSelected";
  mainNodeIds: string[];
  nodeIds: string[];
}
