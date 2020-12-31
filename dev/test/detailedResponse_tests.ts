import { expect } from "chai";

import { Comparator } from "../src/comparator";
import {
  getDetailedError,
  getHumanReadableMessage,
  getTranslatedComparator,
} from "../src/detailedResponse";

interface TestItem {
  operand1Id: number;
  operand2Id: number;
  operand1Name: string;
  operand2Name: string;
  operand1Value: number;
  operand2Value: number;
}

const testItem: TestItem = {
  operand1Id: 1,
  operand2Id: 2,
  operand1Name: "First",
  operand2Name: "Second",
  operand1Value: 4,
  operand2Value: 4,
};

const wrappedDetailError = (
  success: boolean,
  item: TestItem,
  comparator?: Comparator
) =>
  getDetailedError({
    success,
    comparator: comparator || "==",
    getOperandDisplayNames: (item) => ({
      operand1Name: item.operand1Name,
      operand2Name: item.operand2Name,
    }),
    getOperandIds: (item) => ({
      operand1Id: item.operand1Id,
      operand2Id: item.operand2Id,
    }),
    item,
    operand1: item.operand1Value,
    operand2: item.operand2Value,
  });

describe("Detailed Response", () => {
  describe("Detailed Error", () => {
    it("shall have properties", () => {
      const res = wrappedDetailError(false, testItem);
      expect(res).to.have.property("errorMessage");
      expect(res).to.have.property("operand1");
      expect(res).to.have.property("operand2");
      expect(res).to.have.property("item");
      expect(res).to.have.property("comparator");
    });
    it("shall NOT have an error message if successful", () => {
      const res = wrappedDetailError(true, testItem);
      expect(res.errorMessage).to.be.undefined;
    });
    it("shall have an error message if not successful", () => {
      const res = wrappedDetailError(false, testItem);
      expect(res.errorMessage).to.be.a("string");
    });
    it("shall override double negative of '!='", () => {
      const res = wrappedDetailError(false, testItem, "!=");
      expect(res.errorMessage).to.not.contain("NOT");
    });
  });
  describe("Message Response", () => {
    it("shall contain 'NOT' in the message if negative is true ", () => {
      const msg = getHumanReadableMessage({
        comparator: "==",
        operand1Name: "First",
        operand2Name: "Second",
        useNegative: true,
      });
      expect(msg).to.contain("NOT");
    });

    it("shall NOT contain the word 'NOT' in the message if negative is falsy ", () => {
      const msg = getHumanReadableMessage({
        comparator: "==",
        operand1Name: "First",
        operand2Name: "Second",
        useNegative: false,
      });
      expect(msg).to.not.contain("NOT");
    });

    it("shall allow the user to override the translated operator", () => {
      const msg = getHumanReadableMessage({
        comparator: "==",
        operand1Name: "First",
        operand2Name: "Second",
        overrideTranslation: () => "TEST OVERRIDE",
      });
      expect(msg).to.contain("TEST OVERRIDE");
    });
  });
  describe("Comparator translation", () => {
    it("shall return a string for '=='", () => {
      const msg = getTranslatedComparator("==");
      expect(msg).to.be.a("string");
    });
    it("shall return a string for '!='", () => {
      const msg = getTranslatedComparator("!=");
      expect(msg).to.be.a("string");
    });
    it("shall return a string for '>'", () => {
      const msg = getTranslatedComparator(">");
      expect(msg).to.be.a("string");
    });
    it("shall return a string for '>='", () => {
      const msg = getTranslatedComparator(">=");
      expect(msg).to.be.a("string");
    });
    it("shall return a string for '<'", () => {
      const msg = getTranslatedComparator("<");
      expect(msg).to.be.a("string");
    });
    it("shall return a string for '<='", () => {
      const msg = getTranslatedComparator("<=");
      expect(msg).to.be.a("string");
    });
  });
});
