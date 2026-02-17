import dns from "node:dns/promises";
import type { DevHubSettings } from "../shared/types";

export function applyProxyEnv(settings: DevHubSettings, baseEnv: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...baseEnv };
  if (!settings.proxy.enabled) {
    return env;
  }

  if (settings.proxy.http) {
    env.HTTP_PROXY = settings.proxy.http;
    env.http_proxy = settings.proxy.http;
  }
  if (settings.proxy.https) {
    env.HTTPS_PROXY = settings.proxy.https;
    env.https_proxy = settings.proxy.https;
  }
  return env;
}

export async function checkNetworkHealth(): Promise<{ healthy: boolean; detail: string }> {
  try {
    await dns.lookup("www.microsoft.com");
    return { healthy: true, detail: "DNS lookup for www.microsoft.com succeeded." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error.";
    return { healthy: false, detail: `DNS lookup failed: ${message}` };
  }
}
