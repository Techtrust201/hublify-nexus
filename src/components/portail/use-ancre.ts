import { useRouterState } from "@tanstack/react-router";

export function useAncre() {
  return useRouterState({ select: (s) => s.location.hash.replace(/^#/, "") });
}
