import type {
  PatientBasic,
  PatientStatus,
  PatientDetails,
} from "@/types/patient";

// Centralized patient data - initially with minimal vitals
export const mockPatients: PatientBasic[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    room: "ICU-101",
    admissionDate: "2024-01-15",
    primaryDiagnosis: "Post-operative cardiac surgery",
    allergies: ["Penicillin", "Latex"],
    riskLevel: "critical",
    isolationStatus: "Contact Precautions",
    acuityLevel: 5,
    hasAlerts: true,
    isPendingDischarge: false,
    requiresFollowUp: true,
    nursingNotes: ["Patient admitted for cardiac surgery monitoring"],
    age: 59,
    maritalStatus: "Widowed",
    gender: "Female",
    emergencyContact: {
      name: "Jane Johnson",
      relationship: "Daughter",
      phone: "(555) 123-4567",
    },
  },
  {
    id: "2",
    name: "Michael Chen",
    room: "Med-205",
    admissionDate: "2024-01-16",
    primaryDiagnosis: "Pneumonia recovery",
    allergies: [],
    riskLevel: "medium",
    acuityLevel: 3,
    hasAlerts: false,
    isPendingDischarge: false,
    requiresFollowUp: false,
    nursingNotes: ["Patient admitted with pneumonia"],
    age: 45,
    maritalStatus: "Married",
    gender: "Male",
    emergencyContact: {
      name: "Lisa Chen",
      relationship: "Sister",
      phone: "(555) 987-6543",
    },
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    room: "ICU-103",
    admissionDate: "2024-01-14",
    primaryDiagnosis: "Stroke recovery",
    allergies: ["Sulfa drugs"],
    riskLevel: "high",
    acuityLevel: 4,
    hasAlerts: true,
    isPendingDischarge: false,
    requiresFollowUp: true,
    nursingNotes: ["Patient admitted post-stroke"],
    age: 67,
    maritalStatus: "Unmarried",
    gender: "Female",
    emergencyContact: {
      name: "Carlos Rodriguez",
      relationship: "Husband",
      phone: "(555) 456-7890",
    },
  },
];

export const mockPatientStatuses: Record<string, PatientStatus> = {
  "1": {
    hasNewOrders: true,
    hasCriticalLabs: true,
    hasUnreadMessages: false,
    painLevel: 0, // Will be updated by nurses
    mobilityStatus: "bedrest",
  },
  "2": {
    hasNewOrders: false,
    hasCriticalLabs: false,
    hasUnreadMessages: false,
    painLevel: 0,
    mobilityStatus: "assistance",
  },
  "3": {
    hasNewOrders: true,
    hasCriticalLabs: false,
    hasUnreadMessages: true,
    painLevel: 0,
    mobilityStatus: "assistance",
  },
};

// Generate comprehensive patient details with empty vitals initially
export const generatePatientDetails = (
  patientId: string,
  allPatients?: PatientBasic[]
): PatientDetails | null => {
  const patientsToSearch = allPatients || mockPatients;
  const patient = patientsToSearch.find((p) => p.id === patientId);
  if (!patient) return null;

  const baseTime = Date.now();

  return {
    ...patient,
    demographics: {
      dateOfBirth: patient.age
        ? new Date(Date.now() - patient.age * 365.25 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "1970-01-01",
      age: patient.age || 50,
      gender: patient.gender || "Unknown",
      maritalStatus: ["Single", "Married", "Divorced", "Widowed"][
        Math.floor(Math.random() * 4)
      ],
      occupation: ["Teacher", "Engineer", "Nurse", "Retired", "Student"][
        Math.floor(Math.random() * 5)
      ],
      address: `${Math.floor(
        Math.random() * 9999
      )} Main Street, Springfield, IL 62701`,
      preferredLanguage: "English",
      religion: [
        "Christian",
        "Catholic",
        "Jewish",
        "Muslim",
        "Buddhist",
        "Other",
      ][Math.floor(Math.random() * 6)],
    },
    emergencyContact: patient.emergencyContact || {
      name: "Emergency Contact",
      relationship: "Family",
      phone: "(555) 000-0000",
    },
    insurance: {
      provider: ["Blue Cross Blue Shield", "Aetna", "Cigna", "UnitedHealth"][
        Math.floor(Math.random() * 4)
      ],
      policyNumber: `POL${patient.id}${Math.floor(Math.random() * 1000000)}`,
      groupNumber: `GRP${patient.id}${Math.floor(Math.random() * 10000)}`,
      subscriberName: patient.name,
      effectiveDate: "2024-01-01",
      copay: ["$20", "$25", "$30", "$35"][Math.floor(Math.random() * 4)],
    },
    // Initially empty vitals - nurses will update these
    vitals: {},
    // Initially no medications - nurses will add these
    medications: [],
    activityLog: [
      {
        id: "1",
        timestamp: new Date(baseTime - 60 * 60 * 1000).toISOString(),
        nurse: "Admission Staff",
        action: "Patient admitted to unit",
        category: "communication",
        details: `${patient.name} admitted to ${patient.room}. Initial assessment pending.`,
        priority: "medium",
      },
    ],
    nursingNotes: patient.nursingNotes.map((note, index) => ({
      id: `note-${patient.id}-${index}`,
      timestamp: new Date(
        baseTime - (index + 1) * 60 * 60 * 1000
      ).toISOString(),
      nurse: "Admission Staff",
      note,
      category: "admission",
    })),
    lastModified: {
      by: "System",
      at: new Date(baseTime - 60 * 60 * 1000).toISOString(),
      changes: ["Patient admitted"],
    },
  };
};

// Utility functions
export const sortPatientsByPriority = (patients: PatientBasic[]) => {
  return [...patients].sort((a, b) => {
    if (a.riskLevel === "critical" && b.riskLevel !== "critical") return -1;
    if (b.riskLevel === "critical" && a.riskLevel !== "critical") return 1;
    if (a.acuityLevel !== b.acuityLevel) {
      return b.acuityLevel - a.acuityLevel;
    }
    if (a.hasAlerts && !b.hasAlerts) return -1;
    if (b.hasAlerts && !a.hasAlerts) return 1;
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (a.riskLevel !== b.riskLevel) {
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    }
    return a.name.localeCompare(b.name);
  });
};

export const getCriticalCount = (patients: PatientBasic[]) => {
  return patients.filter(
    (p) => p.riskLevel === "critical" || p.acuityLevel >= 4
  ).length;
};

export const getShiftStatus = () => {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return "day";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
};
