import mongoose from "mongoose";

const MedicationSchema = new mongoose.Schema(
  {
    name: String,
    dosage: String,
    route: String,
    frequency: String,
    nextDue: String,
    lastGiven: String,
    prescriber: String,
    indication: String,
    status: { type: String, enum: ["active", "given", "held", "discontinued"] },
    addedBy: String,
    addedAt: String,
  },
  { timestamps: true }
);

export default mongoose.models.Medication ||
  mongoose.model("Medication", MedicationSchema);
