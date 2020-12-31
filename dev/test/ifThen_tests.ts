import { expect } from "chai";

import { Comparator, validateComparisons } from "../src/comparator";
import { validateIfThen } from "../src/ifThen";
import { BooleanOperator } from "../src/types";

interface TestCondition {
  operand1: number;
  comparator: Comparator;
  operand2: number;
}

interface TestGroup {
  items: TestCondition[];
  childGroups: TestGroup[];
  operator: BooleanOperator;
}

describe("If-Then", () => {
  const trueItem: TestCondition = {
    comparator: "==",
    operand1: 1,
    operand2: 1,
  };
  const falseItem: TestCondition = {
    comparator: "==",
    operand1: 1,
    operand2: 2,
  };
  const testChildTrueGroup: TestGroup = {
    items: [trueItem, trueItem],
    childGroups: [],
    operator: "AND",
  };
  const testChildFalseGroup: TestGroup = {
    items: [falseItem, trueItem],
    childGroups: [],
    operator: "AND",
  };

  const validateComparisonsWrapper = (testGroup: TestGroup) =>
    validateComparisons({
      booleanOperatorGetter: (group) => group.operator,
      childGroupGetter: (group) => group.childGroups,
      comparatorGetter: (item: TestCondition) => item.comparator,
      getOperandValues: (item) => ({
        operand1Value: item.operand1,
        operand2Value: item.operand2,
      }),
      group: testGroup,
      itemsGetter: (group) => group.items,
    });

  const validateIfThenWrapper = (ifGroup: TestGroup, thenGroup: TestGroup) =>
    validateIfThen({
      ifGroup,
      thenGroup,
      validateGroup: validateComparisonsWrapper,
    });

  it("shall return ifResponse and thenResponse", async () => {
    const res = await validateIfThenWrapper(
      testChildTrueGroup,
      testChildTrueGroup
    );
    expect(res).to.have.property("ifResponse");
    expect(res).to.have.property("thenResponse");
  });
  it("shall return thenResponse as undefined if the ifGroup evaluates to false", async () => {
    const res = await validateIfThenWrapper(
      testChildFalseGroup,
      testChildTrueGroup
    );
    expect(res.thenResponse).to.be.undefined;
  });
  it("shall return thenResponse if the ifGroup evaluates to true", async () => {
    const res = await validateIfThenWrapper(
      testChildTrueGroup,
      testChildFalseGroup
    );
    expect(res.thenResponse).to.not.be.undefined;
  });
});
