export interface PatientBasic {
  _id: Key | null | undefined;
  id: string;
  name: string;
  room: string;
  admissionDate: string;
  primaryDiagnosis: string;
  allergies: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  isolationStatus?: string;
  acuityLevel: 1 | 2 | 3 | 4 | 5;
  lastVitalsTime?: string;
  nextMedTime?: string;
  hasAlerts?: boolean;
  requiresFollowUp?: boolean;
  isPendingDischarge?: boolean;
  hasCriticalLabs?: boolean;
  requiresContactPrecautions?: boolean;
  nursingNotes: string[];
  age?: number;
  maritalStatus?: string;
  gender?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface PatientStatus {
  hasNewOrders: boolean;
  hasCriticalLabs: boolean;
  hasUnreadMessages: boolean;
  painLevel: number;
  mobilityStatus: "bedrest" | "assistance" | "independent";
  lastAssessmentTime?: string;
  nextScheduledCare?: string;
}

export interface PatientVitals {
  temperature?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  painLevel?: number;
  weight?: number;
  height?: string;
  bmi?: number;
  lastTaken?: string;
  takenBy?: string;
}

export interface PatientMedication {
  _id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  nextDue: string;
  lastGiven?: string;
  prescriber: string;
  indication: string;
  status: "active" | "given" | "held" | "discontinued";
  addedBy: string;
  addedAt: string;
}

export interface PatientDetails extends Omit<PatientBasic, "nursingNotes"> {
  demographics: {
    dateOfBirth: string;
    age: number;
    gender: string;
    maritalStatus: string;
    occupation?: string;
    address?: string;
    preferredLanguage?: string;
    religion?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address?: string;
    email?: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    subscriberName: string;
    effectiveDate: string;
    copay?: string;
  };
  vitals: PatientVitals;
  medications: PatientMedication[];
  activityLog: ActivityLog[];
  nursingNotes: NursingNote[];
  lastModified: {
    by: string;
    at: string;
    changes: string[];
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  nurse: string;
  action: string;
  category:
    | "vitals"
    | "medication"
    | "assessment"
    | "notes"
    | "procedure"
    | "communication";
  details: string;
  priority: "low" | "medium" | "high";
}

export interface NursingNote {
  id: string;
  timestamp: string;
  nurse: string;
  note: string;
  category: string;
}

export interface AddPatientRequest {
  name: string;
  room: string;
  primaryDiagnosis: string;
  age: number;
  maritalStatus?: string;
  gender: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  acuityLevel: 1 | 2 | 3 | 4 | 5;
  allergies: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  vitals?: Partial<PatientVitals>;
  medications?: string[];
  nursingNotes?: string[];
  hasAlerts?: boolean;
  requiresFollowUp?: boolean;
  isPendingDischarge?: boolean;
  hasCriticalLabs?: boolean;
  requiresContactPrecautions?: boolean;
}

export interface UpdateVitalsRequest {
  patientId: string;
  vitals: Partial<PatientVitals>;
  nurseInitials: string;
  nurseName: string;
}

export interface AddMedicationRequest {
  patientId: string;
  medication: Omit<PatientMedication, "id" | "addedBy" | "addedAt">;
  nurseInitials: string;
  nurseName: string;
}

export interface UpdateMedicationRequest {
  patientId: string;
  medicationId: string;
  action: "given" | "held" | "discontinued";
  nurseInitials: string;
  nurseName: string;
  notes?: string;
}

// In your POST /api/patients route
const newPatient = await Patient.create({
  ...data,
  demographics: {
    age: data.age,
    gender: data.gender,
    maritalStatus: data.maritalStatus,
    // Add other fields as needed, or provide defaults
    dateOfBirth: data.dateOfBirth || "",
    occupation: data.occupation || "",
    address: data.address || "",
    religion: data.religion || "",
  },
  // Optionally, keep top-level fields for backward compatibility
});
