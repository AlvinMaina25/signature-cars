/**
 * Favorites.
 *
 * Signed-in visitors get durable favorites in the `favorites` table. Guests
 * keep the previous localStorage behaviour so the heart button never breaks,
 * and their saved cars are merged into the database on first sign-in.
 */

import { supabase } from "@/integrations/supabase/client";

const FAVORITES_KEY = "ericcardeals.favorites";

/**
 * Pre-rebrand storage key. Kept ONLY so existing visitors keep their saved
 * cars: `migrateLegacyFavorites()` copies its contents into FAVORITES_KEY once,
 * then removes it. Do not delete this constant while old keys may still exist.
 */
const LEGACY_FAVORITES_KEY = "auraauto.favorites";

let migrationChecked = false;

function parseIds(raw: string | null): string[] | null {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : null;
  } catch {
    return null;
  }
}

/**
 * One-time migration of favorites saved under the old key. Existing entries
 * under the new key are kept and legacy ones are merged in (no duplicates).
 * The legacy key is removed only after the new key was written successfully,
 * so a failed write never loses data.
 */
function migrateLegacyFavorites() {
  if (migrationChecked || typeof window === "undefined") return;
  migrationChecked = true;
  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_FAVORITES_KEY);
    if (legacyRaw === null) return;
    const legacyIds = parseIds(legacyRaw);
    if (legacyIds === null) return; // unreadable value: leave it untouched
    const currentIds = parseIds(window.localStorage.getItem(FAVORITES_KEY)) ?? [];
    const merged = [...new Set([...currentIds, ...legacyIds])];
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
    window.localStorage.removeItem(LEGACY_FAVORITES_KEY);
  } catch {
    /* storage unavailable — nothing to migrate, favorites stay in memory */
  }
}

export function readLocalFavorites(): string[] {
  if (typeof window === "undefined") return [];
  migrateLegacyFavorites();
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  migrateLegacyFavorites();
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — favorites stay in memory for this session */
  }
}

export async function listFavoriteCarIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("car_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your saved cars: ${error.message}`);
  return (data ?? []).map((row) => row.car_id);
}

export async function addFavorite(userId: string, carId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: userId, car_id: carId }, { onConflict: "user_id,car_id" });
  if (error) throw new Error(`Could not save this car: ${error.message}`);
}

export async function removeFavorite(userId: string, carId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("car_id", carId);
  if (error) throw new Error(`Could not remove this car: ${error.message}`);
}

/** Moves guest favorites into the account, then clears local storage. */
export async function mergeLocalFavorites(userId: string): Promise<void> {
  const local = readLocalFavorites();
  if (local.length === 0) return;
  const { error } = await supabase.from("favorites").upsert(
    local.map((car_id) => ({ user_id: userId, car_id })),
    { onConflict: "user_id,car_id" },
  );
  if (!error) writeLocalFavorites([]);
}
