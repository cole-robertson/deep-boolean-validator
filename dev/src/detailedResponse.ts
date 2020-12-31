import { Comparator, PropsGetterParams } from "./comparator";
import { BooleanOperator, ValidationResponse, GroupItemResponse } from "./types";

export type Id = number | string;

export interface DetailedResponseParams<ItemType> {
  getOperandIds: (item: ItemType) => { operand1Id: Id; operand2Id?: Id };
  getOperandDisplayNames: (
    items: ItemType
  ) => { operand1Name: string; operand2Name: string };
}

type DetailedErrorParams<ItemType> = DetailedResponseParams<ItemType> &
  PropsGetterParams<ItemType>;

export const getTranslatedComparator = (comparator: Comparator) => {
  switch (comparator) {
    case "==": {
      return "equal to";
    }
    case "!=": {
      return "not equal to";
    }
    case ">": {
      return "greater than";
    }
    case ">=": {
      return "greater than or equal to";
    }
    case "<": {
      return "less than";
    }
    case "<=": {
      return "less than or equal to";
    }
  }
};

interface HumanReadableParams {
  comparator: Comparator;
  operand1Name: string;
  operand2Name: string;
  overrideTranslation?: (comparator: Comparator) => string;
  useNegative?: boolean;
}

export const getHumanReadableMessage = ({
  comparator,
  operand1Name,
  operand2Name,
  overrideTranslation,
  useNegative,
}: HumanReadableParams) => {
  const translatedOperator =
    overrideTranslation?.(comparator) || getTranslatedComparator(comparator);
  const negative = useNegative ? "NOT" : "";
  return `${operand1Name} is ${negative} ${translatedOperator} ${operand2Name}`;
};

interface OperandInfo {
  name: string;
  id: Id | undefined;
  value: unknown;
}

export interface DetailedResponse<ItemType> {
  errorMessage: string | undefined;
  operand1: OperandInfo;
  operand2: OperandInfo;
  comparator: Comparator;
  item: ItemType;
}

export const getDetailedError = <ItemType>({
  success,
  comparator,
  getOperandDisplayNames,
  getOperandIds,
  item,
  operand1: operand1Value,
  operand2: operand2Value,
}: DetailedErrorParams<ItemType>): DetailedResponse<ItemType> => {
  let errorMessage;
  const { operand1Id, operand2Id } = getOperandIds(item);
  const { operand1Name, operand2Name } = getOperandDisplayNames(item);
  const operand1: OperandInfo = {
    id: operand1Id,
    name: operand1Name,
    value: operand1Value,
  };
  const operand2: OperandInfo = {
    id: operand2Id,
    name: operand2Name,
    value: operand2Value,
  };
  if (!success) {
    let overrideTranslation;
    let useNegative = true;
    if (comparator === "!=") {
      overrideTranslation = () => "is equal to";
      useNegative = false;
    }

    errorMessage = getHumanReadableMessage({
      comparator,
      operand1Name,
      operand2Name,
      overrideTranslation,
      useNegative,
    });
  }
  return {
    errorMessage,
    operand1,
    operand2,
    item,
    comparator,
  };
};

export interface GroupErrorMessage<GroupType, ResponseType> {
  group: GroupType;
  operator: BooleanOperator;
  mustBeTrueItems: ValidationResponse<ResponseType>[];
  mustBeFalseItems: ValidationResponse<ResponseType>[];
  mustBeTrueChildren: GroupErrorMessage<GroupType, ResponseType>[];
  mustBeFalseChildren: GroupErrorMessage<GroupType, ResponseType>[];
  valid: boolean;
}

const getAndMustResponse = <GroupType, ItemType>(
  itemResponses: ValidationResponse<ItemType>[],
  childResponses: GroupItemResponse<GroupType, ItemType>[]
) => {
  const falseItemResponses = itemResponses.filter((res) => !res.valid);
  const falseChildrenResponses = childResponses.filter((res) => !res.valid);
  return {
    mustBeTrueItems: falseItemResponses,
    mustBeFalseItems: [],
    mustBeTrueChildren: falseChildrenResponses.map(getLogicalErrorResponses),
    mustBeFalseChildren: [],
  };
};

const getOrMustResponse = <GroupType, ItemType>(
  itemResponses: ValidationResponse<ItemType>[],
  childResponses: GroupItemResponse<GroupType, ItemType>[]
) => {
  const totalLength = itemResponses.length + childResponses.length;
  const falseItemResponses = itemResponses.filter((res) => !res.valid);
  const falseChildResponses = childResponses.filter((res) => !res.valid);
  const falseResponseLength =
    falseItemResponses.length + falseChildResponses.length;
  const everyResponseFalse = falseResponseLength === totalLength;
  if (everyResponseFalse) {
    return {
      mustBeTrueItems: falseItemResponses,
      mustBeTrueChildren: falseChildResponses.map(getLogicalErrorResponses),
      mustBeFalseItems: [],
      mustBeFalseChildren: [],
    };
  } else {
    return {
      mustBeTrueItems: [],
      mustBeTrueChildren: [],
      mustBeFalseItems: [],
      mustBeFalseChildren: [],
    };
  }
};

const getXorMustResponses = <GroupType, ItemType>(
  itemResponses: ValidationResponse<ItemType>[],
  childResponses: GroupItemResponse<GroupType, ItemType>[]
) => {
  const totalLength = itemResponses.length + childResponses.length;
  const validFalseLength = totalLength - 1;
  const falseItemResponses = itemResponses.filter((res) => !res.valid);
  const falseChildResponses = childResponses.filter((res) => !res.valid);
  const falseResponseLength =
    falseItemResponses.length + falseChildResponses.length;
  const everyResponseFalse = falseResponseLength === totalLength;
  const onlyOneTrueResponse = validFalseLength === falseResponseLength;
  if (everyResponseFalse) {
    return {
      mustBeTrueItems: falseItemResponses,
      mustBeTrueChildren: falseChildResponses.map(getLogicalErrorResponses),
      mustBeFalseItems: [],
      mustBeFalseChildren: [],
    };
  } else if (!onlyOneTrueResponse) {
    const trueItemResponses = itemResponses.filter((res) => res.valid);
    const trueChildResponses = childResponses.filter((res) => res.valid);
    return {
      mustBeTrueItems: [],
      mustBeTrueChildren: [],
      mustBeFalseItems: trueItemResponses,
      mustBeFalseChildren: trueChildResponses.map(getLogicalErrorResponses),
    };
  } else {
    return {
      mustBeTrueItems: [],
      mustBeTrueChildren: [],
      mustBeFalseItems: [],
      mustBeFalseChildren: [],
    };
  }
};

export const getLogicalErrorResponses = <GroupType, ItemType>(
  groupRes: GroupItemResponse<GroupType, ItemType>
): GroupErrorMessage<GroupType, ItemType> => {
  const { itemResponses, childResponses, ...groupProps } = groupRes;
  switch (groupProps.operator) {
    case "AND": {
      return {
        ...getAndMustResponse(itemResponses, childResponses),
        ...groupProps,
      };
    }
    case "OR": {
      return {
        ...getOrMustResponse(itemResponses, childResponses),
        ...groupProps,
      };
    }
    case "XOR": {
      return {
        ...getXorMustResponses(itemResponses, childResponses),
        ...groupProps,
      };
    }
  }
};
