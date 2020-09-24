/* eslint-disable import/named */
export { Dict, IToken, tokenize, nullToken } from "./tokenizer";

export {
  charTypeCallbacks,
  standardCallbacks,
  dataCallbacks,
  urlsCallbacks,
} from "./tokenizer/presets";

export {
  applyRules,
  isMatch,
  TAG,
  TEXT,
  IRoleAtom,
  IRule,
  IRuleMatch,
} from "./matcher";
