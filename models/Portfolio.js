import mongoose from "mongoose";

// Single document store — entire portfolio is one JSON document
// keyed by "main". Simple, fast, no schema headaches.
const PortfolioSchema = new mongoose.Schema({
  key:  { type: String, default: "main", unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const Portfolio =
  mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);


// Messages — separate collection so they persist independently
const MessageSchema = new mongoose.Schema({
  name:    String,
  email:   String,
  subject: String,
  message: String,
  read:    { type: Boolean, default: false },
  date:    { type: Date, default: Date.now },
});

export const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
