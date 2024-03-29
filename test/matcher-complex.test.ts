/* eslint-disable import/named */
import { expect } from "chai";
// eslint-disable-next-line import/named
import { tokenize } from "../src/tokenizer/index";
import { applyRules, amplifiers } from "../src/matcher";
import { standardCallbacks } from "../src/tokenizer/presets";
import { TAG, IToken, TEXT } from "../src/tokenizer/types";

describe("src/matcher Complex", () => {
  describe("applyRules", async () => {
    const simple = "Simple 10st string email@dot.com";
    let simpleTokenized: IToken[] = [];
    const simpleEx = `${simple} END `;
    let simpleExTokenized: IToken[] = [];
    before("Tokenize", async () => {
      simpleTokenized = await tokenize(simple, standardCallbacks);
      simpleExTokenized = await tokenize(simpleEx, standardCallbacks);
    });
    it("Simple rule at end", () => {
      expect(
        applyRules(simpleTokenized, [
          {
            id: "simple",
            priority: 100,
            atoms: [
              {
                min: 1,
                max: 1,
                patterns: [
                  {
                    type: TAG,
                    anyOfVal: ["EMAIL"],
                  },
                ],
                actions: [
                  {
                    type: TAG,
                    val: "FOUND",
                  },
                ],
              },
            ],
          },
        ])
      ).be.deep.equal([
        {
          list: [
            {
              rulePos: 0,
              textPos: 4,
              mp: amplifiers.tokenMatch + amplifiers.tagMatch,
            },
          ],
          matchEnd: 0,
          matchStart: 4,
          priority:
            100 +
            amplifiers.tokenMatch * 1 +
            amplifiers.tagMatch * 1 +
            amplifiers.exactMatch * 0,
          ruleId: "simple",
        },
      ]);
    });

    it("Simple rule at middle", () => {
      expect(
        applyRules(simpleExTokenized, [
          {
            id: "simple",
            priority: 100,
            atoms: [
              {
                min: 1,
                max: 1,
                patterns: [
                  {
                    type: TAG,
                    anyOfVal: ["EMAIL"],
                  },
                ],
                actions: [
                  {
                    type: TAG,
                    val: "FOUND",
                  },
                ],
              },
            ],
          },
        ])
      ).be.deep.equal([
        {
          list: [
            {
              rulePos: 0,
              textPos: 4,
              mp: amplifiers.tokenMatch + amplifiers.tagMatch,
            },
          ],
          matchEnd: 0,
          matchStart: 4,
          priority:
            100 +
            amplifiers.tokenMatch * 1 +
            amplifiers.tagMatch * 1 +
            amplifiers.exactMatch * 0,
          ruleId: "simple",
        },
      ]);
    });

    it("Simple 2 token rule at end", () => {
      expect(
        applyRules(simpleTokenized, [
          {
            id: "simple2",
            priority: 100,
            atoms: [
              {
                min: 1,
                max: 1,
                patterns: [
                  {
                    type: TEXT,
                    anyOfVal: ["string"],
                  },
                ],
                actions: [],
              },
              {
                min: 1,
                max: 1,
                patterns: [
                  {
                    type: TAG,
                    anyOfVal: ["EMAIL"],
                  },
                ],
                actions: [
                  {
                    type: TAG,
                    val: "FOUND",
                  },
                ],
              },
            ],
          },
        ])
      ).be.deep.equal([
        {
          list: [
            {
              rulePos: 0,
              textPos: 3,
              mp: amplifiers.tokenMatch + amplifiers.exactMatch,
            },
            {
              rulePos: 1,
              textPos: 4,
              mp: amplifiers.tokenMatch + amplifiers.tagMatch,
            },
          ],
          matchEnd: 0,
          matchStart: 3,
          priority:
            100 +
            amplifiers.tokenMatch * 2 +
            amplifiers.tagMatch * 1 +
            amplifiers.exactMatch * 1,
          ruleId: "simple2",
        },
      ]);
    });
  });
});
