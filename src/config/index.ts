import { defaultLabels } from "./defaultLabels";
import exampleConfig from "./family.config.example";
import type { FamilySiteConfig, ResolvedFamilySiteConfig } from "../types/config";

const localModules = import.meta.glob<{ default: FamilySiteConfig }>("./family.config.ts", {
  eager: true,
});

const localConfig = Object.values(localModules)[0]?.default;

const resolveConfig = (config: FamilySiteConfig): ResolvedFamilySiteConfig => ({
  ...config,
  labels: {
    ...defaultLabels,
    ...config.labels,
    statusOptions: config.labels?.statusOptions ?? defaultLabels.statusOptions,
  },
});

export const familyConfig = resolveConfig(localConfig ?? exampleConfig);
