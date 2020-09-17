/* eslint-disable import/named */
import { Dict, IToken } from "../tokenizer/types";

export const TAG = "tag";
export const TEXT = "text";
// Do wee need to ckeck apace before/after or datasource

export interface IRulePattern {
  type: typeof TAG | typeof TEXT;
  val: string;
  invert?: boolean;
}
export interface IRuleAction {
  type: typeof TAG;
  val: string;
  invert?: boolean;
}

export interface IRoleAtom {
  min: number;
  max: number;
  // greedy: boolean;
  patterns: IRulePattern[][];
  actions: IRuleAction[];
}

export interface IRule {
  id: string;
  priority: number;
  atoms: IRoleAtom[];
}

// Sample:
// const ruleSample = [
//     {
//         min: 1,
//         max: 1,
//         patterns: [ //All level
//             [  //ANY level
//                 { type: 'text', val: 'is'},
//                 { type: 'tag', val: 'ALPHA'}
//             ]
//         ],
//         actions: [
//             { type: 'tag', '10'}
//         ]
//     }
// ];

export function applyRules(tokens: IToken[], rules: IRule[]) {
  const res = rules.forEach((rule) => applyRule(tokens, rule));
  return res;
}

export function isMatch(token: IToken, atom: IRoleAtom) {
  const tags = token.tags || [];
  for (let i = 0; i < atom.patterns.length; i += 1) {
    // AND
    const andPatterns = atom.patterns[i];
    let anyOk = false;
    for (let j = 0; !anyOk && j < andPatterns.length; j += 1) {
      // OR
      const patt = andPatterns[j];
      const psevdoTrue = !patt.invert;
      switch (patt.type) {
        case TAG:
          anyOk = tags.indexOf(patt.val) >= 0 ? psevdoTrue : !psevdoTrue;
          break;
        case TEXT:
          anyOk = token.text === patt.val ? psevdoTrue : !psevdoTrue;
          break;
        default:
          throw new Error(`Unknown pattern type ${patt.type}`);
      }
    }
    if (!anyOk) {
      // No one rule matched
      return false;
    }
  }
  return true;
}

export function applyRule(tokens: IToken[], rule: IRule) {
  const text = tokens;
  // State mashine n to n token to rule item
  let textP = 0;
  let textPeekP = 0;
  let ruleP = 0;
  let i = 0;
  let curCount = 0;
  let maxIterations = 0;

  const getToken = () => {
    return text[textPeekP];
  };
  const nextToken = () => {
    textP += 1;
    textPeekP = textP;
    return getToken();
  };
  const peekToken = () => {
    const token = getToken();
    textPeekP += 1;
    return token;
  };

  const getPattern = () => rule.atoms[ruleP];
  const nextPattern = () => {
    ruleP += 1;
    curCount = 0;
    return getPattern();
  };

  const ruleFailed = () => {
    maxIterations = -1;
  };
  const ruleSuccesed = () => ruleP > rule.atoms.length && maxIterations > 0;
  const resetRule = (pos: number) => {
    textP = pos;
    ruleP = 0;
    maxIterations = 100;
  };

  const skipSuccessMatch = () => {
    i = textP;
  };
  const saveSuccessMatch = () => 1;

  const lastStartPos = text.length - rule.atoms.length;
  for (i = 0; i < lastStartPos; i += 1) {
    resetRule(i);
    while (maxIterations > 0) {
      maxIterations -= 1;
      if (isMatch(getToken(), getPattern())) {
        nextToken();
        nextPattern();
      } else if (getPattern().min === 0) {
        nextPattern();
      } else {
        ruleFailed();
      }
      if (ruleSuccesed()) {
        // Rule Matched succesifly
        saveSuccessMatch();
        skipSuccessMatch();
      }
    }
  }
}
