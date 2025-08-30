import { createClient } from "npm:@supabase/supabase-js@2";
import { createCORSResponse, handleCORSPreflight } from "../_shared/CORS.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCORSPreflight();
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch expired events with image path via the view
  const { data: items, error: viewErr } = await supabaseAdmin
    .from("event_images")
    .select("event_id, bucket_id, image_path")
    .lt("date", new Date().toISOString());

  if (viewErr) {
    return createCORSResponse({ error: viewErr.message }, { status: 500 });
  }

  let cleaned = 0;
  for (const item of items ?? []) {
    const { error: delErr } = await supabaseAdmin
      .storage
      .from(item.bucket_id)
      .remove([item.image_path]);

    if (!delErr) {
      cleaned++;
      await supabaseAdmin
        .from("events")
        .update({ image_id: null })
        .eq("id", item.event_id);
    } else {
      console.warn(`Failed delete: ${item.image_path}`, delErr.message);
    }
  }

  return createCORSResponse({ cleaned, total: items?.length ?? 0 });
});
