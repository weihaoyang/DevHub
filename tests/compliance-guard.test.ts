import { describe, expect, it } from "vitest";
import {
  assertAcceptedCurrentCompliance,
  assertConsentVersionMatches,
  buildAcceptedCompliance,
  hasAcceptedCurrentCompliance
} from "../src/main/compliance-guard";
import type { ComplianceConfig, DevHubSettings } from "../src/shared/types";

const compliance: ComplianceConfig = {
  consentVersion: "2026-02-17",
  sourcePolicy: "official only",
  externalHostAllowlist: ["example.com"],
  legalDocs: {
    terms: "docs/legal/TERMS_OF_USE.md",
    privacy: "docs/legal/PRIVACY_POLICY.md",
    thirdParty: "docs/legal/THIRD_PARTY_NOTICES.md",
    disclaimer: "docs/legal/DISCLAIMER.md"
  }
};

const baseSettings: DevHubSettings = {
  language: "zh-CN",
  proxy: { enabled: false },
  compliance: {
    accepted: false,
    consentVersion: "2026-02-17"
  },
  installedPolicy: "skip",
  failurePolicy: "continue"
};

describe("compliance guard", () => {
  it("detects and enforces current compliance acceptance", () => {
    expect(hasAcceptedCurrentCompliance(baseSettings, compliance)).toBe(false);
    expect(() => assertAcceptedCurrentCompliance(baseSettings, compliance, "installation")).toThrowError(
      /Compliance consent required/
    );

    const accepted: DevHubSettings = {
      ...baseSettings,
      compliance: {
        accepted: true,
        consentVersion: compliance.consentVersion
      }
    };
    expect(hasAcceptedCurrentCompliance(accepted, compliance)).toBe(true);
    expect(() => assertAcceptedCurrentCompliance(accepted, compliance, "installation")).not.toThrow();
  });

  it("rejects outdated consent version requests", () => {
    expect(() => assertConsentVersionMatches("2026-02-16", compliance)).toThrowError(/version mismatch/i);
    expect(() => assertConsentVersionMatches("2026-02-17", compliance)).not.toThrow();
  });

  it("builds acceptance state from active compliance config", () => {
    const accepted = buildAcceptedCompliance(compliance, "2026-02-17T00:00:00.000Z");
    expect(accepted.accepted).toBe(true);
    expect(accepted.acceptedAt).toBe("2026-02-17T00:00:00.000Z");
    expect(accepted.consentVersion).toBe("2026-02-17");
  });
});
