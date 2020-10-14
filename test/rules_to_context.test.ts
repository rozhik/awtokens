import { expect } from "chai";
// eslint-disable-next-line import/named
import { IToken, tokenize } from "../src/tokenizer/index";
import { IRule } from "../src/matcher";
import {
  findBest,
  findTagsRegions,
  rulesToContext,
  RangeContext,
} from "../src/extractor";

const parcelSample = `
1-2 end
1-2-3 end
1-2-3-4 end
1 cm end
1 - 2 cm end
1 - 2 - 3 cm end
1 - 2 - 3 -4 cm end
`;

const rulesNum: IRule[] = [
  {
    id: "rEnd",
    priority: 10,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["end"] }],
        actions: [{ type: "tag", val: "end" }],
      },
    ],
  },
  {
    id: "r1-2",
    priority: 10,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2_p0" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2_p1" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2_p2" }],
      },
    ],
  },
  {
    id: "r1-2-3",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3_p0" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2-3_p1" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3_p2" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2-3_p3" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3_p4" }],
      },
    ],
  },

  {
    id: "r1-2-3-4",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p0" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p1" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p2" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p3" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p4" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p5" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2-3-4_p6" }],
      },
    ],
  },
];
const rulesCm: IRule[] = [
  {
    id: "r1cm",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1cm_p0" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["cm"] }],
        actions: [{ type: "tag", val: "r1cm_p1" }],
      },
    ],
  },

  {
    id: "r1-2cm",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2cm_p0" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-"] }],
        actions: [{ type: "tag", val: "r1-2cm_p1" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "r1-2cm_p2" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["cm"] }],
        actions: [{ type: "tag", val: "r1-2cm_p3" }],
      },
    ],
  },
];

function getMatchedRuleListFor(
  tag: string,
  range: RangeContext | null
): string[] {
  if (range) {
    return range.matches
      .filter((m) => m.setTag === tag)
      .map((m) => m.all.map((r) => r.ruleId).join(","))
      .sort();
  }

  return [];
}
describe("src/extractor", () => {
  describe("rulesToContext", async () => {
    let tokens: IToken[] = [];

    before("tokenize", async () => {
      tokens = await tokenize(parcelSample, (addRegexp) => {
        addRegexp(/^[0-9]+/, { tokenType: "NUM", priority: 0.8 });
        addRegexp(/^\p{L}+/u, { tokenType: "ALPHA", priority: 0.3 });
      });
    });

    it("Rules stated at same place", () => {
      const context = rulesToContext(tokens, rulesNum);
      expect(
        context?.matches.map((m) => m.setTag || "").filter((m) => !!m)
      ).be.deep.equal([
        "r1-2_p0",
        "r1-2_p1",
        "r1-2_p2",
        "end",
        "r1-2-3_p0",
        "r1-2-3_p1",
        "r1-2-3_p2",
        "r1-2-3_p3",
        "r1-2-3_p4",
        "end",
        "r1-2-3-4_p0",
        "r1-2-3-4_p1",
        "r1-2-3-4_p2",
        "r1-2-3-4_p3",
        "r1-2-3-4_p4",
        "r1-2-3-4_p5",
        "r1-2-3-4_p6",
        "end",
        "end",
        "r1-2_p0",
        "r1-2_p1",
        "r1-2_p2",
        "end",
        "r1-2-3_p0",
        "r1-2-3_p1",
        "r1-2-3_p2",
        "r1-2-3_p3",
        "r1-2-3_p4",
        "end",
        "r1-2-3-4_p0",
        "r1-2-3-4_p1",
        "r1-2-3-4_p2",
        "r1-2-3-4_p3",
        "r1-2-3-4_p4",
        "r1-2-3-4_p5",
        "r1-2-3-4_p6",
        "end",
      ]);
    });

    it("Rules ended at same place", () => {
      const context = rulesToContext(tokens, rulesCm);
      expect(
        context?.matches.map((m) => m.setTag || "").filter((m) => !!m)
      ).be.deep.equal([
        "r1cm_p0",
        "r1cm_p1",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
      ]);
    });

    it("Mix rules", () => {
      const context = rulesToContext(tokens, [...rulesNum, ...rulesCm]);
      expect(
        context?.matches.map((m) => m.setTag || "").filter((m) => !!m)
      ).be.deep.equal([
        "r1-2_p0",
        "r1-2_p1",
        "r1-2_p2",
        "end",
        "r1-2-3_p0",
        "r1-2-3_p1",
        "r1-2-3_p2",
        "r1-2-3_p3",
        "r1-2-3_p4",
        "end",
        "r1-2-3-4_p0",
        "r1-2-3-4_p1",
        "r1-2-3-4_p2",
        "r1-2-3-4_p3",
        "r1-2-3-4_p4",
        "r1-2-3-4_p5",
        "r1-2-3-4_p6",
        "end",
        "r1cm_p0",
        "r1cm_p1",
        "end",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
        "end",
        "r1-2-3_p0",
        "r1-2-3_p1",
        "r1-2-3_p2",
        "r1-2-3_p3",
        "r1-2-3_p4",
        "r1-2cm_p3",
        "end",
        "r1-2-3-4_p0",
        "r1-2-3-4_p1",
        "r1-2-3-4_p2",
        "r1-2-3-4_p3",
        "r1-2-3-4_p4",
        "r1-2-3-4_p5",
        "r1-2-3-4_p6",
        "r1-2cm_p3",
        "end",
      ]);
    });

    it("Mix rules with CM prioritized", () => {
      const rulesCmPrioritized = rulesCm.map((rule) => ({
        ...rule,
        priority: 100,
      }));
      const context = rulesToContext(tokens, [
        ...rulesNum,
        ...rulesCmPrioritized,
      ]);
      expect(
        context?.matches.map((m) => m.setTag || "").filter((m) => !!m)
      ).be.deep.equal([
        "r1-2_p0",
        "r1-2_p1",
        "r1-2_p2",
        "end",
        "r1-2-3_p0",
        "r1-2-3_p1",
        "r1-2-3_p2",
        "r1-2-3_p3",
        "r1-2-3_p4",
        "end",
        "r1-2-3-4_p0",
        "r1-2-3-4_p1",
        "r1-2-3-4_p2",
        "r1-2-3-4_p3",
        "r1-2-3-4_p4",
        "r1-2-3-4_p5",
        "r1-2-3-4_p6",
        "end",
        "r1cm_p0",
        "r1cm_p1",
        "end",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
        "end",
        "r1-2-3_p0",
        "r1-2-3_p1",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
        "end",
        "r1-2-3-4_p0",
        "r1-2-3-4_p1",
        "r1-2-3-4_p2",
        "r1-2-3-4_p3",
        "r1-2cm_p0",
        "r1-2cm_p1",
        "r1-2cm_p2",
        "r1-2cm_p3",
        "end",
      ]);

      expect(getMatchedRuleListFor("r1-2cm_p2", context)).to.deep.equal([
        "r1-2cm,r1cm,r1-2",
        "r1-2cm,r1cm,r1-2-3,r1-2",
        "r1-2cm,r1cm,r1-2-3-4,r1-2-3,r1-2",
      ]);
      expect(getMatchedRuleListFor("r1-2cm_p0", context)).to.deep.equal([
        "r1-2cm,r1-2",
        "r1-2cm,r1-2-3,r1-2,r1-2",
        "r1-2cm,r1-2-3-4,r1-2-3,r1-2-3,r1-2,r1-2",
      ]);
    });
  });
});
