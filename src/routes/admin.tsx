import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { noIndexMeta } from "@/config/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [noIndexMeta] }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/account" });

    return { user: data.user, isAdmin: true as const };
  },
  component: () => <Outlet />,
});
