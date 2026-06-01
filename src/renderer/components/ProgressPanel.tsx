import { useMemo } from "react";
import type { InstallEvent, Language, SoftwareItem } from "../../shared/types";
import { nextTaskState } from "../../shared/task-state";
import { translate } from "../i18n";

interface Props {
  language: Language;
  catalog: SoftwareItem[];
  events: InstallEvent[];
}

interface ViewRow {
  itemId: string;
  name: string;
  status: string;
  message: string;
  timestamp: string;
}

export function ProgressPanel({ language, catalog, events }: Props) {
  const rows = useMemo<ViewRow[]>(() => {
    const nameById = new Map(catalog.map((item) => [item.id, language === "zh-CN" ? item.name.zh : item.name.en]));
    const eventMap = new Map<string, InstallEvent>();

    for (const event of events) {
      if (event.itemId === "system") {
        continue;
      }
      const existing = eventMap.get(event.itemId);
      if (!existing) {
        eventMap.set(event.itemId, event);
        continue;
      }

      const finalState = nextTaskState(existing.status, event.status);
      if (finalState !== existing.status) {
        eventMap.set(event.itemId, event);
      }
    }

    return Array.from(eventMap.values()).map((event) => ({
      itemId: event.itemId,
      name: nameById.get(event.itemId) ?? event.itemId,
      status: event.status,
      message: event.message,
      timestamp: event.timestamp
    }));
  }, [catalog, events, language]);

  return (
    <section className="card progress-panel">
      <div className="card-title-row">
        <h2>{translate(language, "panel.progress")}</h2>
        <span className="muted">{rows.length}</span>
      </div>
      <div className="progress-list">
        {rows.length === 0 && <div className="progress-empty">{translate(language, "common.none")}</div>}
        {rows.map((row) => (
          <div key={row.itemId} className="progress-item">
            <div className="progress-item-top">
              <strong>{row.name}</strong>
              <span className={`status-pill status-${row.status}`}>{translate(language, `status.${row.status}`)}</span>
            </div>
            <div className="progress-item-message">{row.message}</div>
            <div className="progress-item-time">{new Date(row.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
