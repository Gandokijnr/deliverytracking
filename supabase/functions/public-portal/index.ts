// Public tracking API for MeridianVault
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tracking = url.searchParams.get("tracking");

    if (!tracking) {
      return new Response(
        JSON.stringify({ error: "Tracking number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tracking.length < 10 || tracking.length > 20) {
      return new Response(
        JSON.stringify({ error: "Invalid tracking number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/shipments?tracking_number=eq.${encodeURIComponent(tracking)}&select=id,tracking_number,asset_category,asset_description,asset_image_path,origin_country,origin_city,destination_country,destination_city,current_status,dispatch_date,estimated_delivery_date,updated_at,origin_lat,origin_lng,destination_lat,destination_lng,archived_at&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!supabaseResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shipments = await supabaseResponse.json();
    if (!shipments || shipments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Shipment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shipment = shipments[0];

    if (shipment.archived_at) {
      return new Response(
        JSON.stringify({ error: "This shipment is no longer available for public tracking" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [checkpointsResponse, simulationResponse] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/shipment_checkpoints?shipment_id=eq.${shipment.id}&select=id,status,location,description,checkpoint_date&order=checkpoint_date.desc`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
        }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/shipment_simulations?shipment_id=eq.${shipment.id}&select=route_data,progress,simulated_time,is_playing&limit=1`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
        }
      ),
    ]);

    const checkpoints = checkpointsResponse.ok ? await checkpointsResponse.json() : [];
    const simulations = simulationResponse.ok ? await simulationResponse.json() : [];
    const simulation = simulations && simulations.length > 0 ? simulations[0] : null;

    // Return only approved public fields — no declared values, addresses, contact info, notes
    const publicData = {
      tracking_number: shipment.tracking_number,
      asset_category: shipment.asset_category,
      asset_description: shipment.asset_description,
      asset_image_path: shipment.asset_image_path,
      origin_country: shipment.origin_country,
      origin_city: shipment.origin_city,
      destination_country: shipment.destination_country,
      destination_city: shipment.destination_city,
      current_status: shipment.current_status,
      dispatch_date: shipment.dispatch_date,
      estimated_delivery_date: shipment.estimated_delivery_date,
      updated_at: shipment.updated_at,
      origin_lat: shipment.origin_lat,
      origin_lng: shipment.origin_lng,
      destination_lat: shipment.destination_lat,
      destination_lng: shipment.destination_lng,
      checkpoints: (checkpoints || []).map((cp: { id: string; status: string; location: string; description: string; checkpoint_date: string }) => ({
        id: cp.id,
        status: cp.status,
        location: cp.location,
        description: cp.description,
        checkpoint_date: cp.checkpoint_date,
      })),
      simulation: simulation ? {
        route_data: simulation.route_data,
        progress: simulation.progress,
        simulated_time: simulation.simulated_time,
        is_playing: simulation.is_playing,
      } : null,
    };

    return new Response(
      JSON.stringify(publicData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
        "Content-Type": "application/json",
      } }
    );
  }
});
