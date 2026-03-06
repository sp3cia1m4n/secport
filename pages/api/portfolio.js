import { connectDB } from "../../lib/mongodb";
import { Portfolio } from "../../models/Portfolio";
import jwt from "jsonwebtoken";

function verifyToken(req) {
  try {
    const token = req.cookies?.admin_token || req.headers.authorization?.split(" ")[1];
    if (!token) return false;
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  await connectDB();

  // GET — public, returns portfolio data
  if (req.method === "GET") {
    try {
      const doc = await Portfolio.findOne({ key: "main" }).lean();
      if (!doc) return res.status(404).json({ error: "No portfolio data yet" });
      return res.status(200).json(doc.data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — protected, saves portfolio data
  if (req.method === "POST") {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const data = req.body;
      await Portfolio.findOneAndUpdate(
        { key: "main" },
        { data, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end("Method Not Allowed");
}
