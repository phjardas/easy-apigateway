import type { PermissionEvaluator, PermissionEvaluators } from "./types";

export type PermissionPermissionSpec = {
  type: "permission";
  permission: string;
};

export function permission(permission: string): PermissionPermissionSpec {
  return { type: "permission", permission };
}

const permissionEvaluator: PermissionEvaluator<PermissionPermissionSpec> = (
  { permission },
  context
) => context.permissions.has(permission);

export const defaultPermissionEvaluators: PermissionEvaluators = {
  permission: permissionEvaluator,
};
