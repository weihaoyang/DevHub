import type { Language } from "../../shared/types";
import { translate } from "../i18n";

interface Props {
  language: Language;
  logs: string[];
  logPath: string;
}

export function LogPanel({ language, logs, logPath }: Props) {
  return (
    <section className="card log-panel">
      <h2>{translate(language, "panel.logs")}</h2>
      <div className="log-path">
        {translate(language, "common.logPath")}: <code>{logPath || "-"}</code>
      </div>
      <div className="log-content">
        {logs.length === 0 ? translate(language, "common.none") : logs.join("\n")}
      </div>
    </section>
  );
}
