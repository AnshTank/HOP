import { type NextRequest, NextResponse } from "next/server";
import type {
  UpdateMedicationRequest,
  PatientDetails,
  ActivityLog,
  PatientMedication,
  AddMedicationRequest, // <-- Add this line
} from "@/types/patient";

// In-memory “database”
declare global {
  var patients: PatientDetails[];
}
globalThis.patients = globalThis.patients || [];
const patients = globalThis.patients;

// PUT: Update medication status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const patientId = id;
    const data: Omit<UpdateMedicationRequest, "patientId"> =
      await request.json();

    // Find the patient
    const idx = patients.findIndex((p) => String(p.id) === patientId);
    if (idx === -1) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const patient = patients[idx];

    // Find the medication
    const medIdx = patient.medications.findIndex(
      (m) => String(m.id) === String(data.medicationId)
    );
    if (medIdx === -1) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    // Update the one medication
    const updatedMedication: PatientMedication = {
      ...patient.medications[medIdx],
      status:
        data.action === "given"
          ? "given"
          : data.action === "held"
          ? "held"
          : "discontinued",
      lastGiven: data.action === "given" ? new Date().toISOString() : undefined,
    };

    // Build activity log
    const newActivity = {
      timestamp: new Date().toISOString(),
      action: `Medication ${data.action}`,
      details: `Medication ${data.medicationId} ${data.action} by ${data.nurseName} (${data.nurseInitials})`,
    };

    // Replace or remove in the array
    const newMeds = [...patient.medications];
    if (data.action === "discontinued") {
      newMeds.splice(medIdx, 1);
    } else {
      newMeds[medIdx] = updatedMedication;
    }

    // Build updated patient
    const updatedPatient: PatientDetails = {
      ...patient,
      medications: newMeds,
      activityLog: [newActivity, ...patient.activityLog],
      lastModified: {
        by: `${data.nurseName} (${data.nurseInitials})`,
        at: new Date().toISOString(),
        changes: [`Medication ${data.action}`],
      },
    };

    // Persist in-memory
    patients[idx] = updatedPatient;

    // 🚀 **Return both the single med and the full patient** for frontend flexibility
    return NextResponse.json({
      success: true,
      medication: updatedMedication,
      patient: updatedPatient,
    });
  } catch (err) {
    console.error("Error updating medication:", err);
    return NextResponse.json(
      { error: "Failed to update medication" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const patientId = id;
    const data: Omit<AddMedicationRequest, "patientId"> = await request.json();

    // Get current patient data
    const response = await fetch(
      `${request.nextUrl.origin}/api/patients/${patientId}`
    );
    if (!response.ok) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patient: PatientDetails = await response.json();

    // Ensure medications is always an array
    if (!Array.isArray(patient.medications)) {
      patient.medications = [];
    }

    // Create new medication
    const newMedication: PatientMedication = {
      ...data.medication,
      id: Date.now().toString(),
      addedBy: `${data.nurseName} (${data.nurseInitials})`,
      addedAt: new Date().toISOString(),
    };

    // Create activity log entry
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      nurse: `${data.nurseName} (${data.nurseInitials})`,
      action: "Added new medication",
      category: "medication",
      details: `Added ${newMedication.name} ${newMedication.dosage} ${newMedication.route} ${newMedication.frequency} for ${newMedication.indication}`,
      priority: "medium",
    };

    // Update patient data
    const updatedPatient = {
      ...patient,
      medications: [...patient.medications, newMedication],
      activityLog: [newActivity, ...patient.activityLog],
      lastModified: {
        by: `${data.nurseName} (${data.nurseInitials})`,
        at: new Date().toISOString(),
        changes: ["Added new medication"],
      },
    };

    // Remove this line:
    // patients.push(updatedPatient);

    const patientIdx = patients.findIndex(
      (p) => String(p.id) === String(patientId)
    );
    if (patientIdx !== -1) {
      patients[patientIdx] = updatedPatient;
    }

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      medication: newMedication,
    });
  } catch (error) {
    console.error("Error adding medication:", error);
    return NextResponse.json(
      { error: "Failed to add medication" },
      { status: 500 }
    );
  }
}
