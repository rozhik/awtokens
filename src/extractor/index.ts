/* eslint-disable import/prefer-default-export */

import { IRule, IToken } from "../tokenizer/types";
import { applyRules } from "../matcher";

type Range = { start: number; end: number };
type Dict<T> = { [key: string]: T };

export type Match = {
  ruleId: string;
  priority: number;
  rulePos: number;
  inst?: number; // Match instance
};

export type TagsMatch = {
  all: Match[];
  setTag: string;
  text: string;
  // values:
};

type RangeContext = {
  range: Range;
  tokens: IToken[];
  rules: IRule[];
  matches: TagsMatch[];
};

export const rulesToContext = (
  tokens: IToken[],
  rules: IRule[]
): RangeContext | null => {
  type ArrayIndex = { [key: string]: number };
  const emptyIndex: ArrayIndex = {};
  const rulesmap: ArrayIndex = rules.reduce(
    (acc, rule, idx) => ({
      ...acc,
      [rule.id]: idx,
    }),
    emptyIndex
  );
  const ar = applyRules(tokens, rules);
  if (!ar) return null;
  const tMatch: { [pos: number]: Match[] } = {};
  // Transforming matches
  ar.forEach((m, inst) => {
    m.list.forEach((it) => {
      // it.rulePos; it.textPos
      tMatch[it.textPos] = [
        ...(tMatch[it.textPos] || []),
        {
          ruleId: m.ruleId,
          priority: m.priority,
          rulePos: it.rulePos,
          inst,
        },
      ];
    });
  });
  const tagsMatch: TagsMatch[] = tokens.map((tok, idx) => {
    const all = (tMatch[idx] || []).sort((a, b) =>
      a.priority > b.priority ? 1 : -1
    );
    const res: TagsMatch = {
      all,
      text: tok.text,
      setTag:
        rules[
          Number.isInteger(rulesmap[all[0]?.ruleId])
            ? rulesmap[all[0]?.ruleId]
            : -1
        ]?.atoms[all[0]?.rulePos]?.actions[0]?.val || "",
    };
    return res;
  });
  return {
    matches: tagsMatch,
    range: { start: 0, end: tokens.length },
    rules,
    tokens,
  };
};

export const findBestToken = (
  { matches, range }: RangeContext,
  tag: string
): number => {
  let maxPrio = -100;
  let bestTagIdx = -1;
  for (let i = range.start; i < range.end; i += 1) {
    if (matches[i]?.setTag === tag && matches[i]?.all[0].priority > maxPrio) {
      maxPrio = matches[i]?.all[0].priority;
      bestTagIdx = i;
    }
  }
  return bestTagIdx;
};

export const findTagsRegions = (
  { matches, range, ...rest }: RangeContext,
  tags: string[]
): RangeContext[] => {
  const ret: RangeContext[] = [];
  const tagsDict: Dict<boolean> = tags.reduce(
    (acc, tag): Dict<boolean> => ({
      ...acc,
      [tag]: true,
    }),
    {}
  );
  let foundTags: Dict<number> = {};
  let breakIdx = range.start;
  for (let i = range.start; i < range.end; i += 1) {
    const m = matches[i];
    if (tagsDict[m.setTag]) {
      // Found important tag to set
      if (foundTags[m.setTag]) {
        // Breaking range
        foundTags = {};
        ret.push({
          ...rest,
          matches,
          range: {
            start: breakIdx,
            end: i,
          },
        });
        breakIdx = i;
      }
    }
    foundTags[m.setTag] = (foundTags[m.setTag] || 0) + 1;
  }
  ret.push({
    ...rest,
    matches,
    range: { start: breakIdx, end: range.end },
  }); // Adding final tag

  return ret;
};

export type BestValue = {
  tagIdx?: number;
  val?: string;
  dict?: string;
};

export const findBest = (
  { matches, range, tokens }: RangeContext,
  tag: string
): BestValue => {
  const ret: BestValue = {};
  let maxPrio = -100;
  let bestTagIdx = -1;
  for (let i = range.start; i < range.end; i += 1) {
    if (matches[i]?.setTag === tag && matches[i]?.all[0].priority > maxPrio) {
      maxPrio = matches[i]?.all[0].priority;
      bestTagIdx = i;
    }
  }

  if (bestTagIdx < 0) return {};
  const token = tokens[bestTagIdx];
  ret.tagIdx = bestTagIdx;
  ret.val = token.text;
  ret.dict = token.val && token.val[tag];
  return ret;
};
