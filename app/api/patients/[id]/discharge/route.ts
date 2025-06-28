import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/Users"; // Update path if needed
import Patient from "@/backend/models/PatientSchema"; // Update path if needed

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    const { nurseInitials, nurseName, dischargeTime, dischargeNotes } = body;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Optionally: log discharge activity in a separate collection here

    return NextResponse.json({
      success: true,
      message: `Patient ${patient.name} has been successfully discharged`,
      dischargedPatient: {
        id: patient._id,
        name: patient.name,
        dischargeTime,
        dischargedBy: nurseName,
        notes: dischargeNotes,
      },
    });
  } catch (error) {
    console.error("Error discharging patient:", error);
    return NextResponse.json(
      { error: "Failed to discharge patient" },
      { status: 500 }
    );
  }
}
