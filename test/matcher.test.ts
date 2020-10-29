import { expect } from "chai";
// eslint-disable-next-line import/named
import { IToken, tokenize, nullToken } from "../src/tokenizer/index";
import { isMatch } from "../src/matcher";

const toText = (list: IToken[]): string[] => list.map((item) => item.text);

describe("src/matcher", () => {
  const simple = "Simple 10st string email@dot.com";
  describe("isMatch", () => {
    it("Anything match empty pattern", () => {
      expect(
        isMatch(
          { text: "anything" },
          {
            min: 1,
            max: 1,
            patterns: [],
            actions: [],
          }
        )
      ).be.equal(true);
    });

    it("Text match", () => {
      expect(
        isMatch(
          { text: "anything" },
          {
            min: 1,
            max: 1,
            patterns: [
              {
                type: "text",
                anyOfVal: ["anything"],
              },
            ],
            actions: [],
          }
        )
      ).be.equal(true);
    });

    it("Text match inverted", () => {
      expect(
        isMatch(
          { text: "anything" },
          {
            patterns: [
              {
                type: "text",
                anyOfVal: ["anything"],
                invert: true,
              },
            ],
            actions: [],
          }
        )
      ).be.equal(false);
    });

    it("Tag match", () => {
      expect(
        isMatch(
          { text: "anything", tags: ["TAG1"] },
          {
            min: 1,
            max: 1,
            patterns: [
              {
                type: "tag",
                anyOfVal: ["TAG1"],
              },
            ],
            actions: [],
          }
        )
      ).be.equal(true);
    });

    it("Tag match inverted", () => {
      expect(
        isMatch(
          { text: "anything", tags: ["TAG1"] },
          {
            patterns: [
              {
                type: "tag",
                anyOfVal: ["TAG1"],
                invert: true,
              },
            ],
            actions: [],
          }
        )
      ).be.equal(false);
    });

    it("Tag match not found", () => {
      expect(
        isMatch(
          { text: "anything", tags: ["TAG1"] },
          {
            min: 1,
            max: 1,
            patterns: [
              {
                type: "tag",
                anyOfVal: ["NOT_EXISTS"],
              },
            ],
            actions: [],
          }
        )
      ).be.equal(false);
    });

    it("Tag match inverted not found", () => {
      expect(
        isMatch(
          { text: "anything", tags: ["TAG1"] },
          {
            patterns: [
              {
                type: "tag",
                anyOfVal: ["NOT_EXISTS"],
                invert: true,
              },
            ],
            actions: [],
          }
        )
      ).be.equal(true);
    });

    it("Logical OR", () => {
      expect(
        isMatch(
          { text: "anything", tags: ["TAG1"] },
          {
            patterns: [
              {
                type: "tag",
                anyOfVal: ["NOT_EXISTS", "TAG1"],
              },
            ],
            actions: [],
          }
        )
      ).be.equal(true);
    });

    it("Logical AND", () => {
      expect(
        isMatch(
          { text: "anything", tags: ["TAG1"] },
          {
            min: 1,
            max: 1,
            patterns: [
              {
                type: "tag",
                anyOfVal: ["TAG1"],
              },
              {
                type: "text",
                anyOfVal: ["anything"],
              },
            ],
            actions: [],
          }
        )
      ).be.equal(true);
    });
  });
});
