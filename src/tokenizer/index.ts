interface IRegexpItem {
  reg?: RegExp;
  tokenType?: string;
  priority?: number;
  concatPrev?: boolean;
}

export interface IToken {
  text: string;
  pre?: string;
  post?: string;
  tags?: string[];
  tScore?: number;
  pos?: number;
}
export const nullToken: IToken = { text: "" };

type ExtendedTokenizerCallback = (
  str: string,
  guessList: IToken[],
  prevToken: IToken
) => Promise<IToken>;
export type TokenizerCallback = ExtendedTokenizerCallback;

type AddRegexp = (reg: RegExp, opts?: IRegexpItem) => void;
type AddCallback = (callback: TokenizerCallback) => void;
type TokenizerInit = (addRegexp: AddRegexp, addCallback: AddCallback) => void;

export async function tokenize(
  text: string,
  initCallback: TokenizerInit
): Promise<IToken[]> {
  const regexps: IRegexpItem[] = [];
  const callbacks: TokenizerCallback[] = [];
  const tokens: IToken[] = [];
  const windowSize = 80;

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
        const matched = m[0] || "";
        const ret: IToken = {
          text: matched,
          tags: [reg.tokenType || ""],
          tScore: matched.length + (reg.priority || 0),
        };
        return ret;
      })
    );
    const bestReg = regMatches[0] || null;

    const callbackMatches = matchFilterSort(
      await Promise.all(callbacks.map((cb) => cb(chunk, regMatches, prev)))
    );
    const bestCallback = callbackMatches[0] || null;
    return bestCallback || bestReg || { text: chunk.substring(0, 1) };
  };

  const process = async (): Promise<void> => {
    let pos = 0;
    let chunk = "";
    let token = nullToken;

    const peekSpace = (str: string): string => {
      const res = str.match(/^(\s+)/);
      return res === null ? "" : res[1];
    };

    const skipChars = (str: string) => {
      const len = str.length;
      if (text.substring(pos, pos + len) !== str) {
        throw new Error(
          `Try to skip wrong chars ${JSON.stringify(str)} on ${JSON.stringify(
            chunk
          )}`
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
    (callback) => callbacks.push(callback)
  );
  await process();

  return tokens;
}
