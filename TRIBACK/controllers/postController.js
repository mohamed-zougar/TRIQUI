const Posts = require("../models/posts");

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parsePagination({ limit, offset } = {}) {
  const numericLimit = Number(limit);
  const numericOffset = Number(offset);
  return {
    limit:
      Number.isFinite(numericLimit) && numericLimit > 0
        ? Math.min(numericLimit, 100)
        : 20,
    offset:
      Number.isFinite(numericOffset) && numericOffset >= 0 ? numericOffset : 0,
  };
}

function ownsPost(post, userId) {
  if (!post || userId === undefined || userId === null) return false;
  if (typeof post.user === "object") return Number(post.user?.id) === Number(userId);
  return Number(post.user) === Number(userId);
}

function validateRouteFields({ origin_wilaya, destination }) {
  if (!origin_wilaya || !destination) {
    return "Origin and destination are required.";
  }
  return null;
}

async function getShipperPosts(req, res, next) {
  try {
    const { origin_wilaya, origin_commune, destination, destination_commune, type, q, min_weight, max_weight, min_volume, max_volume, date_from, date_to } = req.query;
    const { limit, offset } = parsePagination(req.query);

    const posts = await Posts.listShipperPosts({
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      type,
      min_weight: parseNumber(min_weight),
      max_weight: parseNumber(max_weight),
      min_volume: parseNumber(min_volume),
      max_volume: parseNumber(max_volume),
      date_from,
      date_to,
      q,
      limit,
      offset,
    });

    return res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
}

async function getClientPosts(req, res, next) {
  try {
    const { origin_wilaya, origin_commune, destination, destination_commune, vehicle_type, q, min_weight, max_weight, min_volume, max_volume, date_from, date_to } = req.query;
    const { limit, offset } = parsePagination(req.query);

    const posts = await Posts.listClientPosts({
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      vehicle_type,
      min_weight: parseNumber(min_weight),
      max_weight: parseNumber(max_weight),
      min_volume: parseNumber(min_volume),
      max_volume: parseNumber(max_volume),
      date_from,
      date_to,
      q,
      limit,
      offset,
    });

    return res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
}

async function getShipperPostById(req, res, next) {
  try {
    const post = await Posts.getShipperPostById(req.params.id);
    if (!post) return res.status(404).json({ message: "Trip not found." });
    return res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
}

async function getClientPostById(req, res, next) {
  try {
    const post = await Posts.getClientPostById(req.params.id);
    if (!post) return res.status(404).json({ message: "Request not found." });
    return res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
}

async function createShipperPost(req, res, next) {
  try {
    const userId = req.user?.userId;
    const {
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      wilaya_passage,
      type,
      weight,
      volume,
      phone,
      description,
      image,
      availability_date,
    } = req.body;

    const routeError = validateRouteFields({ origin_wilaya, destination });
    if (routeError) return res.status(400).json({ message: routeError });

    const post = await Posts.createShipperPost({
      user: userId,
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      wilaya_passage,
      type,
      weight: parseNumber(weight),
      volume: parseNumber(volume),
      phone,
      description,
      image,
      availability_date,
    });

    return res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
}

async function createClientPost(req, res, next) {
  try {
    const userId = req.user?.userId;
    const {
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      vehicle_type,
      weight,
      volume,
      phone,
      description,
      image,
      delivery_date,
    } = req.body;

    const routeError = validateRouteFields({ origin_wilaya, destination });
    if (routeError) return res.status(400).json({ message: routeError });

    const post = await Posts.createClientPost({
      user: userId,
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      vehicle_type,
      weight: parseNumber(weight),
      volume: parseNumber(volume),
      phone,
      description,
      image,
      delivery_date,
    });

    return res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
}

async function updateShipperPost(req, res, next) {
  try {
    const existing = await Posts.getShipperPostById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Trip not found." });
    if (!ownsPost(existing, req.user?.userId)) {
      return res.status(403).json({ message: "You can only edit your own trips." });
    }

    const {
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      wilaya_passage,
      type,
      weight,
      volume,
      phone,
      description,
      image,
      availability_date,
    } = req.body;

    const routeError = validateRouteFields({ origin_wilaya, destination });
    if (routeError) return res.status(400).json({ message: routeError });

    const post = await Posts.updateShipperPost(req.params.id, {
      user: existing.user?.id ?? existing.user,
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      wilaya_passage,
      type,
      weight: parseNumber(weight),
      volume: parseNumber(volume),
      phone,
      description,
      image,
      availability_date,
    });

    return res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
}

async function updateClientPost(req, res, next) {
  try {
    const existing = await Posts.getClientPostById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Request not found." });
    if (!ownsPost(existing, req.user?.userId)) {
      return res.status(403).json({ message: "You can only edit your own requests." });
    }

    const {
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      vehicle_type,
      weight,
      volume,
      phone,
      description,
      image,
      delivery_date,
    } = req.body;

    const routeError = validateRouteFields({ origin_wilaya, destination });
    if (routeError) return res.status(400).json({ message: routeError });

    const post = await Posts.updateClientPost(req.params.id, {
      user: existing.user?.id ?? existing.user,
      origin_wilaya,
      origin_commune,
      destination,
      destination_commune,
      vehicle_type,
      weight: parseNumber(weight),
      volume: parseNumber(volume),
      phone,
      description,
      image,
      delivery_date,
    });

    return res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
}

async function deleteShipperPost(req, res, next) {
  try {
    const post = await Posts.getShipperPostById(req.params.id);
    if (!post) return res.status(404).json({ message: "Trip not found." });
    if (!ownsPost(post, req.user?.userId)) {
      return res.status(403).json({ message: "You can only delete your own trips." });
    }

    await Posts.deleteShipperPost(req.params.id);
    return res.status(200).json({ message: "Trip deleted." });
  } catch (error) {
    next(error);
  }
}

async function deleteClientPost(req, res, next) {
  try {
    const post = await Posts.getClientPostById(req.params.id);
    if (!post) return res.status(404).json({ message: "Request not found." });
    if (!ownsPost(post, req.user?.userId)) {
      return res.status(403).json({ message: "You can only delete your own requests." });
    }

    await Posts.deleteClientPost(req.params.id);
    return res.status(200).json({ message: "Request deleted." });
  } catch (error) {
    next(error);
  }
}

async function getMyPosts(req, res, next) {
  try {
    const data = await Posts.listMyPosts(req.user?.userId);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function getClientPostMatches(req, res, next) {
  try {
    const post = await Posts.getClientPostById(req.params.id);
    if (!post) return res.status(404).json({ message: "Request not found." });
    const matches = await Posts.findShipperMatchesForClientPost(post);
    return res.status(200).json({ matches });
  } catch (error) {
    next(error);
  }
}

async function getShipperPostMatches(req, res, next) {
  try {
    const post = await Posts.getShipperPostById(req.params.id);
    if (!post) return res.status(404).json({ message: "Trip not found." });
    const matches = await Posts.findClientMatchesForShipperPost(post);
    return res.status(200).json({ matches });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getShipperPosts,
  getClientPosts,
  getShipperPostById,
  getClientPostById,
  createShipperPost,
  createClientPost,
  updateShipperPost,
  updateClientPost,
  deleteShipperPost,
  deleteClientPost,
  getMyPosts,
  getClientPostMatches,
  getShipperPostMatches,
};
