import { GroupItemResponse } from "./types";

export interface IfThenParams<GroupType, ResponseType> {
  ifGroup: GroupType;
  thenGroup: GroupType;
  validateGroup: (
    group: GroupType
  ) => Promise<GroupItemResponse<GroupType, ResponseType>>;
}

export interface IfThenResponse<GroupType, ResponseType> {
  ifResponse: GroupItemResponse<GroupType, ResponseType>;
  thenResponse: GroupItemResponse<GroupType, ResponseType> | undefined;
}

export const validateIfThen = async <GroupType, ResponseType>({
  ifGroup,
  thenGroup,
  validateGroup,
}: IfThenParams<GroupType, ResponseType>): Promise<
  IfThenResponse<GroupType, ResponseType>
> => {
  const ifResponse = await validateGroup(ifGroup);
  let thenResponse;
  if (ifResponse.valid) {
    thenResponse = await validateGroup(thenGroup);
  }
  return {
    ifResponse,
    thenResponse,
  };
};
