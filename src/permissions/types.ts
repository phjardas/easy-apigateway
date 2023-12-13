import { type Logger } from "../logging";

export type PermissionSpec = { type: string };

export type HasPermissions = (
  ...specs: Array<PermissionSpec>
) => Promise<boolean>;

export type AssertPermissions = (
  ...specs: Array<PermissionSpec>
) => Promise<void>;

export type PermissionsEvaluator = {
  /**
   * Does the current user hold all of the given permissions?
   */
  hasPermissions: HasPermissions;

  /**
   * Does the current user hold at least one of the given permissions?
   */
  hasAnyPermission: HasPermissions;

  /**
   * Assert that the current user holds all of the given permissions.
   */
  assertPermissions: AssertPermissions;

  /**
   * Assert that the current user holds at least one of the given permissions.
   */
  assertAnyPermission: AssertPermissions;
};

export type PermissionEvaluatorContext = {
  principalId: string;
  permissions: Set<string>;
  logger: Logger;
};

export type PermissionEvaluator<Spec extends PermissionSpec> = (
  spec: Spec,
  context: PermissionEvaluatorContext,
) => boolean | Promise<boolean>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PermissionEvaluators = Record<string, PermissionEvaluator<any>>;
