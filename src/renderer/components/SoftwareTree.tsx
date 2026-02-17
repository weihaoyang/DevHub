import type { Language, SoftwareCategory, SoftwareItem } from "../../shared/types";
import { translate } from "../i18n";

interface Props {
  language: Language;
  catalog: SoftwareItem[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}

const categories: SoftwareCategory[] = [
  "browser",
  "dev",
  "runtime",
  "collab",
  "utility",
  "database",
  "creative",
  "music",
  "research"
];

export function SoftwareTree({ language, catalog, selected, onSelectedChange }: Props) {
  const grouped = categories.map((category) => ({
    category,
    items: catalog.filter((item) => item.category === category)
  }));

  const allIds = catalog.map((item) => item.id);
  const selectedCount = selected.size;

  const setAll = () => onSelectedChange(new Set(allIds));
  const clearAll = () => onSelectedChange(new Set());
  const invert = () => {
    const next = new Set<string>();
    for (const id of allIds) {
      if (!selected.has(id)) {
        next.add(id);
      }
    }
    onSelectedChange(next);
  };

  const toggleItem = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectedChange(next);
  };

  const toggleCategory = (category: SoftwareCategory) => {
    const ids = catalog.filter((item) => item.category === category).map((item) => item.id);
    const allSelected = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    for (const id of ids) {
      if (allSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
    }
    onSelectedChange(next);
  };

  return (
    <section className="card software-tree">
      <div className="card-title-row">
        <h2>{translate(language, "panel.software")}</h2>
        <span className="muted">{translate(language, "summary.selected", { count: selectedCount })}</span>
      </div>
      <div className="actions">
        <button onClick={setAll}>{translate(language, "btn.selectAll")}</button>
        <button onClick={clearAll}>{translate(language, "btn.clearAll")}</button>
        <button onClick={invert}>{translate(language, "btn.invert")}</button>
      </div>
      <div className="category-list">
        {grouped.map(({ category, items }) => {
          if (items.length === 0) return null;
          const allSelected = items.every((item) => selected.has(item.id));
          return (
            <div className="category-block" key={category}>
              <label className="category-header">
                <input type="checkbox" checked={allSelected} onChange={() => toggleCategory(category)} />
                <span>{translate(language, `category.${category}`)}</span>
              </label>
              <div className="category-items">
                {items.map((item) => (
                  <label key={item.id} className="item-row">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="item-content">
                      <span className="item-name">{language === "zh-CN" ? item.name.zh : item.name.en}</span>
                      {item.summary && (
                        <span className="item-summary">{language === "zh-CN" ? item.summary.zh : item.summary.en}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
