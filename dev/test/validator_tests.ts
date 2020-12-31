import { expect } from "chai";
import { BooleanOperator } from "../src/types";

import {
  validateAndResponse,
  validateGroups,
  validateOrResponse,
} from "../src/validator";

interface TestItem {
  value: number;
}

interface TestGroup {
  items: TestItem[];
  childGroups: TestGroup[];
  operator: BooleanOperator;
}

interface TestGroupGeneratorParams {
  numTrueItems?: number;
  numFalseItems?: number;
  operator: BooleanOperator;
  childGroups?: TestGroupGeneratorParams[];
}
const expectedValue = 4;
const trueItem: TestItem = { value: 4 };
const falseItem: TestItem = { value: 3 };

const testGroupGenerator = ({
  numFalseItems,
  numTrueItems,
  operator,
  childGroups,
}: TestGroupGeneratorParams) => {
  const testGroup: TestGroup = { items: [], childGroups: [], operator };
  for (let i = 1; i <= (numTrueItems || 0); i++) {
    testGroup.items.push(trueItem);
  }

  for (let i = 1; i <= (numFalseItems || 0); i++) {
    testGroup.items.push(falseItem);
  }

  for (const child of childGroups || []) {
    testGroup.childGroups.push(testGroupGenerator(child));
  }

  return testGroup;
};

describe("Validator", () => {
  const validateGroupsWrapper = (testGroup: TestGroup) =>
    validateGroups({
      booleanOperatorGetter: (group) => group.operator,
      childGroupGetter: (group) => group.childGroups,
      group: testGroup,
      itemsGetter: (group) => group.items,
      validateItem: (item: any) => ({
        valid: item.value === expectedValue,
      }),
    });

  describe("shall evaluate simple boolean operators correctly", () => {
    const trueResponse = { valid: true };
    const falseResponse = { valid: false };
    describe("AND", () => {
      const allTrue = [trueResponse, trueResponse, trueResponse];
      const oneFalse = [falseResponse, trueResponse, trueResponse];
      it("shall return true for all true responses", () => {
        const validate = validateAndResponse(allTrue);
        expect(validate).to.be.true;
      });

      it("shall return false if there is at least one false response", () => {
        const validate = validateAndResponse(oneFalse);
        expect(validate).to.be.false;
      });
    });

    describe("OR", () => {
      const twoFalse = [falseResponse, falseResponse, trueResponse];
      const allFalse = [falseResponse, falseResponse, falseResponse];
      it("shall return true for at least one true responses", () => {
        const validate = validateOrResponse(twoFalse);
        expect(validate).to.be.true;
      });

      it("shall return false if there is no true response", () => {
        const validate = validateAndResponse(allFalse);
        expect(validate).to.be.false;
      });
    });

    describe("XOR", () => {
      const allFalse = [falseResponse, falseResponse, falseResponse];
      const oneTrue = [falseResponse, falseResponse, trueResponse];
      const twoTrue = [falseResponse, trueResponse, trueResponse];
      it("shall return true if there is only one true response", () => {
        const validate = validateOrResponse(oneTrue);
        expect(validate).to.be.true;
      });

      it("shall return false if there is no true response", () => {
        const validate = validateAndResponse(allFalse);
        expect(validate).to.be.false;
      });

      it("shall return false if there is more than one true response", () => {
        const validate = validateAndResponse(twoTrue);
        expect(validate).to.be.false;
      });
    });
  });

  describe("shall validate groups correctly", () => {
    describe("AND", () => {
      const operator = "AND";
      const allTrueParams: TestGroupGeneratorParams = {
        numTrueItems: 2,
        operator,
      };
      const allTrueItems = testGroupGenerator(allTrueParams);
      const oneFalseParams: TestGroupGeneratorParams = {
        numTrueItems: 1,
        numFalseItems: 1,
        operator,
      };
      const oneFalseItem = testGroupGenerator(oneFalseParams);
      const allTrueChildren = testGroupGenerator({
        numTrueItems: 2,
        operator,
        childGroups: [allTrueParams, allTrueParams],
      });
      const oneNestedFalse = testGroupGenerator({
        numTrueItems: 2,
        operator,
        childGroups: [allTrueParams, oneFalseParams],
      });

      it("shall return valid: true when items all evaluate to true", async () => {
        const res = await validateGroupsWrapper(allTrueItems);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: false when at least one item evaluates to false", async () => {
        const res = await validateGroupsWrapper(oneFalseItem);
        expect(res.valid).to.be.false;
      });

      it("shall return valid: true when all nested items or groups evaluates to true", async () => {
        const res = await validateGroupsWrapper(allTrueChildren);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: false when at least one nested item evaluates to false", async () => {
        const res = await validateGroupsWrapper(oneNestedFalse);
        expect(res.valid).to.be.false;
      });
    });

    describe("OR", () => {
      const operator = "OR";
      const oneTrueParams: TestGroupGeneratorParams = {
        numTrueItems: 1,
        numFalseItems: 1,
        operator,
      };
      const oneTrueItem = testGroupGenerator(oneTrueParams);
      const allFalseParams: TestGroupGeneratorParams = {
        numFalseItems: 2,
        operator,
      };
      const allFalseItems = testGroupGenerator(allFalseParams);
      const oneNestedTrue = testGroupGenerator({
        numFalseItems: 2,
        operator,
        childGroups: [oneTrueParams, allFalseParams],
      });
      const allTrueChildren = testGroupGenerator({
        numTrueItems: 2,
        operator,
        childGroups: [oneTrueParams, oneTrueParams],
      });
      const allNestedFalse = testGroupGenerator({
        numFalseItems: 2,
        operator,
        childGroups: [allFalseParams, allFalseParams],
      });

      it("shall return valid: true when at least one item evaluates to true", async () => {
        const res = await validateGroupsWrapper(oneTrueItem);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: false when no items evaluate to true", async () => {
        const res = await validateGroupsWrapper(allFalseItems);
        expect(res.valid).to.be.false;
      });

      it("shall return valid: true when at one least nested item or group evaluates to true", async () => {
        const res = await validateGroupsWrapper(oneNestedTrue);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: true when more than one nested item or group evaluates to true", async () => {
        const res = await validateGroupsWrapper(allTrueChildren);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: false when no items or groups evaluate to true", async () => {
        const res = await validateGroupsWrapper(allNestedFalse);
        expect(res.valid).to.be.false;
      });
    });

    describe("XOR", () => {
      const operator = "XOR";
      const oneTrueParams: TestGroupGeneratorParams = {
        numFalseItems: 1,
        numTrueItems: 1,
        operator,
      };
      const oneTrueItem = testGroupGenerator(oneTrueParams);
      const allFalseParams: TestGroupGeneratorParams = {
        numFalseItems: 2,
        operator,
      };
      const allFalseItems = testGroupGenerator(allFalseParams);
      const twoTrueItems = testGroupGenerator({
        numFalseItems: 1,
        numTrueItems: 2,
        operator,
      });
      const oneNestedTrue = testGroupGenerator({
        numFalseItems: 2,
        operator,
        childGroups: [oneTrueParams, allFalseParams],
      });
      const allNestedFalse = testGroupGenerator({
        numFalseItems: 2,
        operator,
        childGroups: [allFalseParams, allFalseParams],
      });

      it("shall return valid: true when items only one item evaluates to true", async () => {
        const res = await validateGroupsWrapper(oneTrueItem);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: false when no items evaluate to true", async () => {
        const res = await validateGroupsWrapper(allFalseItems);
        expect(res.valid).to.be.false;
      });

      it("shall return valid: false when more than one item evaluate to true", async () => {
        const res = await validateGroupsWrapper(twoTrueItems);
        expect(res.valid).to.be.false;
      });

      it("shall return valid: true when only one nested item or group evaluates to true", async () => {
        const res = await validateGroupsWrapper(oneNestedTrue);
        expect(res.valid).to.be.true;
      });

      it("shall return valid: false when no items or groups evaluate to true", async () => {
        const res = await validateGroupsWrapper(allNestedFalse);
        expect(res.valid).to.be.false;
      });
    });
  });
});
