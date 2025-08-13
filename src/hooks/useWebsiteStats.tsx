import { useEffect, useState } from "react";
import { supabase } from "~/lib/supabase";
import type { WebsiteDetails } from "~/types";

export const useWebsiteStats = () => {
  const [stats, setStats] = useState<WebsiteDetails>({
    volunteers: 0,
    trash: 0,
    events: 0,
    leadership: null,
    featured_event_id: null,
    id: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data } = await supabase.from("website_details").select("*").single();
      if (data) setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  return { stats, loading };
};
