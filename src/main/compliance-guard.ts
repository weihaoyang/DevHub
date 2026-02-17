import type { ComplianceAcceptance, ComplianceConfig, DevHubSettings } from "../shared/types";

export function hasAcceptedCurrentCompliance(settings: DevHubSettings, compliance: ComplianceConfig): boolean {
  return Boolean(settings.compliance.accepted) && settings.compliance.consentVersion === compliance.consentVersion;
}

export function assertAcceptedCurrentCompliance(
  settings: DevHubSettings,
  compliance: ComplianceConfig,
  action: string
): void {
  if (!hasAcceptedCurrentCompliance(settings, compliance)) {
    throw new Error(`Compliance consent required before ${action}.`);
  }
}

export function assertConsentVersionMatches(requestedVersion: string, compliance: ComplianceConfig): void {
  if (requestedVersion !== compliance.consentVersion) {
    throw new Error("Compliance consent version mismatch. Please reload and accept the latest policy.");
  }
}

export function buildAcceptedCompliance(compliance: ComplianceConfig, acceptedAt = new Date().toISOString()): ComplianceAcceptance {
  return {
    accepted: true,
    acceptedAt,
    consentVersion: compliance.consentVersion
  };
}
