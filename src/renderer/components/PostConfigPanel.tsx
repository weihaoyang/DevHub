import { useState } from "react";
import type { Language, PostConfigResult } from "../../shared/types";
import { translate } from "../i18n";

interface Props {
  language: Language;
  onRun: (payload: { gitName?: string; gitEmail?: string }) => Promise<PostConfigResult>;
}

export function PostConfigPanel({ language, onRun }: Props) {
  const [gitName, setGitName] = useState("");
  const [gitEmail, setGitEmail] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PostConfigResult | null>(null);

  const run = async () => {
    setRunning(true);
    try {
      const next = await onRun({
        gitName: gitName.trim() || undefined,
        gitEmail: gitEmail.trim() || undefined
      });
      setResult(next);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="card post-config">
      <div className="card-title-row">
        <h2>{translate(language, "panel.postConfig")}</h2>
        <span className="muted">{running ? (language === "zh-CN" ? "执行中" : "Running") : "-"}</span>
      </div>
      <label className="field">
        <span>{translate(language, "post.gitName")}</span>
        <input type="text" value={gitName} onChange={(e) => setGitName(e.target.value)} />
      </label>
      <label className="field">
        <span>{translate(language, "post.gitEmail")}</span>
        <input type="text" value={gitEmail} onChange={(e) => setGitEmail(e.target.value)} />
      </label>
      <div className="actions">
        <button onClick={run} disabled={running}>
          {translate(language, "btn.runPostConfig")}
        </button>
      </div>
      <div className="post-result">
        <strong>{translate(language, "post.runResult")}</strong>
        {result ? (
          <ul className="post-result-list">
            {result.steps.map((step) => (
              <li key={step.name}>
                [{step.success ? "OK" : "FAIL"}] {step.name}: {step.message}
              </li>
            ))}
          </ul>
        ) : (
          <div>{translate(language, "common.none")}</div>
        )}
      </div>
    </section>
  );
}
