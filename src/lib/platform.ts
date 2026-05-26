export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export type Platform = "web" | "tauri";

export function getPlatform(): Platform {
  return isTauri() ? "tauri" : "web";
}
