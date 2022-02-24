import { forbiddenError } from "../errors";
import type {
  HasPermissions,
  PermissionEvaluatorContext,
  PermissionEvaluators,
  PermissionsEvaluator,
  PermissionSpec,
} from "./types";

type BooleanReducer = (allowed: Array<boolean>) => boolean;
const andReducer: BooleanReducer = (allowed) => allowed.every(Boolean);
const orReducer: BooleanReducer = (allowed) => allowed.some(Boolean);

function asserter(
  evaluator: HasPermissions
): (...specs: Array<PermissionSpec>) => Promise<void> {
  return async (...specs) => {
    const allowed = await evaluator(...specs);
    if (!allowed) throw forbiddenError();
  };
}

export class PermissionEvaluatorFactory {
  constructor(private readonly evaluators: PermissionEvaluators) {}

  private evaluate(
    spec: PermissionSpec,
    context: PermissionEvaluatorContext
  ): boolean | Promise<boolean> {
    const evaluator = this.evaluators[spec.type];
    if (!evaluator) {
      throw new Error(`No permission evaluator found for type ${spec.type}`);
    }

    return evaluator(spec, context);
  }

  private createHasPermissions(
    context: PermissionEvaluatorContext,
    reducer: BooleanReducer
  ): HasPermissions {
    return async (...specs) => {
      const results = await Promise.all(
        specs.map((spec) => this.evaluate(spec, context))
      );
      return reducer(results);
    };
  }

  createPermissionsEvaluator(
    context: PermissionEvaluatorContext
  ): PermissionsEvaluator {
    const hasPermissions = this.createHasPermissions(context, andReducer);
    const hasAnyPermission = this.createHasPermissions(context, orReducer);

    return {
      hasPermissions,
      hasAnyPermission,
      assertPermissions: asserter(hasPermissions),
      assertAnyPermission: asserter(hasAnyPermission),
    };
  }
}
