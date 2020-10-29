export type Dict = { [key: string]: string };

export interface IToken {
  id?: string; // Optional not handled by this lib
  text: string;
  pre?: string;
  post?: string;
  tags?: string[];
  val?: Dict;
  tScore?: number;
  pos?: number;
}

export interface IRegexpItem {
  reg?: RegExp;
  tokenType?: string;
  priority?: number;
  concatPrev?: boolean;
}

export const nullToken: IToken = { text: "" };

export type ExtendedTokenizerCallback = (
  str: string,
  guessList: IToken[],
  prevToken: IToken
) => Promise<IToken>;
export type TokenizerCallback = ExtendedTokenizerCallback;

export type AddRegexp = (reg: RegExp, opts?: IRegexpItem) => void;
export type AddCallback = (callback: TokenizerCallback) => void;
export type TokenizerInit = (
  addRegexp: AddRegexp,
  addCallback: AddCallback
) => void;

// Matcher types
export const TAG = "tag";
export const TEXT = "text";
export const TEXT_CASE_INSENSITIVE = "text_i_case";
// Do wee need to ckeck apace before/after or datasource

export interface IRulePattern {
  type: typeof TAG | typeof TEXT | typeof TEXT_CASE_INSENSITIVE;
  anyOfVal: string[];
  invert?: boolean;
}
export interface IRuleAction {
  type: typeof TAG;
  val: string;
  invert?: boolean;
}

export interface IRoleAtom {
  min?: number;
  max?: number;
  // greedy: boolean;
  patterns: IRulePattern[];
  actions: IRuleAction[];
}

export interface IRule {
  idx?: number;
  id: string;
  disabled?: boolean;
  priority: number;
  atoms: IRoleAtom[];
}

export interface IMatchItem {
  textPos: number;
  rulePos: number;
  mp: number; // Matched patterns count
}

export interface IRuleMatch {
  ruleId: string;
  matchStart: number;
  matchEnd: number;
  priority: number;
  list: IMatchItem[];
}
