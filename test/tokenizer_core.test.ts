import { expect } from "chai";
// eslint-disable-next-line import/named
import { IToken, tokenize, nullToken } from "../src/tokenizer/index";

const toText = (list: IToken[]): string[] => list.map((item) => item.text);
function tokenInfoToTokenTagPair(list: IToken[]): string[][] {
  return list.map((item) => [item.text, (item.tags && item.tags[0]) || ""]);
}

function tokenInfoToTokenValTagPair(list: IToken[]): string[][] {
  return list.map((item) => {
    const tag = (item.tags && item.tags[0]) || "";
    return item.val && item.val[tag] ? [item.val[tag], tag] : [item.text, tag];
  });
}

describe("Tokenizer core", () => {
  const simple = "Simple 10st string email@dot.com";
  describe("No config", async () => {
    it("Create token for each non-space char", async () => {
      const res = await tokenize("one 2two", () => {});

      expect(toText(res)).be.deep.equal(["o", "n", "e", "2", "t", "w", "o"]);
    });
    it("Create token for each non-space char with leading/trailing spaces", async () => {
      const res = await tokenize("  one 2two  ", () => {});

      expect(toText(res)).be.deep.equal(["o", "n", "e", "2", "t", "w", "o"]);
    });
  });

  describe("Regexp", async () => {
    it("Alpha", async () => {
      const res = await tokenize(simple, (addRegexp) => {
        addRegexp(/^[a-zA-Z]+/);
      });
      expect(toText(res)).be.deep.equal([
        "Simple",
        "1",
        "0",
        "st",
        "string",
        "email",
        "@",
        "dot",
        ".",
        "com",
      ]);
    });

    it("Alpha number", async () => {
      const res = await tokenize(simple, (addRegexp) => {
        addRegexp(/^[a-zA-Z0-9]+/);
      });

      expect(toText(res)).be.deep.equal([
        "Simple",
        "10st",
        "string",
        "email",
        "@",
        "dot",
        ".",
        "com",
      ]);
    });

    it("Alpha + email", async () => {
      const res = await tokenize(simple, (addRegexp) => {
        addRegexp(/^[a-zA-Z0-9]+/);
        addRegexp(
          // eslint-disable-next-line no-control-regex
          /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        );
      });
      expect(toText(res)).be.deep.equal([
        "Simple",
        "10st",
        "string",
        "email@dot.com",
      ]);
    });

    it("Alpha + russian", async () => {
      const res = await tokenize("Добрый 10день. Hi here.", (addRegexp) => {
        addRegexp(/^[a-zA-Z0-9]+/);
        addRegexp(/^[а-яА-Я]+/);
      });
      expect(toText(res)).be.deep.equal([
        "Добрый",
        "10",
        "день",
        ".",
        "Hi",
        "here",
        ".",
      ]);
    });
  });
  describe("Callback", async () => {
    it("Mix regexp & standard callbacks ", async () => {
      let callCounter = 0;

      const res = await tokenize(simple, (addRegexp, addCallback) => {
        addRegexp(/^[a-z]+/);
        addRegexp(/^[0-9]+/);
        addCallback(async (chunk) => {
          // eslint-disable-next-line no-plusplus
          callCounter++;
          if (chunk.split(" ")[0] === "10st") {
            return { text: "10st", tScore: 3.9 };
          }
          return nullToken;
        });
      });
      expect(callCounter).be.greaterThan(0);

      expect(toText(res)).be.deep.equal([
        "S",
        "imple",
        "10st",
        "string",
        "email",
        "@",
        "dot",
        ".",
        "com",
      ]);
    });

    describe("Dictionary", async () => {
      it("Dictionary", async () => {
        const res = await tokenize(
          "MON 2 MAR, mon, ",
          (addRegexp, _, addDict) => {
            addRegexp(/^[a-z]+/);
            addRegexp(/^[0-9]+/);
            addDict("MON", { JAN: "1", FEB: "2", MAR: "3" });
            addDict("DAY-OF-WEEK", { MON: "1", TUE: "2", WED: "3" });
          }
        );
        expect(tokenInfoToTokenValTagPair(res)).be.deep.equal([
          ["1", "DAY-OF-WEEK"],
          ["2", ""],
          ["3", "MON"],
          [",", ""],
          ["mon", ""],
          [",", ""],
        ]);
      });

      /*
      it("Trows error on invalid callback", async () => {
        const callCounter = 0;
        let err = null;
  
        expect( tokenize(simple, (_, addCallback) => {
            addCallback(async (chunk) =>
              chunk.split(" ")[0] === "10st" ? { text: "11st" } : nullToken
            );
        ).to.throw( )
        expect(callCounter).be.greaterThan(0);
        expect(err).be.not.null;
      });
      */
    });

    describe("Tocken tagging", async () => {
      it("Correctly set tags for tokens", async () => {
        const res = await tokenize(
          "Hi, 10x for 33 comments 0xf5",
          (addRegexp) => {
            addRegexp(/^0x[0-9a-fA-F]+/, { tokenType: "HEX", priority: 0.9 });
            addRegexp(/^[0-9]+/, { tokenType: "NUM", priority: 0.8 });
            addRegexp(/^[a-zA-Z]+/, { tokenType: "ALPHA", priority: 0.3 });
            addRegexp(/^[a-zA-Z0-9]+/, { tokenType: "ALPHA_NUM", priority: 0 });
          }
        );

        expect(tokenInfoToTokenTagPair(res)).be.deep.equal([
          ["Hi", "ALPHA"],
          [",", ""],
          ["10x", "ALPHA_NUM"],
          ["for", "ALPHA"],
          ["33", "NUM"],
          ["comments", "ALPHA"],
          ["0xf5", "HEX"],
        ]);
      });

      it("Correctly tags spacse for tokens", async () => {
        const res = await tokenize(
          " space n\n nr\n\r rn\r\n r\r",
          (addRegexp) => {
            addRegexp(/^[a-zA-Z]+/, { tokenType: "ALPHA", priority: 0.3 });
            addRegexp(/^\r?\n/, { tokenType: "PARA", priority: 0 });
          }
        );
        expect(tokenInfoToTokenTagPair(res)).be.deep.equal([
          ["space", "ALPHA"],
          ["n", "ALPHA"],
          ["\n", "PARA"],
          ["nr", "ALPHA"],
          ["\n", "PARA"],
          ["\r", ""],
          ["rn", "ALPHA"],
          ["\r\n", "PARA"],
          ["r", "ALPHA"],
          ["\r", ""],
        ]);
      });

      it("Correctly set multiple tags for tokens", async () => {
        const res = await tokenize("0xf5", (addRegexp) => {
          addRegexp(/^0x[0-9a-fA-F]+/, { tokenType: "HEX", priority: 0.9 });
          addRegexp(/^[0-9]+/, { tokenType: "NUM", priority: 0.8 });
          addRegexp(/^[a-zA-Z]+/, { tokenType: "ALPHA", priority: 0.3 });
          addRegexp(/^[a-zA-Z0-9]+/, { tokenType: "ALPHA_NUM", priority: 0.1 });
        });
        expect(res.length).be.equal(1);
        const ordered = res[0].tags && res[0].tags.join(",");
        expect(ordered).be.equal("HEX,ALPHA_NUM");
      });
    });
  });
});
