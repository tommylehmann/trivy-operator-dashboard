export interface NodeDataDto {
  id?: string;
  name?: string | null;
  dependsOn?: Array<string> | null;
  groupName?: string;
  isMain?: boolean;
}

export interface DeletedNodes {
  deleteType: "node" | "nodeAndChildren";
  mainNodeIds: string[];
  nodeIds: string[];
}
