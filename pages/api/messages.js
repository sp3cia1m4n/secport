import { connectDB } from "../../lib/mongodb";
import { Message } from "../../models/Portfolio";
import jwt from "jsonwebtoken";

// XSS sanitizer
function sanitize(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;")
    .slice(0, 2000);
}

function verifyToken(req) {
  try {
    const token = req.cookies?.admin_token || req.headers.authorization?.split(" ")[1];
    if (!token) return false;
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch { return false; }
}

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default async function handler(req, res) {
  await connectDB();

  // POST — submit a new message (public)
  if (req.method === "POST") {
    const { name, email, subject, message } = req.body;
    if (!name?.trim())         return res.status(400).json({ error: "Name is required" });
    if (!validEmail(email))    return res.status(400).json({ error: "Valid email required" });
    if (!message?.trim())      return res.status(400).json({ error: "Message is required" });
    if (message.length < 10)   return res.status(400).json({ error: "Message too short" });

    try {
      await Message.create({
        name:    sanitize(name.trim()),
        email:   sanitize(email.trim()),
        subject: sanitize(subject?.trim() || "No subject"),
        message: sanitize(message.trim()),
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET — list messages (admin only)
  if (req.method === "GET") {
    if (!verifyToken(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
      const msgs = await Message.find().sort({ date: -1 }).lean();
      return res.status(200).json(msgs);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PATCH — mark as read (admin only)
  if (req.method === "PATCH") {
    if (!verifyToken(req)) return res.status(401).json({ error: "Unauthorized" });
    const { id, read } = req.body;
    try {
      await Message.findByIdAndUpdate(id, { read });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — delete message (admin only)
  if (req.method === "DELETE") {
    if (!verifyToken(req)) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.body;
    try {
      await Message.findByIdAndDelete(id);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
  res.status(405).end("Method Not Allowed");
}
