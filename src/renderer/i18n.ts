import zh from "../../i18n/zh-CN.json";
import en from "../../i18n/en-US.json";
import type { Language } from "../shared/types";

type Dict = Record<string, string>;

const dictionaries: Record<Language, Dict> = {
  "zh-CN": zh,
  "en-US": en
};

export function translate(language: Language, key: string, vars?: Record<string, string | number>): string {
  const dict = dictionaries[language] ?? dictionaries["en-US"];
  const template = dict[key] ?? key;
  if (!vars) {
    return template;
  }
  return Object.entries(vars).reduce((output, [name, value]) => output.replace(`{${name}}`, String(value)), template);
}
