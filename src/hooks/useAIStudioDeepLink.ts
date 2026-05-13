import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  AI_DEEP_LINK_TARGETS,
  AIDeepLinkTarget,
} from "../components/ai/AIDraftEnvelope";

/**
 * Pure function. Reads the `ai` query parameter from a search string and
 * validates it against the whitelist. Returns the target or `null` for
 * unknown/missing values.
 */
export function parseAIDeepLink(search: string): AIDeepLinkTarget | null {
  try {
    const params = new URLSearchParams(search);
    const value = params.get("ai");
    if (!value) return null;
    return (AI_DEEP_LINK_TARGETS as readonly string[]).includes(value)
      ? (value as AIDeepLinkTarget)
      : null;
  } catch {
    return null;
  }
}

/**
 * Hook that scrolls to and focuses the panel ref when the `?ai=` query
 * parameter matches `expectedTarget`. No-op when the param is absent,
 * does not match, or the ref is not attached.
 */
export function useAIStudioDeepLink(
  expectedTarget: AIDeepLinkTarget,
  ref: React.RefObject<HTMLElement | null>,
): void {
  const { search } = useLocation();

  useEffect(() => {
    const parsed = parseAIDeepLink(search);
    if (parsed !== expectedTarget) return;
    const element = ref.current;
    if (!element) return;

    // Small delay to let the panel mount and layout settle.
    const timer = setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      element.focus({ preventScroll: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [search, expectedTarget, ref]);
}
