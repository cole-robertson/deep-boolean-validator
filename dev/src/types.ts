export type BooleanOperator = "AND" | "OR" | "XOR";

export type ValidationResponse<T> = { valid: boolean } & T;

export type AsyncFuncResult<T> = T | Promise<T>;

export interface BaseBooleanValidator<GroupType, ItemType> {
  group: GroupType;
  booleanOperatorGetter: (group: GroupType) => BooleanOperator;
  itemsGetter: (group: GroupType) => ItemType[];
  childGroupGetter: (group: GroupType) => GroupType[];
}
export interface BooleanValidator<GroupType, ItemType, ResponseType>
  extends BaseBooleanValidator<GroupType, ItemType> {
  validateItem: (
    item: ItemType,
    group: GroupType
  ) => AsyncFuncResult<ValidationResponse<ResponseType>>;
}

export interface BooleanValidatorSync<GroupType, ItemType, ResponseType>
  extends BaseBooleanValidator<GroupType, ItemType> {
  validateItem: (
    item: ItemType,
    group: GroupType
  ) => ValidationResponse<ResponseType>;
}

export interface GroupItemResponse<GroupType, ResponseType> {
  valid: boolean;
  group: GroupType;
  operator: BooleanOperator;
  itemResponses: ValidationResponse<ResponseType>[];
  childResponses: GroupItemResponse<GroupType, ResponseType>[];
}
