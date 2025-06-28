import mongoose, { Schema } from "mongoose";

const EmergencyContactSchema = new mongoose.Schema({
  name: String,
  relationship: String,
  phone: String,
  // address: String,
  // email: String,
});

const DemographicsSchema = new mongoose.Schema({
  dateOfBirth: String,
  age: Number,
  gender: String,
  maritalStatus: String,
  occupation: String,
  address: String,
  // preferredLanguage: String,
  religion: String,
});

const InsuranceSchema = new mongoose.Schema({
  provider: String,
  policyNumber: String,
  groupNumber: String,
  subscriberName: String,
  effectiveDate: String,
  copay: String,
});

const ActivityLogSchema = new Schema({
  id: String,
  timestamp: String,
  nurse: String,
  action: String,
  category: String,
  details: String,
  priority: String,
});

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    room: { type: String, required: true },
    admissionDate: String,
    primaryDiagnosis: String,
    allergies: [String],
    riskLevel: { type: String, enum: ["low", "medium", "high", "critical"] },
    isolationStatus: String,
    acuityLevel: { type: Number, enum: [1, 2, 3, 4, 5] },
    lastVitalsTime: String,
    nextMedTime: String,
    hasAlerts: Boolean,
    requiresFollowUp: Boolean,
    isPendingDischarge: Boolean,
    hasCriticalLabs: Boolean,
    requiresContactPrecautions: Boolean,
    nursingNotes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "NursingNote" },
    ],
    age: Number,
    gender: String,
    maritalStatus: String,
    emergencyContact: EmergencyContactSchema,
    demographics: DemographicsSchema,
    insurance: InsuranceSchema,
    vitals: { type: mongoose.Schema.Types.ObjectId, ref: "Vitals" },
    medications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Medication" }],
    activityLog: [ActivityLogSchema],
    lastModified: {
      by: String,
      at: String,
      changes: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Patient ||
  mongoose.model("Patient", PatientSchema);
