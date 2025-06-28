import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/Users"; // Update path if needed
import Patient from "@/backend/models/PatientSchema"; // Update path if needed
import "@/backend/models/MedicationSchema";
import "@/backend/models/VitalsSchema";
import "@/backend/models/NursingSchema";
import "@/backend/models/ActivityLogSchema";

export async function GET() {
  try {
    await connectDB();
    // Populate related fields if needed (e.g., medications, vitals, etc.)
    const patients = await Patient.find()
      .populate("medications")
      .populate("vitals")
      .populate("nursingNotes")
      .populate("activityLog");
    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    // Create new patient in MongoDB
    const newPatient = await Patient.create({
      name: data.name,
      room: data.room,
      admissionDate: new Date().toISOString(),
      primaryDiagnosis: data.primaryDiagnosis,
      allergies: data.allergies || [],
      riskLevel: data.riskLevel,
      isolationStatus: data.isolationStatus,
      acuityLevel: data.acuityLevel,
      lastVitalsTime: new Date().toISOString(),
      nextMedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      hasAlerts: data.hasAlerts || false,
      isPendingDischarge: data.isPendingDischarge || false,
      requiresFollowUp: data.requiresFollowUp || false,
      nursingNotes: [], // Always start empty, add notes later via their own API
      age: data.age,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      emergencyContact: data.emergencyContact,
      demographics: data.demographics,
      insurance: data.insurance,
      vitals: data.vitals,
      medications: data.medications,
      activityLog: data.activityLog,
      lastModified: {
        by: data.lastModified?.by || "",
        at: data.lastModified?.at || new Date().toISOString(),
        changes: data.lastModified?.changes || [],
      },
    });

    return NextResponse.json({ patient: newPatient });
  } catch (error) {
    console.error("Error adding patient:", error);
    return NextResponse.json(
      { error: "Failed to add patient" },
      { status: 500 }
    );
  }
}
