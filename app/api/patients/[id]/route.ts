import { type NextRequest, NextResponse } from "next/server";
import { generatePatientDetails } from "@/lib/patient-data";

// Mock patient data (should come from DB in real apps)
import { mockPatients, mockPatientStatuses } from "@/lib/patient-data";
let patients: any[] = [...mockPatients];
let patientStatuses: any = { ...mockPatientStatuses };

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const patientId = id;

  // Try to refresh data from main API
  try {
    const patientsResponse = await fetch(
      `${request.nextUrl.origin}/api/patients`
    );
    if (patientsResponse.ok) {
      const data = await patientsResponse.json();
      patients = data.patients;
      patientStatuses = data.statuses;
    }
  } catch (fetchError) {
    console.log("Could not fetch updated patients list, using current data");
  }

  const patientDetails = generatePatientDetails(patientId, patients);

  if (!patientDetails) {
    return NextResponse.json(
      {
        error: "Patient not found",
        message: `Patient with ID ${patientId} does not exist`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(patientDetails);
}
