import { validateGroups } from ".";
import { BooleanValidator, AsyncFuncResult, GroupItemResponse } from "./types";

export type Comparator = "==" | "!=" | ">" | ">=" | "<" | "<=";

export interface ValueSpecificFunctions<ItemType> {
  valueGetter: (item: ItemType) => unknown;
  valueNormalizer: (value: unknown) => unknown;
}

export interface PropsGetterParams<ItemType> {
  success: boolean;
  comparator: Comparator;
  item: ItemType;
  operand1: unknown;
  operand2: unknown;
}

export interface ComparatorExtension<GroupType, ItemType, ResponseType>
  extends Omit<
    BooleanValidator<GroupType, ItemType, ResponseType>,
    "validateItem"
  > {
  comparatorGetter: (item: ItemType) => Comparator;
  getOperandValues: (
    item: ItemType
  ) => AsyncFuncResult<{ operand1Value: unknown; operand2Value: unknown }>;
  responsePropsGetter?: (params: PropsGetterParams<ItemType>) => ResponseType;
}

export const isEqualTo = (operand1: unknown, operand2: unknown) =>
  operand1 === operand2;

export const isNotEqualTo = (operand1: unknown, operand2: unknown) =>
  !isEqualTo(operand1, operand2);

export const isGreaterThan = (operand1: unknown, operand2: unknown) =>
  Number(operand1) > Number(operand2);

export const isGreaterThanOrEqualTo = (operand1: unknown, operand2: unknown) =>
  Number(operand1) >= Number(operand2);

export const isLessThan = (operand1: unknown, operand2: unknown) =>
  Number(operand1) < Number(operand2);

export const isLessThanOrEqualTo = (operand1: unknown, operand2: unknown) =>
  Number(operand1) <= Number(operand2);

export const validateComparison = (
  comparator: Comparator,
  operand1: unknown,
  operand2: unknown
): boolean => {
  switch (comparator) {
    case "==": {
      return isEqualTo(operand1, operand2);
    }
    case "!=": {
      return isNotEqualTo(operand1, operand2);
    }
    case ">": {
      return isGreaterThan(operand1, operand2);
    }
    case ">=": {
      return isGreaterThanOrEqualTo(operand1, operand2);
    }
    case "<": {
      return isLessThan(operand1, operand2);
    }
    case "<=": {
      return isLessThanOrEqualTo(operand1, operand2);
    }
  }
};

export const validateComparisons = async <GroupType, ItemType, ResponseType>(
  params: ComparatorExtension<GroupType, ItemType, ResponseType>
): Promise<GroupItemResponse<GroupType, ResponseType>> => {
  const {
    comparatorGetter,
    getOperandValues: getOperands,
    ...validatorParams
  } = params;
  return await validateGroups({
    ...validatorParams,
    validateItem: async (item) => {
      const comparator = comparatorGetter(item);
      const {
        operand1Value: operand1,
        operand2Value: operand2,
      } = await getOperands(item);
      const res = validateComparison(comparator, operand1, operand2);
      const responseProps =
        params.responsePropsGetter?.({
          success: res,
          comparator,
          item,
          operand1,
          operand2,
        }) || ({} as ResponseType);
      return { ...responseProps, valid: res };
    },
  });
};
