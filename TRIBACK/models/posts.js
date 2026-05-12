const supabase = require("../config/supabase");
const env = require("../config/env");

const SHIPPER_TABLE = env.shipperPostsTable;
const CLIENT_TABLE = env.clientPostsTable;

const USER_SELECT = "id, first_name, last_name, company_name, account_type, image, vehicle_image";
function serializePassage(value) {
  if (Array.isArray(value)) return value.map(v => String(v).replace(/[\\"[\]]/g, '')).join(",");
  if (typeof value === "string") return value.replace(/[\\"[\]]/g, '');
  return null;
}

function deserializePassage(value) {
  if (Array.isArray(value)) return value.map(v => String(v).replace(/[\\"[\]]/g, ''));
  if (typeof value === "string" && value.length > 0) {
    // Clean potential legacy JSON characters or escaping artifacts
    return value
      .split(",")
      .map((entry) => entry.replace(/[\\"[\]]/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

function serializeVehicleType(value) {
  if (Array.isArray(value)) return value.map(v => String(v).replace(/[\\"][\]]/g, '')).join(",");
  if (typeof value === "string") return value.replace(/[\\"][\]]/g, '');
  return null;
}

function deserializeVehicleType(value) {
  if (Array.isArray(value)) return value.map(v => String(v).replace(/[\\"][\]]/g, ''));
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((entry) => entry.replace(/[\\"][\]]/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

function shipperPayload(input) {
  return {
    user: input.user ?? null,
    origin_wilaya: input.origin_wilaya,
    origin_commune: input.origin_commune ?? null,
    destination: input.destination,
    destination_commune: input.destination_commune ?? null,
    wilaya_passage: serializePassage(input.wilaya_passage),
    type: input.type ?? null,
    weight: input.weight ?? null,
    volume: input.volume ?? null,
    phone: input.phone ?? null,
    description: input.description ?? null,
    image: input.image ?? null,
    availability_date: input.availability_date ?? null,
  };
}

function clientPayload(input) {
  return {
    user: input.user ?? null,
    image: input.image ?? null,
    description: input.description ?? null,
    vehicle_type: serializeVehicleType(input.vehicle_type),
    weight: input.weight ?? null,
    volume: input.volume ?? null,
    origin_wilaya: input.origin_wilaya,
    origin_commune: input.origin_commune ?? null,
    destination: input.destination,
    destination_commune: input.destination_commune ?? null,
    phone: input.phone ?? null,
    delivery_date: input.delivery_date ?? null,
  };
}

function decorateClientPost(row) {
  if (!row) return row;
  return { ...row, vehicle_type: deserializeVehicleType(row.vehicle_type) };
}

function decorateShipperPost(row) {
  if (!row) return row;
  return {
    ...row,
    wilaya_passage: deserializePassage(row.wilaya_passage),
    image: row.image || row.users?.vehicle_image || null,
  };
}

function escapeIlikeWildcards(value) {
  return String(value).replace(/[\\%_]/g, (match) => `\\${match}`);
}

function normalizeWilayaList(value) {
  if (!value) return [];
  const items = Array.isArray(value) ? value : String(value).split(",");
  return items.map((item) => item.trim()).filter(Boolean);
}

function toPostgrestString(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function buildWilayaSideExpression(column, wilayas) {
  const uniqueWilayas = [...new Set(normalizeWilayaList(wilayas))];
  if (uniqueWilayas.length === 0) return "";

  const clauses = [
    `${column}.in.(${uniqueWilayas.map(toPostgrestString).join(",")})`,
    ...uniqueWilayas.map((wilaya) => `wilaya_passage.ilike.%${escapeIlikeWildcards(wilaya)}%`),
  ];

  return `or(${clauses.join(",")})`;
}

function buildShipperRouteExpression({ origin_wilaya, destination, q }) {
  const routeClauses = [];
  const originExpression = buildWilayaSideExpression("origin_wilaya", origin_wilaya);
  const destinationExpression = buildWilayaSideExpression("destination", destination);

  if (originExpression) routeClauses.push(originExpression);
  if (destinationExpression) routeClauses.push(destinationExpression);

  let expression = routeClauses.length > 1 ? `and(${routeClauses.join(",")})` : routeClauses[0] || "";

  if (q && typeof q === "string" && q.trim()) {
    const term = `%${escapeIlikeWildcards(q.trim())}%`;
    const searchExpression = `or(description.ilike.${term},origin_wilaya.ilike.${term},destination.ilike.${term},type.ilike.${term},wilaya_passage.ilike.${term})`;
    expression = expression ? `and(${expression},${searchExpression})` : searchExpression;
  }

  return expression;
}

async function listShipperPosts({
  origin_wilaya,
  origin_commune,
  destination,
  destination_commune,
  type,
  min_weight,
  max_weight,
  min_volume,
  max_volume,
  date_from,
  date_to,
  q,
  excludeId,
  limit = 20,
  offset = 0,
} = {}) {
  let query = supabase
    .from(SHIPPER_TABLE)
    .select(`*, users:user (${USER_SELECT})`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (origin_commune) {
    const communes = Array.isArray(origin_commune) ? origin_commune : origin_commune.split(",").map(s => s.trim());
    query = query.in("origin_commune", communes);
  }

  if (destination_commune) {
    const communes = Array.isArray(destination_commune) ? destination_commune : destination_commune.split(",").map(s => s.trim());
    query = query.in("destination_commune", communes);
  }

  const routeExpression = buildShipperRouteExpression({
    origin_wilaya,
    destination,
    q,
  });

  if (type) query = query.eq("type", type);
  if (min_weight) query = query.gte("weight", min_weight);
  if (max_weight) query = query.lte("weight", max_weight);
  if (min_volume) query = query.gte("volume", min_volume);
  if (max_volume) query = query.lte("volume", max_volume);

  if (date_from) {
    const dFrom = date_from.split("T")[0];
    query = query.gte("availability_date", dFrom);
  }
  if (date_to) {
    const dTo = date_to.split("T")[0];
    query = query.lte("availability_date", dTo);
  }

  if (excludeId) query = query.neq("id", excludeId);
  if (routeExpression) {
    query = query.or(routeExpression);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase Error in listShipperPosts:", error);
    throw error;
  }
  return (data || []).map(decorateShipperPost);
}

async function listClientPosts({
  origin_wilaya,
  origin_commune,
  destination,
  destination_commune,
  vehicle_type,
  min_weight,
  max_weight,
  min_volume,
  max_volume,
  date_from,
  date_to,
  q,
  excludeId,
  limit = 20,
  offset = 0,
} = {}) {
  let query = supabase
    .from(CLIENT_TABLE)
    .select(`*, users:user (${USER_SELECT})`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (origin_wilaya) {
    const origins = Array.isArray(origin_wilaya) ? origin_wilaya : origin_wilaya.split(",").map(s => s.trim());
    query = query.in("origin_wilaya", origins);
  }
  if (origin_commune) {
    const communes = Array.isArray(origin_commune) ? origin_commune : origin_commune.split(",").map(s => s.trim());
    query = query.in("origin_commune", communes);
  }
  if (destination) {
    const dests = Array.isArray(destination) ? destination : destination.split(",").map(s => s.trim());
    query = query.in("destination", dests);
  }
  if (destination_commune) {
    const communes = Array.isArray(destination_commune) ? destination_commune : destination_commune.split(",").map(s => s.trim());
    query = query.in("destination_commune", communes);
  }
  
  if (min_weight) query = query.gte("weight", min_weight);
  if (max_weight) query = query.lte("weight", max_weight);
  if (min_volume) query = query.gte("volume", min_volume);
  if (max_volume) query = query.lte("volume", max_volume);
  if (date_from) {
    const dFrom = date_from.split("T")[0];
    query = query.gte("delivery_date", dFrom);
  }
  if (date_to) {
    const dTo = date_to.split("T")[0];
    query = query.lte("delivery_date", dTo);
  }
  if (excludeId) query = query.neq("id", excludeId);
  
  const { data, error } = await query;
  if (error) {
    console.error("Supabase Error in listClientPosts:", error);
    throw error;
  }
  
  let results = (data || []).map(decorateClientPost);
  
  // Filter by vehicle_type in JavaScript (since it's comma-separated text)
  if (vehicle_type) {
    const types = Array.isArray(vehicle_type) ? vehicle_type : vehicle_type.split(",").map(s => s.trim());
    results = results.filter(post => {
      if (!post.vehicle_type || (Array.isArray(post.vehicle_type) && post.vehicle_type.length === 0)) {
        return false;
      }
      const postTypes = Array.isArray(post.vehicle_type) ? post.vehicle_type : [post.vehicle_type];
      return types.some(t => postTypes.some(pt => pt.toLowerCase() === t.toLowerCase()));
    });
  }
  
  // Filter by search query in JavaScript
  if (q && typeof q === "string" && q.trim()) {
    const term = q.trim().toLowerCase();
    results = results.filter(post => {
      return (
        (post.description && post.description.toLowerCase().includes(term)) ||
        (post.origin_wilaya && post.origin_wilaya.toLowerCase().includes(term)) ||
        (post.destination && post.destination.toLowerCase().includes(term)) ||
        (post.vehicle_type && String(post.vehicle_type).toLowerCase().includes(term))
      );
    });
  }
  
  return results;
}

async function getShipperPostById(id) {
  const { data, error } = await supabase
    .from(SHIPPER_TABLE)
    .select(`*, users:user (${USER_SELECT})`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return decorateShipperPost(data);
}

async function getClientPostById(id) {
  const { data, error } = await supabase
    .from(CLIENT_TABLE)
    .select(`*, users:user (${USER_SELECT})`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return decorateClientPost(data);
}

async function createShipperPost(input) {
  const { data, error } = await supabase
    .from(SHIPPER_TABLE)
    .insert(shipperPayload(input))
    .select(`*, users:user (${USER_SELECT})`)
    .single();
  if (error) throw error;
  return decorateShipperPost(data);
}

async function createClientPost(input) {
  const { data, error } = await supabase
    .from(CLIENT_TABLE)
    .insert(clientPayload(input))
    .select(`*, users:user (${USER_SELECT})`)
    .single();
  if (error) throw error;
  return decorateClientPost(data);
}

async function updateShipperPost(id, input) {
  const payload = { ...shipperPayload(input), updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(SHIPPER_TABLE)
    .update(payload)
    .eq("id", id)
    .select(`*, users:user (${USER_SELECT})`)
    .single();
  if (error) throw error;
  return decorateShipperPost(data);
}

async function updateClientPost(id, input) {
  const payload = { ...clientPayload(input), updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(CLIENT_TABLE)
    .update(payload)
    .eq("id", id)
    .select(`*, users:user (${USER_SELECT})`)
    .single();
  if (error) throw error;
  return decorateClientPost(data);
}

async function deleteShipperPost(id) {
  const { error } = await supabase.from(SHIPPER_TABLE).delete().eq("id", id);
  if (error) throw error;
}

async function deleteClientPost(id) {
  const { error } = await supabase.from(CLIENT_TABLE).delete().eq("id", id);
  if (error) throw error;
}

async function listMyPosts(userId) {
  const [{ data: clientData, error: clientError }, { data: shipperData, error: shipperError }] =
    await Promise.all([
      supabase
        .from(CLIENT_TABLE)
        .select("*")
        .eq("user", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from(SHIPPER_TABLE)
        .select("*")
        .eq("user", userId)
        .order("created_at", { ascending: false }),
    ]);

  if (clientError) throw clientError;
  if (shipperError) throw shipperError;

  return {
    clientPosts: (clientData || []).map(decorateClientPost),
    shipperPosts: (shipperData || []).map(decorateShipperPost),
  };
}

async function findShipperMatchesForClientPost(post, { limit = 6 } = {}) {
  if (!post) return [];
  let query = supabase
    .from(SHIPPER_TABLE)
    .select(`*, users:user (${USER_SELECT})`)
    .eq("origin_wilaya", post.origin_wilaya)
    .eq("destination", post.destination);

  if (post.origin_commune) {
    query = query.eq("origin_commune", post.origin_commune);
  }
  if (post.destination_commune) {
    query = query.eq("destination_commune", post.destination_commune);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(decorateShipperPost);
}

async function findClientMatchesForShipperPost(post, { limit = 6 } = {}) {
  if (!post) return [];
  let query = supabase
    .from(CLIENT_TABLE)
    .select(`*, users:user (${USER_SELECT})`)
    .eq("origin_wilaya", post.origin_wilaya)
    .eq("destination", post.destination);

  if (post.origin_commune) {
    query = query.eq("origin_commune", post.origin_commune);
  }
  if (post.destination_commune) {
    query = query.eq("destination_commune", post.destination_commune);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(decorateClientPost);
}

module.exports = {
  listShipperPosts,
  listClientPosts,
  getShipperPostById,
  getClientPostById,
  createShipperPost,
  createClientPost,
  updateShipperPost,
  updateClientPost,
  deleteShipperPost,
  deleteClientPost,
  listMyPosts,
  findShipperMatchesForClientPost,
  findClientMatchesForShipperPost,
};
