import { useState } from "react";
import type { Language, ProxySettings } from "../../shared/types";
import { translate } from "../i18n";

interface Props {
  language: Language;
  value: ProxySettings;
  onSave: (next: ProxySettings) => void;
  onClose: () => void;
}

export function ProxyDialog({ language, value, onSave, onClose }: Props) {
  const [enabled, setEnabled] = useState(value.enabled);
  const [http, setHttp] = useState(value.http ?? "");
  const [https, setHttps] = useState(value.https ?? "");

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{translate(language, "proxy.title")}</h3>
        <label className="field-inline">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>{translate(language, "proxy.enabled")}</span>
        </label>
        <label className="field">
          <span>{translate(language, "proxy.http")}</span>
          <input
            type="text"
            value={http}
            onChange={(e) => setHttp(e.target.value)}
            placeholder="http://127.0.0.1:7890"
          />
        </label>
        <label className="field">
          <span>{translate(language, "proxy.https")}</span>
          <input
            type="text"
            value={https}
            onChange={(e) => setHttps(e.target.value)}
            placeholder="http://127.0.0.1:7890"
          />
        </label>
        <div className="actions">
          <button
            onClick={() =>
              onSave({
                enabled,
                http: http.trim(),
                https: https.trim()
              })
            }
          >
            {translate(language, "btn.save")}
          </button>
          <button className="secondary" onClick={onClose}>
            {translate(language, "btn.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
