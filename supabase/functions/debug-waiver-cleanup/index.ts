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
    console.log("=== DEBUGGING WAIVER CLEANUP ===");
    
    // 1. Check if event_waivers view exists and has data
    console.log("1. Checking event_waivers view...");
    const { data: allWaivers, error: allWaiversErr } = await supabaseAdmin
      .from("event_waivers")
      .select("*")
      .limit(10);
    
    console.log("All waivers in view:", { allWaivers, allWaiversErr });
    
    // 2. Check expired waivers specifically
    console.log("2. Checking expired waivers...");
    const today = new Date().toISOString();
    console.log("Today's date:", today);
    
    const { data: expiredWaivers, error: expiredErr } = await supabaseAdmin
      .from("event_waivers")
      .select("*")
      .lt("date", today);
    
    console.log("Expired waivers:", { expiredWaivers, expiredErr });
    
    // 3. Check events table directly
    console.log("3. Checking events with waivers...");
    const { data: eventsWithWaivers, error: eventsErr } = await supabaseAdmin
      .from("events")
      .select("id, title, date, waiver_id, waiver_required")
      .not("waiver_id", "is", null)
      .limit(10);
    
    console.log("Events with waivers:", { eventsWithWaivers, eventsErr });
    
    // 4. Check storage buckets
    console.log("4. Checking storage buckets...");
    const { data: buckets, error: bucketsErr } = await supabaseAdmin
      .storage
      .listBuckets();
    
    console.log("Available buckets:", { buckets, bucketsErr });
    
    // 5. Check events bucket specifically
    console.log("5. Checking events bucket contents...");
    const { data: eventsBucketContents, error: eventsBucketErr } = await supabaseAdmin
      .storage
      .from("events")
      .list();
    
    console.log("Events bucket contents:", { eventsBucketContents, eventsBucketErr });
    
    // 6. Check waivers folder in events bucket
    console.log("6. Checking waivers folder...");
    const { data: waiversFolder, error: waiversFolderErr } = await supabaseAdmin
      .storage
      .from("events")
      .list("waivers");
    
    console.log("Waivers folder contents:", { waiversFolder, waiversFolderErr });
    
    // 7. Compare with images (working function)
    console.log("7. Checking event_images view for comparison...");
    const { data: expiredImages, error: imagesErr } = await supabaseAdmin
      .from("event_images")
      .select("*")
      .lt("date", today)
      .limit(5);
    
    console.log("Expired images (for comparison):", { expiredImages, imagesErr });

    const debugInfo = {
      timestamp: today,
      allWaivers: allWaivers?.length || 0,
      expiredWaivers: expiredWaivers?.length || 0,
      eventsWithWaivers: eventsWithWaivers?.length || 0,
      bucketsCount: buckets?.length || 0,
      eventsBucketItems: eventsBucketContents?.length || 0,
      waiversFolderItems: waiversFolder?.length || 0,
      expiredImages: expiredImages?.length || 0,
      errors: {
        allWaiversErr,
        expiredErr,
        eventsErr,
        bucketsErr,
        eventsBucketErr,
        waiversFolderErr,
        imagesErr
      }
    };

    console.log("=== DEBUG SUMMARY ===", debugInfo);
    
    return createCORSResponse(debugInfo);
    
  } catch (error) {
    console.error("Debug error:", error);
    return createCORSResponse({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
});
