import { pathToFileURL } from "url";
/* eslint-disable import/named */
import {
  IToken,
  TAG,
  TEXT,
  IRoleAtom,
  IRule,
  IRuleMatch,
} from "../tokenizer/types";

export { IToken, TAG, TEXT, IRoleAtom, IRule, IRuleMatch };

export function isMatch(token: IToken, atom: IRoleAtom): boolean {
  const tags = token.tags || [];
  for (let i = 0; i < atom.patterns.length; i += 1) {
    // AND
    const patt = atom.patterns[i];
    let anyOk = false;
    const psevdoTrue = !patt.invert;
    switch (patt.type) {
      case TAG:
        anyOk = patt.anyOfVal.some((val) => tags.indexOf(val) >= 0)
          ? psevdoTrue
          : !psevdoTrue;
        break;
      case TEXT:
        anyOk = patt.anyOfVal.some((val) => token.text === val)
          ? psevdoTrue
          : !psevdoTrue;
        break;
      default:
        throw new Error(`Unknown pattern type ${patt.type}`);
    }
    if (!anyOk) {
      // No one rule matched
      return false;
    }
  }
  return true;
}

export function applyRule(tokens: IToken[], rule: IRule): IRuleMatch[] {
  const text = tokens;
  // State mashine n to n token to rule item
  let textP = 0;
  let textPeekP = 0;
  let ruleP = 0;
  let i = 0;
  let curCount = 0;
  let maxIterations = 0;

  const result: IRuleMatch[] = [];

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
  const haveMorePatterns = () => ruleP < rule.atoms.length;
  const nextPattern = () => {
    ruleP += 1;
    curCount = 0;
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
      if (isMatch(getToken(), getPattern())) {
        curRule.list.push({
          textPos: textP,
          rulePos: ruleP,
        });
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
