const REQUIRED_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];

function requireEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        `Copy .env.example to .env and fill in the values.`
    );
  }
}

requireEnv();

module.exports = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  usersTable: process.env.SUPABASE_USERS_TABLE || "users",
  shipperPostsTable: process.env.SUPABASE_SHIPPER_POSTS_TABLE || "shipper_post",
  clientPostsTable: process.env.SUPABASE_CLIENT_POSTS_TABLE || "client_post",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "photos",
  resend: {
    apiKey: process.env.RESEND_API_KEY || null,
    fromEmail: process.env.RESEND_FROM_EMAIL || "TriQI+ <onboarding@resend.dev>",
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || null,
    fromEmail: process.env.BREVO_FROM_EMAIL || null,
    fromName: process.env.BREVO_FROM_NAME || "TriQI+",
  },
};
