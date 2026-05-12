const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      { count: totalUsers },
      { count: totalClientPosts },
      { count: totalShipperPosts },
      { count: postsTodayClient },
      { count: postsTodayShipper },
      { count: verifiedUsers }
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("client_post").select("*", { count: "exact", head: true }),
      supabase.from("shipper_post").select("*", { count: "exact", head: true }),
      supabase.from("client_post").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("shipper_post").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("email_verified", true)
    ]);

    const postsToday = (postsTodayClient || 0) + (postsTodayShipper || 0);
    const activityRate = totalUsers > 0 ? (((totalClientPosts + totalShipperPosts) / totalUsers)).toFixed(2) : "0.00";

    res.json({
      totalUsers: totalUsers || 0,
      totalClientPosts: totalClientPosts || 0,
      totalShipperPosts: totalShipperPosts || 0,
      postsToday,
      verifiedUsers: verifiedUsers || 0,
      activityRate
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, account_type, role, created_at, email_verified, phone, image")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map to camelCase for frontend
    const mappedData = data.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      accountType: u.account_type,
      role: u.role,
      created_at: u.created_at,
      emailVerified: u.email_verified,
      phone: u.phone,
      profilePictureUrl: u.image
    }));

    res.json(mappedData);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user.id.toString() === id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "User deleted successfully." });
  } catch (err) {
    next(err);
  }
};
