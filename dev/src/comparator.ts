import { validateGroups } from ".";
import { BooleanValidator, AsyncFuncResult, GroupItemResponse } from "./types";
var isEqual = require("lodash.isequal");

export type Comparator = "==" | "!=" | ">" | ">=" | "<" | "<=";

export interface ValueSpecificFunctions<ItemType> {
  valueGetter: (item: ItemType) => unknown;
  valueNormalizer: (value: unknown) => unknown;
}

export interface PropsGetterParams<ItemType> {
  success: boolean;
  comparator: Comparator;
  item: ItemType;
  actual: unknown;
  expected: unknown;
}

export interface ComparatorExtension<GroupType, ItemType, ResponseType>
  extends Omit<
    BooleanValidator<GroupType, ItemType, ResponseType>,
    "validateItem"
  > {
  comparatorGetter: (item: ItemType) => Comparator;
  getOperands: (
    item: ItemType
  ) => AsyncFuncResult<{ actual: unknown; expected: unknown }>;
  responsePropsGetter?: (params: PropsGetterParams<ItemType>) => ResponseType;
}

export const isEqualTo = (operand1: unknown, operand2: unknown) =>
  isEqual(operand1, operand2);

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
    getOperands,
    responsePropsGetter,
    ...validatorParams
  } = params;
  return await validateGroups({
    ...validatorParams,
    validateItem: (item) =>
      validateItemComparison({
        responsePropsGetter,
        getOperands,
        comparatorGetter,
        item,
      }),
  });
};

export interface ValidateItemComparisons<ItemType, ResponseType> {
  item: ItemType;
  comparatorGetter: (item: ItemType) => Comparator;
  getOperands: (
    item: ItemType
  ) => AsyncFuncResult<{ actual: unknown; expected: unknown }>;
  responsePropsGetter?: (params: PropsGetterParams<ItemType>) => ResponseType;
}

export const validateItemComparison = async <ItemType, ResponseType>({
  comparatorGetter,
  getOperands,
  item,
  responsePropsGetter,
}: ValidateItemComparisons<ItemType, ResponseType>) => {
  const comparator = comparatorGetter(item);
  const { actual, expected } = await getOperands(item);
  const res = validateComparison(comparator, actual, expected);
  const responseProps =
    responsePropsGetter?.({
      success: res,
      comparator,
      item,
      actual,
      expected,
    }) || ({} as ResponseType);
  return { ...responseProps, valid: res };
};
