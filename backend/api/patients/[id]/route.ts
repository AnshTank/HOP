import { type NextRequest, NextResponse } from "next/server"
import { generatePatientDetails } from "@/backend/lib/patient-data"

// Import the current patients from the main API route
// Note: In a real app, this would come from a database
let patients: any[] = []
let patientStatuses: any = {}

// Initialize with mock data
import { mockPatients, mockPatientStatuses } from "@/backend/lib/patient-data"
patients = [...mockPatients]
patientStatuses = { ...mockPatientStatuses }

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id

    // First, try to get updated patients list from the main API
    try {
      const patientsResponse = await fetch(`${request.nextUrl.origin}/backend/api/patients`)
      if (patientsResponse.ok) {
        const data = await patientsResponse.json()
        patients = data.patients
        patientStatuses = data.statuses
      }
    } catch (fetchError) {
      console.log("Could not fetch updated patients list, using current data")
    }

    const patientDetails = generatePatientDetails(patientId, patients)

    if (!patientDetails) {
      return NextResponse.json(
        {
          error: "Patient not found",
          message: `Patient with ID ${patientId} does not exist`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(patientDetails)
  } catch (error) {
    console.error("Error fetching patient details:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch patient details",
        message: "An internal server error occurred",
      },
      { status: 500 },
    )
  }
}
