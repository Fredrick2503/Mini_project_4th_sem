// // supabase/functions/google-refresh-token/index.ts
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// serve(async (req) => {
//   // Handle CORS preflight
//   if (req.method === "OPTIONS") {
//     return new Response("ok", {
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Or set to specific origin
//         "Access-Control-Allow-Methods": "POST, OPTIONS",
//         "Access-Control-Allow-Headers": "Content-Type, Authorization",
//       },
//     });
//   }

//   const { user_id } = await req.json();
//   if (!user_id) {
//     return new Response("Missing user_id", {
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Or set to specific origin
//       },
//       status: 400,
//     });
//   }

//   const supabaseClient = createClient(
//     Deno.env.get("SUPABASE_URL")!,
//     Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
//   );

//   // Step 1: Get refresh_token from profile
//   const { data: profile, error: fetchError } = await supabaseClient
//     .from("profiles")
//     .select("google_refresh_token")
//     .eq("id", user_id)
//     .single();

//   if (fetchError || !profile?.google_refresh_token) {
//     return new Response("Refresh token not found", { headers:{
//         "Access-Control-Allow-Origin": "*", // Or set to specific origin
//     },status: 400 });
//   }

//   const refreshToken = profile.google_refresh_token;

//   // Step 2: Request new access token from Google
//   const params = new URLSearchParams({
//     client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
//     client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
//     refresh_token: refreshToken,
//     grant_type: "refresh_token",
//   });

//   const googleRes = await fetch("https://oauth2.googleapis.com/token", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: params.toString(),
//   });

//   if (!googleRes.ok) {
//     const errorText = await googleRes.text();
//     return new Response(`Failed to refresh token: ${errorText}`, {
//         headers:{
//         "Access-Control-Allow-Origin": "*", // Or set to specific origin

//         },
//       status: 500,
//     });
//   }

//   const tokenData = await googleRes.json();

//   const newAccessToken = tokenData.access_token;
//   const expiresInMs = tokenData.expires_in * 1000;
//   const newExpiresAt = Date.now() + expiresInMs;

//   // Step 3: Update profile with new access token
//   const { error: updateError } = await supabaseClient
//     .from("profiles")
//     .update({
//       google_access_token: newAccessToken,
//       google_token_expires_at: newExpiresAt,
//     })
//     .eq("id", user_id);

//   if (updateError) {
//     return new Response("Failed to update profile", {headers:{
//         "Access-Control-Allow-Origin": "*", // Or set to specific origin

//     } ,status: 500 });
//   }

//   // Step 4: Return new token info
//   return new Response(
//     JSON.stringify({
//       access_token: newAccessToken,
//       expires_at: newExpiresAt,
//     }),
//     {
//       headers: { "Content-Type": "application/json","Access-Control-Allow-Origin": "*" },
//     }
//   );
// });


// supabase/functions/google-refresh-token/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Centralized CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Set specific origin in prod
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response("Missing user_id", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile, error: fetchError } = await supabaseClient
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", user_id)
    .single();

  if (fetchError || !profile?.google_refresh_token) {
    return new Response("Refresh token not found", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const params = new URLSearchParams({
    client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
    client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    refresh_token: profile.google_refresh_token,
    grant_type: "refresh_token",
  });

  const googleRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!googleRes.ok) {
    const errorText = await googleRes.text();
    return new Response(`Failed to refresh token: ${errorText}`, {
      status: 500,
      headers: corsHeaders,
    });
  }

  const tokenData = await googleRes.json();
  const newAccessToken = tokenData.access_token;
  const newExpiresAt = Date.now() + tokenData.expires_in * 1000;

  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({
      google_access_token: newAccessToken,
      google_token_expires_at: newExpiresAt,
    })
    .eq("id", user_id);

  if (updateError) {
    return new Response("Failed to update profile", {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      access_token: newAccessToken,
      expires_at: newExpiresAt,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
