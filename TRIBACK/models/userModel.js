const supabase = require("../config/supabase");
const env = require("../config/env");

const TABLE = env.usersTable;

async function findByPhone(phone) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findByPhoneCandidates(candidates) {
  for (const candidate of candidates) {
    const user = await findByPhone(candidate);
    if (user) return user;
  }
  return null;
}

async function findByEmail(email) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function create(userData) {
  const payload = {
    account_type: userData.account_type || "individual",
    first_name: userData.first_name,
    last_name: userData.last_name,
    company_name: userData.company_name || null,
    company_address: userData.company_address || null,
    company_website: userData.company_website || null,
    date_of_birth: userData.date_of_birth || null,
    email: userData.email || null,
    phone: userData.phone,
    password: userData.password,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function storeOtp(userId, otpCode, expiresAt, purpose = "password-reset") {
  const { error } = await supabase
    .from(TABLE)
    .update({
      otp_code: otpCode,
      otp_expires_at: expiresAt.toISOString(),
      otp_purpose: purpose,
    })
    .eq("id", userId);
  if (error) throw error;
}

async function clearOtp(userId) {
  const { error } = await supabase
    .from(TABLE)
    .update({ otp_code: null, otp_expires_at: null, otp_purpose: null })
    .eq("id", userId);
  if (error) throw error;
}

async function markEmailVerified(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      otp_code: null,
      otp_expires_at: null,
      otp_purpose: null,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function updatePassword(userId, hashedPassword) {
  const { error } = await supabase
    .from(TABLE)
    .update({ password: hashedPassword })
    .eq("id", userId);
  if (error) throw error;
}

async function completeOnboarding(userId, onboardingData) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      image: onboardingData.image || null,
      operating_city: onboardingData.operating_city,
      delivery_focus: onboardingData.delivery_focus,
      vehicle_type: onboardingData.vehicle_type || null,
      vehicle_image: onboardingData.vehicle_image || null,
      company_size: onboardingData.company_size || null,
      average_daily_orders: onboardingData.average_daily_orders || null,
      notifications_enabled: onboardingData.notifications_enabled ?? true,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function updateProfile(userId, profileData) {
  const payload = Object.fromEntries(
    Object.entries(profileData).filter(([, value]) => value !== undefined)
  );
  if (Object.keys(payload).length === 0) {
    return findById(userId);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  findByPhone,
  findByPhoneCandidates,
  findByEmail,
  findById,
  create,
  storeOtp,
  clearOtp,
  markEmailVerified,
  updatePassword,
  completeOnboarding,
  updateProfile,
};
