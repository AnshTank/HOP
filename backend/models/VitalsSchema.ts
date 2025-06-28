import mongoose from "mongoose";

const BloodPressureSchema = new mongoose.Schema(
  {
    systolic: Number,
    diastolic: Number,
  },
  { _id: false }
);

const VitalsSchema = new mongoose.Schema(
  {
    temperature: Number,
    bloodPressure: BloodPressureSchema,
    heartRate: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    painLevel: Number,
    weight: Number,
    height: String,
    bmi: Number,
    lastTaken: String,
    takenBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.Vitals || mongoose.model("Vitals", VitalsSchema);
