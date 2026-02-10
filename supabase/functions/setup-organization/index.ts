import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupRequest {
  orgName: string;
  teamName: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to get their ID
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for all operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has an organization and get full_name for PM
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "User already belongs to an organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orgName, teamName }: SetupRequest = await req.json();

    if (!orgName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Organization name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!teamName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Team name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, setup_complete: true })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return new Response(
        JSON.stringify({ error: "Failed to create organization" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Update user profile with organization
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      await supabase.from("organizations").delete().eq("id", org.id);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });

    if (roleError) {
      console.error("Error assigning role:", roleError);
    }

    // 4. Create default product area
    const { data: pa, error: paError } = await supabase
      .from("product_areas")
      .insert({ name: "General", organization_id: org.id })
      .select()
      .single();

    if (paError) {
      console.error("Error creating product area:", paError);
      return new Response(
        JSON.stringify({ error: "Failed to create product area" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create default domain
    const { data: domain, error: domainError } = await supabase
      .from("domains")
      .insert({ name: "General", product_area_id: pa.id })
      .select()
      .single();

    if (domainError) {
      console.error("Error creating domain:", domainError);
      return new Response(
        JSON.stringify({ error: "Failed to create domain" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create the user's team (use profile full_name as PM)
    const { error: teamError } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        domain_id: domain.id,
        pm_name: profile?.full_name ?? null,
      });

    if (teamError) {
      console.error("Error creating team:", teamError);
      return new Response(
        JSON.stringify({ error: "Failed to create team" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, organizationId: org.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
