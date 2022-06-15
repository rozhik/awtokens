/* eslint-disable import/named */
import {
  Dict,
  IToken,
  IRegexpItem,
  TokenizerCallback,
  TokenizerInit,
} from "./types";

export { Dict, IToken };

export const nullToken: IToken = { text: "" };

export async function tokenize(
  text: string,
  initCallback: TokenizerInit
): Promise<IToken[]> {
  const regexps: IRegexpItem[] = [];
  const callbacks: TokenizerCallback[] = [];
  const tokens: IToken[] = [];
  const windowSize = 80;
  const defEval = (s: string) => s;

  const getBestToken = async (chunk: string, prev: IToken): Promise<IToken> => {
    const matchFilterSort = (list: IToken[]): IToken[] =>
      list
        .filter((match) => match && match.text !== "")
        .sort((a, b) => ((a?.tScore || 0) < (b?.tScore || 0) ? 1 : -1));

    const regMatches = matchFilterSort(
      regexps.map((reg) => {
        const m = reg.reg && chunk.match(reg.reg);
        if (!m) {
          return nullToken;
        }
        const matched = m[reg.regPos || 0] || "";
        if (reg.requiredPrevTag) {
          if (
            !prev ||
            !prev.tags ||
            (!prev.tags.length &&
              prev.tags.findIndex((prevTag) => {
                const idx = reg.requiredPrevTag?.indexOf(prevTag);
                return idx && idx > 0;
              }))
          ) {
            return nullToken;
          }
        }
        if (reg.regAvoid) {
          const tail = chunk.substring(matched.length);
          if (tail.match(reg.regAvoid)) return nullToken;
        }
        const ret: IToken = {
          text: matched,
          val: { [reg.tokenType || ""]: (reg.evaluate || defEval)(matched) },
          tags: [reg.tokenType || ""],
          tScore: matched.length + (reg.priority || 0),
        };
        return ret;
      })
    );
    const callbackMatches = matchFilterSort(
      await Promise.all(callbacks.map((cb) => cb(chunk, regMatches, prev)))
    );

    const allMatches = matchFilterSort([...regMatches, ...callbackMatches]);

    const best =
      allMatches.length > 0 ? allMatches[0] : { text: chunk.substring(0, 1) };

    const tags = allMatches.reduce((acc: string[], tok: IToken): string[] => {
      if (best.text === tok.text && tok.tags) {
        return [...acc, ...(tok.tags || [])];
      }
      return acc;
    }, []);

    const val = allMatches.reduce((acc: Dict, tok: IToken): Dict => {
      if (best.text === tok.text && tok.tags) {
        return {
          ...(acc || {}),
          ...(tok.val || {}),
        };
      }
      return acc;
    }, {});
    best.tags = tags;
    return {
      ...best,
      tags,
      val,
    };
  };

  const process = async (): Promise<void> => {
    let pos = 0;
    let chunk = "";
    let token = nullToken;

    const peekSpace = (str: string): string => {
      const res = str.match(
        /^([\t \u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]+)/
      );
      return res === null ? "" : res[1];
    };

    const skipChars = (str: string) => {
      const len = str.length;
      if (text.substring(pos, pos + len) !== str) {
        throw new Error(
          `Try to skip wrong chars ${JSON.stringify(str)} vs ${JSON.stringify(
            text.substring(pos, pos + len)
          )} on ${JSON.stringify(text)} pos: ${pos}`
        );
      }
      pos += len;
      chunk = text.substring(pos, pos + windowSize);
    };

    skipChars("");
    do {
      const preSpace = peekSpace(chunk);
      skipChars(preSpace);

      // eslint-disable-next-line no-await-in-loop
      token = await getBestToken(chunk, token);
      token.pos = pos;
      skipChars(token.text);

      const spaceAfter = peekSpace(chunk);
      skipChars(spaceAfter);
      if (preSpace !== "") {
        token.pre = preSpace;
      }
      if (spaceAfter !== "") {
        token.post = spaceAfter;
      }
      if (preSpace === "" && spaceAfter === "" && token.text === "") {
        // Error! cannot go forward
        return;
      }
      tokens.push(token);
      // eslint-disable-next-line no-constant-condition
    } while (true);
  };
  // CODE BEGIN

  initCallback(
    (reg, options) => {
      const opts = options || {};
      regexps.push({
        ...opts,
        reg: reg || opts.reg,
      });
    },
    (callback) => callbacks.push(callback),
    (tag, dict) =>
      callbacks.push(async (chunk) => {
        const m = chunk.match(/^[\p{L}][0-9\p{L}\u2070-\u209c]*/u);
        if (!m || !m[0]) return nullToken;
        const word = m[0];
        return word in dict
          ? {
              text: word,
              tags: [tag],
              tScore: word.length + 0.99,
              val: { [tag]: dict[word] },
            }
          : nullToken;
      })
  );
  await process();

  return tokens;
}
