import { type NextRequest, NextResponse } from "next/server"
import type { UpdateVitalsRequest, PatientDetails, ActivityLog } from "@/types/patient"

// In-memory storage (in production, use a real database)
const patientsData = new Map<string, PatientDetails>()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id
    const data: Omit<UpdateVitalsRequest, "patientId"> = await request.json()

    // Get current patient data
    const response = await fetch(`${request.nextUrl.origin}/api/patients/${patientId}`)
    if (!response.ok) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const patient: PatientDetails = await response.json()

    // Update vitals
    const updatedVitals = {
      ...patient.vitals,
      ...data.vitals,
      lastTaken: new Date().toISOString(),
      takenBy: data.nurseName,
    }

    // Create activity log entry
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      nurse: `${data.nurseName} (${data.nurseInitials})`,
      action: "Updated vital signs",
      category: "vitals",
      details: `Updated vitals: ${Object.entries(data.vitals)
        .map(([key, value]) => {
          if (key === "bloodPressure" && value) {
            return `BP: ${value.systolic}/${value.diastolic}`
          }
          return `${key}: ${value}`
        })
        .join(", ")}`,
      priority: "medium",
    }

    // Update patient data
    const updatedPatient = {
      ...patient,
      vitals: updatedVitals,
      activityLog: [newActivity, ...patient.activityLog],
      lastModified: {
        by: `${data.nurseName} (${data.nurseInitials})`,
        at: new Date().toISOString(),
        changes: ["Updated vital signs"],
      },
    }

    // Store updated data
    patientsData.set(patientId, updatedPatient)

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
    })
  } catch (error) {
    console.error("Error updating vitals:", error)
    return NextResponse.json({ error: "Failed to update vitals" }, { status: 500 })
  }
}
