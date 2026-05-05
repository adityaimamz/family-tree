import { useEffect } from "react";
import { familyConfig } from "../config";
import type { ThemeToken } from "../types/config";

const themeVariableNames: Record<ThemeToken, string> = {
  background: "--background",
  surface: "--surface",
  surfaceSoft: "--surface-soft",
  text: "--text",
  muted: "--muted",
  border: "--border",
  warmBrown: "--warm-brown",
  sageGreen: "--sage-green",
  softBlue: "--soft-blue",
  terracotta: "--terracotta",
  softGold: "--soft-gold",
  darkGreen: "--dark-green",
  warning: "--warning",
};

const setMetaContent = (selector: string, content?: string) => {
  if (!content) return;
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.content = content;
};

const setLinkHref = (rel: string, href?: string) => {
  if (!href) return;
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

export const useSiteConfigEffects = () => {
  useEffect(() => {
    document.title = familyConfig.metadata.title;
    setMetaContent('meta[name="description"]', familyConfig.metadata.description);
    setMetaContent('meta[property="og:title"]', familyConfig.metadata.title);
    setMetaContent('meta[property="og:description"]', familyConfig.metadata.description);
    setMetaContent('meta[property="og:image"]', familyConfig.metadata.ogImage);
    setLinkHref("icon", familyConfig.metadata.favicon);

    Object.entries(familyConfig.theme ?? {}).forEach(([token, value]) => {
      if (!value) return;
      const variableName = themeVariableNames[token as ThemeToken];
      if (variableName) document.documentElement.style.setProperty(variableName, value);
    });
  }, []);
};
