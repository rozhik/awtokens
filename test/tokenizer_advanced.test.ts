import { expect } from "chai";
// eslint-disable-next-line import/named
import { IToken, tokenize } from "../src/tokenizer/index";

describe("Tokenizer advanced", () => {
  describe("Tocken tagging", async () => {
    function tokenInfoToTokenTagPair(list: IToken[]): string[][] {
      return list.map((item) => [item.text, (item.tags && item.tags[0]) || ""]);
    }

    it("Handling regAvoid", async () => {
      const res = await tokenize(
        "Hi,123 10,200.30 4,55 3,576 4`111.5zz 5'123,456 6'123,35z",
        (addRegexp) => {
          addRegexp(/^[a-zA-Z]+/, { tokenType: "ALPHA", priority: 0.3 });
          addRegexp(/^[0-9]+/, { tokenType: "NUM", regAvoid: /^[.,`'"]/ });
          addRegexp(/^\d+[,`']\d\d\d\.\d+/, {
            tokenType: "NUMGRP",
            regAvoid: /^\d/,
          });
          addRegexp(/^\d+[\.`']\d\d\d\,\d\d/, {
            tokenType: "USNUMGRP",
            regAvoid: /^\d/,
          });
          addRegexp(/^\d+,\d\d\d/, { tokenType: "USNUM2", regAvoid: /^\d/ });
          addRegexp(/^\d+,\d\d/, { tokenType: "NUM2", regAvoid: /^\d/ });
        }
      );
      expect(tokenInfoToTokenTagPair(res)).be.deep.equal([
        ["Hi", "ALPHA"],
        [",", ""],
        ["123", "NUM"],
        ["10,200.30", "NUMGRP"],
        ["4,55", "NUM2"],
        ["3,576", "USNUM2"],
        ["4`111.5", "NUMGRP"],
        ["zz", "ALPHA"],
        ["5", ""],
        ["'", ""],
        ["123,456", "USNUM2"],
        ["6'123,35", "USNUMGRP"],
        ["z", "ALPHA"],
      ]);
    });

    it("Handling requiredPrevTag", async () => {
      const res = await tokenize(
        "123 45 67 tel: 123 45 67. tel: 123-45-67. tel: 123 45 67 89",
        (addRegexp) => {
          addRegexp(/^\d+/, { tokenType: "NUM" });
          addRegexp(/^tel:/, { tokenType: "TELCTX" });
          addRegexp(/^\d{3,3}[\s-]?\d{2,2}[\s-]?\d{2,2}/, {
            tokenType: "TEL",
            regAvoid: /^\d/,
            requiredPrevTag: ["TELCTX"],
          });
        }
      );
      expect(tokenInfoToTokenTagPair(res)).be.deep.equal([
        ["123", "NUM"],
        ["45", "NUM"],
        ["67", "NUM"],
        ["tel:", "TELCTX"],
        ["123 45 67", "TEL"],
        [".", ""],
        ["tel:", "TELCTX"],
        ["123-45-67", "TEL"],
        [".", ""],
        ["tel:", "TELCTX"],
        ["123 45 67", "TEL"],
        ["89", "NUM"],
      ]);
    });
  });
});
