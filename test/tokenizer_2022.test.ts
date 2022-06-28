import { expect } from "chai";
// eslint-disable-next-line import/named
import { IToken, tokenize } from "../src/tokenizer/index";
// eslint-disable-next-line import/named
import { AddRegexp } from "../src/tokenizer/types";

describe("Tokenizer advanced 2022", () => {
  function tokenInfoToTokenTagFloat(
    list: IToken[],
    tagVal = "FLOAT"
  ): string[][] {
    return list.map((item) => [
      item.text,
      (item.val &&
        (item.val[tagVal] ? `${parseFloat(item.val[tagVal])}` : 0)) ||
        item.text ||
        "",
      (item.tags && item.tags.includes(tagVal) && tagVal) ||
        (item.tags && item.tags[0]) ||
        "",
    ]);
  }

  const emagicFn = (addRegexp: AddRegexp) => {
    const dotFloat = (str: string) => str.replaceAll(/[,`'`]/g, "");
    const commaFloat = (str: string) =>
      str.replaceAll(/[.`']/g, "").replace(/[,]/, ".");
    const avoid = /^[,.'`0-9]/;
    addRegexp(/^[0-9]+/, { tokenType: "NUM", priority: 0.8 });
    addRegexp(/^[0-9]+/, {
      tokenType: "ODD",
      priority: 0.9,
      evaluate: (s) => (parseInt(s, 10) % 2 === 1 ? s : ""),
    });
    // Integer floats
    addRegexp(/^[0-9]+/, {
      tokenType: "FLOAT",
      priority: 0.7,
      regAvoid: avoid,
      evaluate: dotFloat,
    });
    addRegexp(/^\d{1,2}[.`']\d{3,3}/, {
      tokenType: "FLOAT",
      priority: 0.7,
      regAvoid: avoid,
      evaluate: commaFloat,
    });
    addRegexp(/^\d{1,2}[,`']\d{3,3}/, {
      tokenType: "FLOAT",
      priority: 0.81,
      regAvoid: avoid,
      evaluate: dotFloat,
    });
    addRegexp(/^[0-9]+[.][0-9]+/, {
      tokenType: "FLOAT",
      priority: 0.88,
      regAvoid: avoid,
      evaluate: dotFloat,
    });
    addRegexp(/^[0-9]+[,][0-9]{1,2}/, {
      tokenType: "FLOAT",
      priority: 0.88,
      regAvoid: avoid,
      evaluate: commaFloat,
    });
    addRegexp(/^\d{1,3}[,`']\d{3,3}\.\d{1,8}/, {
      tokenType: "FLOAT",
      priority: 0.89,
      regAvoid: /^\d/,
      evaluate: dotFloat,
    });

    addRegexp(/^\d{1,3}[,`']\d{3,3}[,`']\d{3,3}\.\d{1,8}/, {
      tokenType: "FLOAT",
      priority: 0.89,
      regAvoid: /^\d/,
      evaluate: dotFloat,
    });

    addRegexp(/^\d{1,3}[.`']\d{3,3},\d{1,8}/, {
      tokenType: "FLOAT",
      priority: 0.8,
      regAvoid: /^\d/,
      evaluate: commaFloat,
    });
    addRegexp(/^\d{1,3}[.`']\d{3,3}[.`']\d{3,3},\d{1,8}/, {
      tokenType: "FLOAT",
      priority: 0.8,
      regAvoid: /^\d/,
      evaluate: commaFloat,
    });

    addRegexp(/^\p{L}+/u, { tokenType: "ALPHA", priority: 0.3 });
    // addRegexp(/^[\p{L}][0-9\p{L}]+/u, { tokenType: "ALPHA_NUM", priority: 0 }); //Brokes 10x10x100
    addRegexp(/^\p{P}+/u, { tokenType: "PUNCT", priority: 0.0 });
    addRegexp(/^\p{S}+/u, { tokenType: "SYMBOL", priority: 0.8 });
    addRegexp(/^[\r\n]/u, { tokenType: "PARA", priority: 0.8 });
  };

  const dataset = [
    [1, "1", "1,0", "1.0", "1,00", "1.00"],
    [10, "10", "10.0", "10,0", "10.00", "10,00"],
    [100, "100", "100.0", "100,0", "100.00", "100,00"],
    [
      1000,
      "1000",
      "1000.0",
      "1000,0",
      "1000.00",
      "1000,00",
      "1,000.0",
      "1,000.00",
      "1.000",
    ],
    [123.45, "123.45", "123,45"],
    [1234.5, "1234.5", "1234,5", "1,234.50", "1.234,5", "1.234,50"],
    [12345.6, "12345.6", "12345,6", "12,345.60", "12.345,6", "12.345,60"],
    [123456.7, "123456.7", "123456,7", "123,456.70", "123.456,7", "123.456,70"],
    [
      1234567.8,
      "1234567.8",
      "1234567,8",
      "1,234,567.8",
      "1.234.567,8",
      "1.234.567,80",
    ],
  ];
  it("Handle float format propertly", async () => {
    await Promise.all(
      dataset.map(async (fmt) => {
        const [num, ...variants] = fmt;
        const str = variants.map((str) => ` a ${str}`).join(" ");
        const res = await tokenize(str, emagicFn);
        const tp = tokenInfoToTokenTagFloat(res);
        const expected = variants
          .map((tStr) => [
            ["a", "a", "ALPHA"],
            [tStr, `${num}`, "FLOAT"],
          ])
          .flat(1);
        // console.log(`Num ${num} ${str}`, res);
        // console.log(`Num ${num} ${str}`, tp, expected);
        expect(tp).be.deep.equal(expected);
        // console.log(str, res);
      })
    );
  });
  it("Check evaluate filtered", async () => {
    const str = "o 10 e 11 o 123456 e 12345 o 2 e 1";
    const res = await tokenize(str, emagicFn);
    const tp = tokenInfoToTokenTagFloat(res, "ODD");
    const expected = [
      ["o", "o", "ALPHA"],
      ["10", "10", "NUM"],
      ["e", "e", "ALPHA"],
      ["11", "11", "ODD"],
      ["o", "o", "ALPHA"],
      ["123456", "123456", "NUM"],
      ["e", "e", "ALPHA"],
      ["12345", "12345", "ODD"],
      ["o", "o", "ALPHA"],
      ["2", "2", "NUM"],
      ["e", "e", "ALPHA"],
      ["1", "1", "ODD"],
    ];
    expect(tp).be.deep.equal(expected);
  });
});
