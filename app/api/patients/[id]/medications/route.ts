import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/Users";
import Patient from "@/backend/models/PatientSchema";
import Medication from "@/backend/models/MedicationSchema";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id: patientId } = await params;
    const data = await request.json();

    // Create new medication document
    const newMedication = await Medication.create({
      ...data.medication,
      addedBy: `${data.nurseName} (${data.nurseInitials})`,
      addedAt: new Date().toISOString(),
      status: "active",
    });

    // Add medication to patient
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $push: {
          medications: newMedication._id,
          activityLog: {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            nurse: `${data.nurseName} (${data.nurseInitials})`,
            action: "Added new medication",
            category: "medication",
            details: `Added ${newMedication.name} ${newMedication.dosage} ${newMedication.route} ${newMedication.frequency} for ${newMedication.indication}`,
            priority: "medium",
          },
        },
        $set: {
          lastModified: {
            by: `${data.nurseName} (${data.nurseInitials})`,
            at: new Date().toISOString(),
            changes: ["Added new medication"],
          },
        },
      },
      { new: true }
    )
      .populate("medications")
      .populate("activityLog");

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patient,
      medication: newMedication,
      activityLog: patient.activityLog,
    });
  } catch (error) {
    console.error("Error adding medication:", error);
    return NextResponse.json(
      { error: "Failed to add medication" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id: patientId } = await params;
    const data = await request.json();

    // Find the medication and update its status
    const medication = await Medication.findByIdAndUpdate(
      data.medicationId,
      {
        status:
          data.action === "given"
            ? "given"
            : data.action === "held"
            ? "held"
            : "discontinued",
        lastGiven:
          data.action === "given" ? new Date().toISOString() : undefined,
      },
      { new: true }
    );

    if (!medication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    // Optionally remove medication from patient if discontinued
    if (data.action === "discontinued") {
      await Patient.findByIdAndUpdate(patientId, {
        $pull: { medications: medication._id },
      });
    }

    // Add activity log to patient
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $push: {
          activityLog: {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            nurse: `${data.nurseName} (${data.nurseInitials})`,
            action: `Medication ${data.action}`,
            category: "medication",
            details: `Medication ${medication.name} marked as ${data.action}`,
            priority: "medium",
          },
        },
        $set: {
          lastModified: {
            by: `${data.nurseName} (${data.nurseInitials})`,
            at: new Date().toISOString(),
            changes: [`Medication ${data.action}`],
          },
        },
      },
      { new: true }
    )
      .populate("medications")
      .populate("activityLog");

    return NextResponse.json({
      success: true,
      medication,
      patient,
      activityLog: patient?.activityLog,
    });
  } catch (err) {
    console.error("Error updating medication:", err);
    return NextResponse.json(
      { error: "Failed to update medication" },
      { status: 500 }
    );
  }
}
