import { GroupErrorMessage } from ".";

import { getLogicalErrorResponses } from "./detailedResponse";
import {
  ValidationResponse,
  BooleanOperator,
  BooleanValidator,
  GroupItemResponse,
  BooleanValidatorSync,
} from "./types";

export const validateAndResponse = (
  responses: Array<ValidationResponse<unknown>>
) => responses.every((res) => res.valid);

export const validateOrResponse = (
  responses: Array<ValidationResponse<unknown>>
) => responses.filter((res) => res.valid).length >= 1;

export const validateXorResponse = (
  responses: Array<ValidationResponse<unknown>>
) => responses.filter((res) => res.valid).length === 1;

export const validateResponses = (
  operator: BooleanOperator,
  responses: Array<ValidationResponse<unknown>>
): boolean => {
  switch (operator) {
    case "AND": {
      return validateAndResponse(responses);
    }
    case "OR": {
      return validateOrResponse(responses);
    }
    case "XOR": {
      return validateXorResponse(responses);
    }
  }
};

/**
 * Asynchronously validate a group of items. This group and items are not specific,
 * they just must resolve to a boolean operator for each validateItem function
 *
 * @param params
 */
export const validateGroups = async <GroupType, ItemType, ResponseType>(
  params: BooleanValidator<GroupType, ItemType, ResponseType>
): Promise<GroupItemResponse<GroupType, ResponseType>> => {
  const { group } = params;
  const operator = params.booleanOperatorGetter(group);

  const items = params.itemsGetter(group);
  const itemPromises = items.map((item) => params.validateItem(item, group));

  const childGroups = params.childGroupGetter(group);
  const childPromises = childGroups.map((child) =>
    validateGroups({ ...params, group: child })
  );

  const [itemResponses, childResponses] = await Promise.all([
    Promise.all(itemPromises),
    Promise.all(childPromises),
  ]);
  const groupValid = validateResponses(operator, [
    ...itemResponses,
    ...childResponses,
  ]);

  return { valid: groupValid, group, operator, childResponses, itemResponses };
};

/**
 * Will run validateGroups and give extra information about which items and
 * children must be true or false in order for the group to be evaluated as
 * true
 *
 * @param params
 */
export const validateGroupsFull = async <GroupType, ItemType, ResponseType>(
  params: BooleanValidator<GroupType, ItemType, ResponseType>
): Promise<
  GroupItemResponse<GroupType, ResponseType> &
    GroupErrorMessage<GroupType, ResponseType>
> => {
  const groupRes = await validateGroups(params);
  return { ...groupRes, ...getLogicalErrorResponses(groupRes) };
};

/**
 * Synchronously validate a group of items. This group and items are not specific,
 * they just must resolve to a boolean operator for each validateItem function
 *
 * @param params
 */
export const validateGroupsSync = <GroupType, ItemType, ResponseType>(
  params: BooleanValidatorSync<GroupType, ItemType, ResponseType>
): GroupItemResponse<GroupType, ResponseType> => {
  const { group } = params;
  const operator = params.booleanOperatorGetter(group);

  const items = params.itemsGetter(group);
  const itemResponses = items.map((item) => params.validateItem(item, group));

  const childGroups = params.childGroupGetter(group);
  const childResponses = childGroups.map((child) =>
    validateGroupsSync({ ...params, group: child })
  );

  const groupValid = validateResponses(operator, [
    ...itemResponses,
    ...childResponses,
  ]);

  return { valid: groupValid, group, operator, childResponses, itemResponses };
};

/**
 * Will synchronously run validateGroups and give extra information about which items and
 * children must be true or false in order for the group to be evaluated as
 * true
 *
 * @param params
 */
export const validateGroupsFullSync = <GroupType, ItemType, ResponseType>(
  params: BooleanValidatorSync<GroupType, ItemType, ResponseType>
): GroupItemResponse<GroupType, ResponseType> &
  GroupErrorMessage<GroupType, ResponseType> => {
  const groupRes = validateGroupsSync(params);
  return { ...groupRes, ...getLogicalErrorResponses(groupRes) };
};
