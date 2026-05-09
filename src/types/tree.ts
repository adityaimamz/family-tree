import type { FamilyMember, NuclearFamily } from "./family";

export type FocusMode = "all" | "descendants" | "ancestors" | "nuclear";

export type GenerationUnit = {
  id: string;
  generation: number;
  members: FamilyMember[];
};

export type ConnectorLine = {
  id: string;
  path: string;
  color: string;
  memberIds?: string[];
};

export type TreeLayoutUnit = GenerationUnit & {
  width: number;
  height: number;
  x: number;
  y: number;
  parentUnitIds: string[];
};

export type FamilyLayoutNode = {
  family: NuclearFamily;
  parentIds: string[];
  childMemberIds: string[];
  childFamilyNodes: FamilyLayoutNode[];
  sourceFamilyIds: string[];
  width: number;
  x: number;
  y: number;
  depth: number;
};

export type FamilyConnector = {
  familyId: string;
  color: string;
  parentIds: string[];
  parentBottom: number;
  parentCenterX: number;
  leftChildX: number;
  rightChildX: number;
  midY: number;
  childAnchors: {
    childId: string;
    centerX: number;
    topY: number;
  }[];
};

export type TreeLayout = {
  units: TreeLayoutUnit[];
  lines: ConnectorLine[];
  width: number;
  height: number;
};
