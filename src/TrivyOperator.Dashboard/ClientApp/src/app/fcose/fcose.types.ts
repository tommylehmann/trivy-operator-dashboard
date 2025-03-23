export interface NodeDataDto {
  id?: string;
  name?: string | null;
  dependsOn?: Array<string> | null;
  groupName?: string;
  isMain?: boolean;
}

export interface DeletedNodes {
  deleteType: "node" | "nodeAndChildren" | "selected" | "selectedAndChildren";
  mainNodeIds: string[];
  nodeIds: string[];
}
