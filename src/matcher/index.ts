/* eslint-disable import/named */
import {
  IToken,
  TAG,
  TEXT,
  VAL,
  IRoleAtom,
  IRule,
  IRuleMatch,
  IMatchItem,
  TEXT_CASE_INSENSITIVE,
} from "../tokenizer/types";

export const amplifiers = {
  exactMatch: 5,
  caseMatch: 3,
  tagMatch: 1,
  valMatch: 1,
  tokenMatch: 10,
};

export { IToken, TAG, TEXT, IRoleAtom, IRule, IRuleMatch };

export function getMatchCnt(token: IToken, atom: IRoleAtom): number {
  const tags = token.tags || [];
  const itext = (token.text || "").toLowerCase();
  let priority = amplifiers.tokenMatch;
  for (let i = 0; i < atom.patterns.length; i += 1) {
    // AND
    const patt = atom.patterns[i];
    let partPriority = 0;
    let anyOk = false;
    const psevdoTrue = !patt.invert;
    switch (patt.type) {
      case TAG:
        partPriority =
          patt.anyOfVal.filter((val) => tags.indexOf(val) >= 0).length *
          amplifiers.tagMatch;
        break;
      case TEXT:
        partPriority =
          patt.anyOfVal.filter((val) => token.text === val).length *
          amplifiers.exactMatch;
        break;
      case TEXT_CASE_INSENSITIVE:
        partPriority =
          patt.anyOfVal.filter((val) => itext === val).length *
          amplifiers.caseMatch;
        break;
      case VAL:
        partPriority =
          patt.anyOfVal.filter(
            (val) => token.val && token.val[patt.key || ""] === val
          ).length * amplifiers.valMatch;
        break;
      default:
        throw new Error(`Unknown pattern type ${patt.type}`);
    }
    anyOk = partPriority ? psevdoTrue : !psevdoTrue;
    if (!anyOk) {
      // No one rule matched
      return 0;
    }
    priority += partPriority;
  }
  return priority;
}
export function isMatch(token: IToken, atom: IRoleAtom): boolean {
  return getMatchCnt(token, atom) !== 0;
}

export function applyRule(tokens: IToken[], rule: IRule): IRuleMatch[] {
  const text = tokens;
  // State mashine n to n token to rule item
  let textP = 0;
  let textPeekP = 0;
  let ruleP = 0;
  let i = 0;
  // let curCount = 0;
  let maxIterations = 0;
  let priority = 0;

  const result: IRuleMatch[] = [];
  if (rule.disabled) {
    return result;
  }

  const getToken = () => {
    return text[textPeekP];
  };
  const nextToken = () => {
    textP += 1;
    textPeekP = textP;
    return getToken();
  };
  // const peekToken = () => {
  //   const token = getToken();
  //   textPeekP += 1;
  //   return token;
  // };

  const getPattern = () => rule.atoms[ruleP];
  const haveMorePatterns = () => ruleP < rule.atoms.length;
  const nextPattern = () => {
    ruleP += 1;
    // curCount = 0;
    return getPattern();
  };

  const ruleFailed = () => {
    maxIterations = -1;
  };
  const isRuleFailed = () => maxIterations < 0;

  const ruleSuccesed = () => ruleP > rule.atoms.length && maxIterations > 0;
  const resetRule = (pos: number) => {
    textP = pos;
    textPeekP = pos;
    ruleP = 0;
    priority = 0;
    maxIterations = 100;
  };

  const skipSuccessMatch = () => {
    i = textP;
  };
  const saveSuccessMatch = () => 1;

  const lastStartPos = text.length - rule.atoms.length + 1;
  for (i = 0; i < lastStartPos; i += 1) {
    resetRule(i);
    const curRule: IRuleMatch = {
      ruleId: rule.id,
      matchStart: i,
      matchEnd: 0,
      priority: 0,
      list: [],
    };
    while (maxIterations > 0 && haveMorePatterns()) {
      maxIterations -= 1;
      const matchItem: IMatchItem = {
        textPos: textP,
        rulePos: ruleP,
        mp: getMatchCnt(getToken(), getPattern()),
      };
      priority += matchItem.mp;
      if (matchItem.mp) {
        curRule.list.push(matchItem);
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
    if (!isRuleFailed()) {
      curRule.priority = (rule.priority || 0) + priority;
      result.push(curRule);
    }
  }
  return result;
}

export function applyRules(tokens: IToken[], rules: IRule[]): IRuleMatch[] {
  const empty: IRuleMatch[] = [];
  const res = rules.reduce(
    (acc: IRuleMatch[], rule: IRule) => [...acc, ...applyRule(tokens, rule)],
    empty
  );
  return res;
}
