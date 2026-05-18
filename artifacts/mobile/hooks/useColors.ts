import colors from "@/constants/colors";

/**
 * Always returns the dark palette — the user loves black.
 */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
