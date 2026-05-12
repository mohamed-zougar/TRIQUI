require("dotenv").config();
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");

const ADMIN_EMAIL = "admin@triqi.dz";
const ADMIN_PASSWORD = "123456789";
const BCRYPT_ROUNDS = 10;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAdmin() {
  // Check if admin already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (existing) {
    console.log("Admin account already exists:", existing.email, "(id:", existing.id + ")");

    // Ensure role is set to admin
    if (existing.role !== "admin") {
      await supabase.from("users").update({ role: "admin" }).eq("id", existing.id);
      console.log("Updated role to 'admin'.");
    }
    return;
  }

  // Create admin account
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const { data, error } = await supabase
    .from("users")
    .insert({
      account_type: "individual",
      first_name: "Admin",
      last_name: "TriQI+",
      email: ADMIN_EMAIL,
      phone: "0000000000",
      password: hashedPassword,
      role: "admin",
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      operating_city: "Alger",
      delivery_focus: "All",
      vehicle_type: "Truck",
    })
    .select("id, email, role")
    .single();

  if (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }

  console.log("Admin account created successfully!");
  console.log("  Email:", data.email);
  console.log("  Password:", ADMIN_PASSWORD);
  console.log("  Role:", data.role);
  console.log("  ID:", data.id);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
