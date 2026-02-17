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
      <h2>{translate(language, "panel.progress")}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{translate(language, "table.software")}</th>
              <th>{translate(language, "table.status")}</th>
              <th>{translate(language, "table.message")}</th>
              <th>{translate(language, "table.time")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>{translate(language, "common.none")}</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.itemId}>
                <td>{row.name}</td>
                <td>{translate(language, `status.${row.status}`)}</td>
                <td>{row.message}</td>
                <td>{new Date(row.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
