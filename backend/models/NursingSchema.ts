import mongoose from "mongoose";

const NursingNoteSchema = new mongoose.Schema(
  {
    nurse: String,
    note: String,
    category: String,
    timestamp: String,
  },
  { timestamps: true }
);

export default mongoose.models.NursingNote ||
  mongoose.model("NursingNote", NursingNoteSchema);
