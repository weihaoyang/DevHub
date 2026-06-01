import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { z } from "zod";
import type {
  MonetizationAdSlot,
  MonetizationConfig,
  MonetizationFeatureFlags,
  MonetizationResolvedPlan,
  MonetizationSponsorCard
} from "../shared/types";

const localizedTextSchema = z.object({
  zh: z.string().min(1),
  en: z.string().min(1)
});

const monetizationLegacySchema = z.object({
  buyMeACoffeeUrl: z.string().url().optional(),
  enableBuyMeACoffee: z.boolean().optional(),
  activePlanId: z.string().min(1).optional(),
  sponsorCards: z
    .array(
      z.object({
        id: z.string().min(1),
        placement: z.enum(["main-right-column-bottom", "post-install-footer"]),
        title: localizedTextSchema,
        description: localizedTextSchema,
        url: z.string().url(),
        disclosure: localizedTextSchema
      })
    )
    .optional()
});

const pricingPlanSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  ads: z.object({
    enabled: z.boolean()
  }),
  entitlementTier: z.string().min(1),
  billing: z.object({
    mode: z.enum(["free", "annual"])
  })
});

const pricingSchema = z.object({
  plans: z.array(pricingPlanSchema).min(1)
});

const entitlementsSchema = z.object({
  tiers: z.array(
    z.object({
      id: z.string().min(1),
      features: z.object({
        removeAds: z.boolean(),
        industryPresetPack: z.enum(["core", "full"]),
        batchRetryAdvanced: z.boolean(),
        silentInstallBatch: z.boolean(),
        offlineCachePack: z.boolean(),
        teamPolicyTemplate: z.boolean(),
        complianceAuditReport: z.enum(["basic", "standard", "advanced"]),
        prioritySupport: z.boolean()
      })
    })
  ),
  adSlots: z.array(
    z.object({
      id: z.string().min(1),
      name: localizedTextSchema,
      placement: z.enum(["main-right-column-bottom", "post-install-footer"]),
      maxCards: z.number().int().positive(),
      requiresDisclosure: z.boolean()
    })
  )
});

function resolveConfigPath(fileName: string): string | null {
  const candidates = [
    path.join(app.getAppPath(), "config", fileName),
    path.join(process.cwd(), "config", fileName),
    path.join(path.dirname(app.getAppPath()), "config", fileName)
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function readJsonConfig(fileName: string): unknown {
  const configPath = resolveConfigPath(fileName);
  if (!configPath) {
    return null;
  }
  return JSON.parse(readFileSync(configPath, "utf8")) as unknown;
}

function defaultFeatures(): MonetizationFeatureFlags {
  return {
    removeAds: false,
    industryPresetPack: "core",
    batchRetryAdvanced: false,
    silentInstallBatch: false,
    offlineCachePack: false,
    teamPolicyTemplate: false,
    complianceAuditReport: "basic",
    prioritySupport: false
  };
}

function defaultAdSlots(): MonetizationAdSlot[] {
  return [
    {
      id: "mainSidebarSponsor",
      name: { zh: "右侧赞助工具推荐", en: "Sidebar Sponsored Tools" },
      placement: "main-right-column-bottom",
      maxCards: 1,
      requiresDisclosure: true
    },
    {
      id: "postInstallRecommend",
      name: { zh: "安装完成延伸推荐", en: "Post-install Recommendations" },
      placement: "post-install-footer",
      maxCards: 2,
      requiresDisclosure: true
    }
  ];
}

function defaultSponsorCards(url: string): MonetizationSponsorCard[] {
  return [
    {
      id: "support-devhub",
      placement: "main-right-column-bottom",
      title: { zh: "赞助开发者计划", en: "Support DevHub" },
      description: { zh: "你的支持用于持续维护预设与合规源。", en: "Support keeps presets and compliance sources updated." },
      url,
      disclosure: { zh: "赞助", en: "Sponsored" }
    },
    {
      id: "post-install-support",
      placement: "post-install-footer",
      title: { zh: "安装已完成，支持长期维护", en: "Install complete, support long-term maintenance" },
      description: { zh: "赞助后可优先体验新行业方案。", en: "Sponsors get early access to new industry packs." },
      url,
      disclosure: { zh: "赞助", en: "Sponsored" }
    }
  ];
}

export function loadMonetizationConfig(): MonetizationConfig {
  const defaultUrl = "https://afdian.com/a/szdzyxh";
  const fallbackPlan: MonetizationResolvedPlan = {
    id: "free",
    name: { zh: "免费版", en: "Free" },
    entitlementTier: "free",
    adsEnabled: true,
    isPaid: false
  };
  const fallback: MonetizationConfig = {
    buyMeACoffeeUrl: defaultUrl,
    enableBuyMeACoffee: true,
    activePlanId: "free",
    resolvedPlan: fallbackPlan,
    features: defaultFeatures(),
    adSlots: defaultAdSlots(),
    sponsorCards: defaultSponsorCards(defaultUrl)
  };

  try {
    const legacyRaw = readJsonConfig("monetization.json");
    const pricingRaw = readJsonConfig("pricing.json");
    const entitlementsRaw = readJsonConfig("entitlements.json");
    const legacy = monetizationLegacySchema.parse(legacyRaw ?? {});
    const pricing = pricingSchema.parse(pricingRaw ?? {});
    const entitlements = entitlementsSchema.parse(entitlementsRaw ?? {});
    const activePlanId = legacy.activePlanId ?? "free";
    const buyMeACoffeeUrl = legacy.buyMeACoffeeUrl ?? defaultUrl;
    const enableBuyMeACoffee = legacy.enableBuyMeACoffee ?? true;
    const plan = pricing.plans.find((item) => item.id === activePlanId) ?? pricing.plans.find((item) => item.id === "free") ?? pricing.plans[0];
    const tier = entitlements.tiers.find((item) => item.id === plan.entitlementTier);
    const features = tier?.features ?? defaultFeatures();
    const adSlots = entitlements.adSlots as MonetizationAdSlot[];
    const sponsorCards = (legacy.sponsorCards as MonetizationSponsorCard[] | undefined) ?? defaultSponsorCards(buyMeACoffeeUrl);
    return {
      buyMeACoffeeUrl,
      enableBuyMeACoffee,
      activePlanId: plan.id,
      resolvedPlan: {
        id: plan.id,
        name: plan.name,
        entitlementTier: plan.entitlementTier,
        adsEnabled: plan.ads.enabled,
        isPaid: plan.billing.mode === "annual"
      },
      features,
      adSlots,
      sponsorCards
    };
  } catch {
    return fallback;
  }
}
