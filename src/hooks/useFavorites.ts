import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  addFavorite,
  listFavoriteCarIds,
  readLocalFavorites,
  removeFavorite,
  writeLocalFavorites,
} from "@/services/favorites";

const EVENT = "signaturecars:favorites";

/**
 * Saved cars. Signed-in visitors read and write the `favorites` table; guests
 * keep using local storage and their list is merged in when they sign in.
 */
export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalIds(readLocalFavorites());
    const sync = () => setLocalIds(readLocalFavorites());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const { data: remoteIds = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => listFavoriteCarIds(user!.id),
    enabled: Boolean(user),
  });

  const ids = user ? remoteIds : localIds;

  const mutation = useMutation({
    mutationFn: async ({ carId, next }: { carId: string; next: boolean }) => {
      if (!user) return;
      if (next) await addFavorite(user.id, carId);
      else await removeFavorite(user.id, carId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const toggle = useCallback(
    (vehicleId: string) => {
      const next = !ids.includes(vehicleId);
      if (user) {
        mutation.mutate({ carId: vehicleId, next });
      } else {
        const list = next
          ? [...readLocalFavorites(), vehicleId]
          : readLocalFavorites().filter((id) => id !== vehicleId);
        writeLocalFavorites(list);
        setLocalIds(list);
        window.dispatchEvent(new Event(EVENT));
      }
      return next;
    },
    [ids, mutation, user],
  );

  const isFavorite = useCallback((vehicleId: string) => ids.includes(vehicleId), [ids]);

  return { favorites: ids, toggle, isFavorite, count: ids.length };
}
