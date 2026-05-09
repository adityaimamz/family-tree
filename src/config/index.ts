import { defaultLabels } from "./defaultLabels";
import exampleConfig from "./family.config.example";
import type { FamilySiteConfig, ResolvedFamilySiteConfig } from "../types/config";

const resolveConfig = (config: FamilySiteConfig): ResolvedFamilySiteConfig => ({
  ...config,
  labels: {
    ...defaultLabels,
    ...config.labels,
    statusOptions: config.labels?.statusOptions ?? defaultLabels.statusOptions,
  },
});

export const familyConfig = resolveConfig(exampleConfig);
