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
    console.log("Starting direct waiver cleanup...");
    
    // Query events directly instead of using the view
    const { data: expiredEvents, error: eventsErr } = await supabaseAdmin
      .from("events")
      .select("id, waiver_id, date")
      .lt("date", new Date().toISOString())
      .not("waiver_id", "is", null);

    console.log("Expired events with waivers:", { expiredEvents, eventsErr });

    if (eventsErr) {
      console.error("Events query error:", eventsErr);
      return createCORSResponse({ error: eventsErr.message }, { status: 500 });
    }

    if (!expiredEvents || expiredEvents.length === 0) {
      console.log("No expired events with waivers found");
      return createCORSResponse({ cleaned: 0, total: 0, message: "No expired events with waivers found" });
    }

    console.log(`Found ${expiredEvents.length} expired event(s) with waivers`);

    let cleaned = 0;
    const errors: string[] = [];

    // Get all waiver files from storage
    const { data: waiverFiles, error: storageErr } = await supabaseAdmin
      .storage
      .from("events")
      .list("waivers");

    if (storageErr) {
      console.error("Storage list error:", storageErr);
      return createCORSResponse({ error: `Storage error: ${storageErr.message}` }, { status: 500 });
    }

    console.log(`Found ${waiverFiles?.length || 0} waiver files in storage`);

    // Create a map of waiver_id to file name
    const waiverMap = new Map();
    waiverFiles?.forEach(file => {
      waiverMap.set(file.id, file.name);
    });

    for (const event of expiredEvents) {
      console.log(`Processing event ${event.id} with waiver_id: ${event.waiver_id}`);
      
      const fileName = waiverMap.get(event.waiver_id);
      if (!fileName) {
        console.warn(`No file found for waiver_id: ${event.waiver_id}`);
        errors.push(`No file found for waiver_id: ${event.waiver_id} (event: ${event.id})`);
        continue;
      }

      // Delete the file from storage
      const { error: delErr } = await supabaseAdmin
        .storage
        .from("events")
        .remove([`waivers/${fileName}`]);

      if (!delErr) {
        cleaned++;
        console.log(`Successfully deleted waiver: waivers/${fileName}`);
        
        // Update the event to remove waiver_id reference
        const { error: updateErr } = await supabaseAdmin
          .from("events")
          .update({ waiver_id: null })
          .eq("id", event.id);
          
        if (updateErr) {
          console.warn(`Failed to update event ${event.id}:`, updateErr.message);
          errors.push(`Failed to update event ${event.id}: ${updateErr.message}`);
        } else {
          console.log(`Updated event ${event.id} to remove waiver_id`);
        }
      } else {
        console.error(`Failed to delete waiver: waivers/${fileName}`, delErr);
        errors.push(`Failed to delete waivers/${fileName}: ${delErr.message}`);
      }
    }

    const result = { 
      cleaned, 
      total: expiredEvents.length, 
      errors: errors.length > 0 ? errors : undefined 
    };
    
    console.log("Direct cleanup completed:", result);
    return createCORSResponse(result);
    
  } catch (error) {
    console.error("Unexpected error in direct waiver cleanup:", error);
    return createCORSResponse({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
});
