import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/Users";
import Patient from "@/backend/models/PatientSchema";
import "@/backend/models/NursingSchema";
import "@/backend/models/MedicationSchema";
import "@/backend/models/VitalsSchema";
import "@/backend/models/ActivityLogSchema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Use correct field names for populate
    const patient = await Patient.findById(id)
      .populate("medications")
      .populate("vitals")
      .populate("nursingNotes")
      .populate("activityLog");

    if (!patient) {
      return NextResponse.json(
        {
          error: "Patient not found",
          message: `Patient with ID ${id} does not exist`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}
