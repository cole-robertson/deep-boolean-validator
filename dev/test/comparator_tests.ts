import { expect } from "chai";

import {
  Comparator,
  validateComparison,
  validateComparisons,
} from "../src/comparator";
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

describe("Comparator", () => {
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
      responsePropsGetter: ({ success, comparator, operand1, operand2 }) => {
        let errorMessage;
        if (!success) {
          errorMessage = `${operand1} does not satisfy the condition ${comparator} ${operand2}`;
        }
        return { errorMessage };
      },
    });

  describe("shall validate comparisons correctly", () => {
    describe("shall evaluate '==' correctly", () => {
      it("shall return true for A === B", () =>
        expect(validateComparison("==", 1, 1)).to.be.true);
      it("shall return false if A !== B", () =>
        expect(validateComparison("==", 1, 2)).to.be.false);
    });

    describe("shall evaluate '!= correctly'", () => {
      it("shall return true if A !== B", () =>
        expect(validateComparison("!=", 1, 2)).to.be.true);
      it("shall return false if A === B", () =>
        expect(validateComparison("!=", 1, 1)).to.be.false);
    });

    describe("shall evaluate '>' correctly ", () => {
      it("shall return true if A > B", () =>
        expect(validateComparison(">", 2, 1)).to.be.true);
      it("shall return false if A === B", () =>
        expect(validateComparison(">", 1, 1)).to.be.false);
      it("shall return false if A !> B", () =>
        expect(validateComparison(">", 1, 2)).to.be.false);
    });

    describe("shall evaluate '>=' correctly", () => {
      it("shall return true if A > B", () =>
        expect(validateComparison(">=", 2, 1)).to.be.true);
      it("shall return true if A === B", () =>
        expect(validateComparison(">=", 1, 1)).to.be.true);
      it("shall return false if A !> B", () =>
        expect(validateComparison(">=", 1, 2)).to.be.false);
    });

    describe("shall evaluate '<' correctly", () => {
      it("shall return true if A < B", () =>
        expect(validateComparison("<", 1, 2)).to.be.true);
      it("shall return false if A === B", () =>
        expect(validateComparison("<", 1, 1)).to.be.false);
      it("shall return false if A > B", () =>
        expect(validateComparison("<", 2, 1)).to.be.false);
    });

    describe("shall evaluate '<=' correctly", () => {
      it("shall return true if A < B", () =>
        expect(validateComparison("<=", 1, 2)).to.be.true);
      it("shall return true if A === B", () =>
        expect(validateComparison("<=", 1, 1)).to.be.true);
      it("shall return false if A > B", () =>
        expect(validateComparison("<=", 2, 1)).to.be.false);
    });
  });

  describe("shall integrate with validate groups correctly", () => {
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
    const testTrueGroup: TestGroup = {
      items: [trueItem, trueItem],
      childGroups: [testChildTrueGroup, testChildTrueGroup],
      operator: "AND",
    };
    const falseItems: TestGroup = {
      items: [falseItem, falseItem],
      childGroups: [],
      operator: "AND",
    };
    const testOneNestedFalseGroup: TestGroup = {
      items: [trueItem, trueItem],
      childGroups: [testChildFalseGroup, testChildTrueGroup],
      operator: "AND",
    };
    it("shall return true for a group with all true comparisons", async () => {
      const res = await validateComparisonsWrapper(testTrueGroup);
      expect(res.valid).to.be.true;
    });
    it("shall return false for a group with at least one false comparison", async () => {
      const res = await validateComparisonsWrapper(testOneNestedFalseGroup);
      expect(res.valid).to.be.false;
    });
    it("shall allow the dev to pass through their own response props", async () => {
      const res = await validateComparisonsWrapper(falseItems);
      expect(res.itemResponses.some((res) => res.errorMessage != null));
    });
  });
});
