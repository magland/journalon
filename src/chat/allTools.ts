/* eslint-disable @typescript-eslint/no-explicit-any */
import { ORFunctionDescription, ORMessage } from "./openRouterTypes";

export interface ToolExecutionContext {
  imageUrlsNeedToBeUser: boolean;
  onCancelRef: {
    onCancel?: () => void;
  }
}

interface NCTool {
  toolFunction: ORFunctionDescription;
  execute: (params: any, o: ToolExecutionContext) => Promise<{
    result: string,
    newMessages?: ORMessage[]
  }>
  getDetailedDescription: () => Promise<string>;
  requiresPermission: boolean;
  isCancelable: boolean;
}

const staticTools: NCTool[] = [
];

export const getAllTools = async () => {
  return [...staticTools] as const;
};

// For backward compatibility with existing imports
export default staticTools;
