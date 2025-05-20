import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // This should be user_id
  const redirectUri = `https://xhwgwwxmzfedaijvgvld.supabase.co/functions/v1/google-oauth`;

  if (!code) {
    // Step 1: Redirect to Google
    const userId = url.searchParams.get("user_id");
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", [
      "https://www.googleapis.com/auth/classroom.courses",
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
      "https://www.googleapis.com/auth/classroom.courseworkmaterials",
      "https://www.googleapis.com/auth/classroom.topics",
      "https://www.googleapis.com/auth/classroom.topics.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ].join(" "));
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", userId ?? "");

    return Response.redirect(googleAuthUrl.toString(), 302);
  }

  // Step 2: Exchange code for token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Token exchange failed", tokenData);
    return new Response(JSON.stringify({ error: tokenData }), { status: 500 });
  }

  const { access_token, refresh_token, expires_in } = tokenData;
  const expires_at = Math.floor(Date.now() / 1000) + expires_in;

  // Step 3: Save to Supabase
  const { error } = await supabase
    .from("profiles")
    .update({
      google_access_token: access_token,
      google_refresh_token: refresh_token,
      google_token_expires_at: expires_at,
      google_linked: true,
    })
    .eq("id", state); // state contains user_id

  if (error) {
    console.error("Supabase update failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Step 4: Redirect to dashboard or success page
  return Response.redirect(`http://localhost:8080/dashboard`, 302);
});
