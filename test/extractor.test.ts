import { expect } from "chai";
// eslint-disable-next-line import/named
import { IToken, tokenize } from "../src/tokenizer/index";
import { IRule } from "../src/matcher";
import { findBest, findTagsRegions, rulesToContext } from "../src/extractor";

const parcelSample = `Please see attached an arrange booking ex MEL – KUL
232-45429366
36 x 25 x 28cm – 2kg (UN3363)
51 x 39 x 28 – 11kg
2x 52 x 35 x 34cm – 5kg`;

const rules: IRule[] = [
  {
    id: "IATA-IATA",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["IATA"] }],
        actions: [{ type: "tag", val: "FROM-IATA" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-", "to", "–"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["IATA"] }],
        actions: [{ type: "tag", val: "TO-IATA" }],
      },
    ],
  },

  {
    id: "Simple-awbid",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["AWB"] }],
        actions: [{ type: "tag", val: "SET-AWB" }],
      },
    ],
  },

  {
    id: "cnt-l-w-h-w",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-CNT" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["x"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-L" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["x"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-W" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["x"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-H" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["cm"] }],
        actions: [{ type: "tag", val: "P-UNIT" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-", "–"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-MASS" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["kg"] }],
        actions: [{ type: "tag", val: "P-MASS-UNIT" }],
      },
    ],
  },

  {
    id: "l-w-h-w",
    priority: 0,
    atoms: [
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-L" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["x"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-W" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["x"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-H" }],
      },
      {
        min: 0,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["cm"] }],
        actions: [{ type: "tag", val: "P-UNIT" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["-", "–"] }],
        actions: [],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "tag", anyOfVal: ["NUM"] }],
        actions: [{ type: "tag", val: "P-MASS" }],
      },
      {
        min: 1,
        max: 1,
        patterns: [{ type: "text", anyOfVal: ["kg"] }],
        actions: [{ type: "tag", val: "P-MASS-UNIT" }],
      },
    ],
  },
];

function tokensToObject(tokens: IToken[], myRules: IRule[]): Object {
  const range = rulesToContext(tokens, myRules);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret: any = range
    ? {
        origin_iata: findBest(range, "FROM-IATA").val,
        dest_iata: findBest(range, "TO-IATA").val,
        awb_id: findBest(range, "SET-AWB").val,
        pieces: findTagsRegions(range, ["P-L", "P-W", "P-H", "P-CNT"])
          .map((region) => {
            return {
              qty: parseInt(findBest(region, "P-CNT").val || "", 10) || 1,
              leng: parseInt(findBest(region, "P-L").val || "", 10) || 1,
              width: parseInt(findBest(region, "P-W").val || "", 10) || 1,
              height: parseInt(findBest(region, "P-H").val || "", 10) || 1,
              weight: parseInt(findBest(region, "P-MASS").val || "", 10) || 1,
            };
          })
          .filter((a: any) => a.leng && a.width && a.height),
      }
    : {};
  return ret;
}

describe("src/extractor", () => {
  let tokens: IToken[] = [];
  before("Tokenize", async () => {
    tokens = await tokenize(parcelSample, (addRegexp) => {
      addRegexp(/^[0-9]+/, { tokenType: "NUM", priority: 0.8 });
      addRegexp(/^[0-9]+[\.\,][0-9]+/, { tokenType: "FLOAT", priority: 0.8 });
      addRegexp(/^\p{L}+/u, { tokenType: "ALPHA", priority: 0.3 });
      // addRegexp(/^[\p{L}][0-9\p{L}]+/u, { tokenType: "ALPHA_NUM", priority: 0 }); //Brokes 10x10x100
      addRegexp(/^\p{P}+/u, { tokenType: "PUNCT", priority: 0.0 });
      addRegexp(/^\p{S}+/u, { tokenType: "SYMBOL", priority: 0.8 });
      addRegexp(/^[\r\n]/u, { tokenType: "PARA", priority: 0.8 });
      addRegexp(/^[A-Z]{3,3}/u, { tokenType: "IATA", priority: 0.8 });

      addRegexp(/^\w{3,4}[\-\s]\d{4,4}\s{0,2}?\d{3,4}/u, {
        tokenType: "AWB",
        priority: 0.0,
      });
    });
  });

  describe("extract awery sample", () => {
    it("Should produce correct object", () => {
      expect(tokens.length).be.greaterThan(0);
      // const matches: IRuleMatch[] = applyRules(tokens, rules);
      const obj = tokensToObject(tokens, rules);
      expect(obj).be.deep.equal({
        origin_iata: "MEL",
        dest_iata: "KUL",
        awb_id: "232-45429366",
        pieces: [
          { qty: 1, leng: 36, width: 25, height: 28, weight: 2 },
          { qty: 2, leng: 51, width: 39, height: 28, weight: 11 },
          { qty: 1, leng: 52, width: 35, height: 34, weight: 5 },
        ],
      });
    });
  });
});
