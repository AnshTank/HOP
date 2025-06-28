import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    nurse: String,
    action: String,
    category: {
      type: String,
      enum: [
        "vitals",
        "medication",
        "assessment",
        "notes",
        "procedure",
        "communication",
      ],
    },
    details: String,
    priority: { type: String, enum: ["low", "medium", "high"] },
    timestamp: String,
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);
