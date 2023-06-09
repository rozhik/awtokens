// eslint-disable-next-line import/named
import { TokenizerInit } from "./types";

export const urlsCallbacks: TokenizerInit = (addRegexp) => {
  addRegexp(
    /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/i,
    { tokenType: "URL", priority: 0.8 }
  );
  addRegexp(
    // eslint-disable-next-line no-control-regex
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    {
      tokenType: "EMAIL",
    }
  );
};

export const dataCallbacks: TokenizerInit = (addRegexp) => {
  addRegexp(
    /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/,
    { tokenType: "ISO_DATE", priority: 0.8 }
  );
};

export const charTypeCallbacks: TokenizerInit = (addRegexp) => {
  addRegexp(/^0x[0-9a-fA-F]+/, { tokenType: "HEX", priority: 0.9 });
  addRegexp(/^[0-9]+/, { tokenType: "NUM", priority: 0.8 });
  addRegexp(/^[0-9]+[.,][0-9]+/, { tokenType: "FLOAT", priority: 0.8 });
  addRegexp(/^\p{L}+/u, { tokenType: "ALPHA", priority: 0.3 });
  addRegexp(/^[\p{L}][0-9\p{L}]+/u, { tokenType: "ALPHA_NUM", priority: 0 });
  addRegexp(/^\p{P}+/u, { tokenType: "PUNCT", priority: 0.0 });
  addRegexp(/^\p{S}+/u, { tokenType: "SYMBOL", priority: 0.8 });
  addRegexp(/^[\r\n]/u, { tokenType: "PARA", priority: 0.8 });
};

export const standardCallbacks: TokenizerInit = (
  addRegexp,
  addCallback,
  addDict
) => {
  urlsCallbacks(addRegexp, addCallback, addDict);
  dataCallbacks(addRegexp, addCallback, addDict);
  charTypeCallbacks(addRegexp, addCallback, addDict);
};
