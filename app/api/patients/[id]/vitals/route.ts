import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/Users"; // Update path if needed
import Patient from "@/backend/models/PatientSchema"; // Update path if needed
import Vitals from "@/backend/models/VitalsSchema"; // Update path if needed
import "@/backend/models/ActivityLogSchema"; // <-- Add this line

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id: patientId } = await params;
    const data = await request.json();

    // Find patient
    const patient = await Patient.findById(patientId)
      .populate("vitals")
      .populate("activityLog");
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Update or create vitals document
    let updatedVitals;
    if (patient.vitals) {
      updatedVitals = await Vitals.findByIdAndUpdate(
        patient.vitals._id,
        {
          ...data.vitals,
          lastTaken: new Date().toISOString(),
          takenBy: "", // Clear nurse value first
        },
        { new: true }
      );
      // Now update with the new nurse name
      updatedVitals.takenBy = data.nurseName;
      await updatedVitals.save();
    } else {
      updatedVitals = await Vitals.create({
        ...data.vitals,
        lastTaken: new Date().toISOString(),
        takenBy: data.nurseName,
      });
      patient.vitals = updatedVitals._id;
      await patient.save(); // <-- Save immediately after assigning vitals
    }

    // Create activity log entry
    const newActivity = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      nurse: `${data.nurseName} (${data.nurseInitials})`,
      action: "Updated vital signs",
      category: "vitals",
      details: `Updated vitals: ${Object.entries(data.vitals)
        .map(([key, value]) => {
          if (
            key === "bloodPressure" &&
            value &&
            typeof value === "object" &&
            "systolic" in value &&
            "diastolic" in value
          ) {
            return `BP: ${value.systolic}/${value.diastolic}`;
          }
          return `${key}: ${value}`;
        })
        .join(", ")}`,
      priority: "medium",
    };

    // Update patient with new vitals and activity log
    patient.activityLog.unshift(newActivity);
    patient.lastModified = {
      by: `${data.nurseName} (${data.nurseInitials})`,
      at: new Date().toISOString(),
      changes: ["Updated vital signs"],
    };
    await patient.save();

    // Re-fetch the patient with populated vitals and activityLog
    const updatedPatient = await Patient.findById(patientId)
      .populate("vitals")
      .populate("activityLog");

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      vitals: updatedVitals,
    });
  } catch (error) {
    console.error("Error updating vitals:", error);
    return NextResponse.json(
      { error: "Failed to update vitals" },
      { status: 500 }
    );
  }
}
