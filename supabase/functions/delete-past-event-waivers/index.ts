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

  try {
    console.log("Starting waiver cleanup...");

    // Fetch expired events with waiver path via the view
    const { data: items, error: viewErr } = await supabaseAdmin
      .from("event_waivers")
      .select("event_id, bucket_id, waiver_path, waiver_id, date")
      .lt("date", new Date().toISOString());

    console.log("View query result:", { items, viewErr });

    if (viewErr) {
      console.error("View error:", viewErr);
      return createCORSResponse({ error: viewErr.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      console.log("No expired waivers found");
      return createCORSResponse({
        cleaned: 0,
        total: 0,
        message: "No expired waivers found",
      });
    }

    console.log(`Found ${items.length} expired waiver(s) to clean up`);

    let cleaned = 0;
    const errors: string[] = [];

    for (const item of items) {
      console.log(
        `Processing waiver: ${item.waiver_path} in bucket: ${item.bucket_id}`,
      );

      if (!item.bucket_id || !item.waiver_path) {
        console.warn(`Skipping item with missing data:`, item);
        errors.push(
          `Missing bucket_id or waiver_path for event ${item.event_id}`,
        );
        continue;
      }

      const { error: delErr } = await supabaseAdmin
        .storage
        .from(item.bucket_id)
        .remove([item.waiver_path]);

      if (!delErr) {
        cleaned++;
        console.log(`Successfully deleted waiver: ${item.waiver_path}`);

        // Update the event to remove waiver_id reference
        const { error: updateErr } = await supabaseAdmin
          .from("events")
          .update({ waiver_id: null })
          .eq("id", item.event_id);

        if (updateErr) {
          console.warn(
            `Failed to update event ${item.event_id}:`,
            updateErr.message,
          );
          errors.push(
            `Failed to update event ${item.event_id}: ${updateErr.message}`,
          );
        } else {
          console.log(`Updated event ${item.event_id} to remove waiver_id`);
        }
      } else {
        console.error(`Failed to delete waiver: ${item.waiver_path}`, delErr);
        errors.push(`Failed to delete ${item.waiver_path}: ${delErr.message}`);
      }
    }

    const result = {
      cleaned,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Cleanup completed:", result);
    return createCORSResponse(result);
  } catch (error) {
    console.error("Unexpected error in waiver cleanup:", error);
    return createCORSResponse({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/delete-past-event-waivers' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
