import { type NextRequest, NextResponse } from "next/server";
import { patients, patientStatuses } from "@/app/api/patients/route";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nurseInitials, nurseName, dischargeTime, dischargeNotes } = body;

    // Find the patient
    const patientIndex = patients.findIndex((p) => p.id === id);
    if (patientIndex === -1) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patient = patients[patientIndex];

    // Log the discharge activity
    console.log(
      `Patient ${patient.name} (ID: ${id}) discharged by ${nurseName} at ${dischargeTime}`
    );

    // Remove patient from the system
    patients.splice(patientIndex, 1);

    // Remove patient status
    delete patientStatuses[id];

    return NextResponse.json({
      success: true,
      message: `Patient ${patient.name} has been successfully discharged`,
      dischargedPatient: {
        id: patient.id,
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
