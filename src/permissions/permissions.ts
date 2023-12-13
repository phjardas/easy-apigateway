import { forbiddenError } from "../errors";
import type {
  AssertPermissions,
  HasPermissions,
  PermissionEvaluatorContext,
  PermissionEvaluators,
  PermissionsEvaluator,
  PermissionSpec,
} from "./types";

export class PermissionEvaluatorFactory {
  constructor(private readonly evaluators: PermissionEvaluators) {}

  createPermissionsEvaluator(
    context: PermissionEvaluatorContext,
  ): PermissionsEvaluator {
    return new PermissionsEvaluatorImpl(context, this.evaluators);
  }
}

class PermissionsEvaluatorImpl implements PermissionsEvaluator {
  constructor(
    private readonly context: PermissionEvaluatorContext,
    private readonly evaluators: PermissionEvaluators,
  ) {}

  private evaluate(spec: PermissionSpec): boolean | Promise<boolean> {
    const evaluator = this.evaluators[spec.type];
    if (!evaluator) {
      throw new Error(`No permission evaluator found for type ${spec.type}`);
    }

    return evaluator(spec, this.context);
  }

  private async hasPermissionsInternal(
    reducer: BooleanReducer,
    specs: Array<PermissionSpec>,
  ): Promise<boolean> {
    const results = await Promise.all(specs.map((spec) => this.evaluate(spec)));
    return reducer(results);
  }

  hasPermissions: HasPermissions = (...specs) =>
    this.hasPermissionsInternal(andReducer, specs);

  hasAnyPermission: HasPermissions = (...specs) =>
    this.hasPermissionsInternal(orReducer, specs);

  assertPermissions: AssertPermissions = async (...specs) => {
    const allowed = await this.hasPermissions(...specs);
    if (!allowed) throw forbiddenError();
  };

  assertAnyPermission: AssertPermissions = async (...specs) => {
    const allowed = await this.hasAnyPermission(...specs);
    if (!allowed) throw forbiddenError();
  };
}

type BooleanReducer = (allowed: Array<boolean>) => boolean;
const andReducer: BooleanReducer = (allowed) => allowed.every(Boolean);
const orReducer: BooleanReducer = (allowed) => allowed.some(Boolean);
