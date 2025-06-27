import { type NextRequest, NextResponse } from "next/server"
import { mockPatients, mockPatientStatuses } from "@/lib/patient-data"
import type { PatientBasic, AddPatientRequest } from "@/types/patient"

// In-memory storage that persists across requests
const patients = [...mockPatients]
const patientStatuses = { ...mockPatientStatuses }

export async function GET() {
  try {
    return NextResponse.json({
      patients,
      statuses: patientStatuses,
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: AddPatientRequest = await request.json()

    // Generate new patient ID
    const existingIds = patients.map((p) => Number.parseInt(p.id)).filter((id) => !isNaN(id))
    const newId = existingIds.length > 0 ? (Math.max(...existingIds) + 1).toString() : "1"

    // Create new patient
    const newPatient: PatientBasic = {
      id: newId,
      name: data.name,
      room: data.room,
      admissionDate: new Date().toISOString(),
      primaryDiagnosis: data.primaryDiagnosis,
      allergies: data.allergies || [],
      riskLevel: data.riskLevel,
      isolationStatus: undefined,
      acuityLevel: data.acuityLevel,
      lastVitalsTime: new Date().toISOString(),
      nextMedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      hasAlerts: data.hasAlerts || false,
      isPendingDischarge: data.isPendingDischarge || false,
      requiresFollowUp: data.requiresFollowUp || false,
      nursingNotes: data.nursingNotes || [],
      age: data.age,
      gender: data.gender,
      emergencyContact: data.emergencyContact,
    }

    // Create default status
    const newStatus = {
      hasNewOrders: false,
      hasCriticalLabs: false,
      hasUnreadMessages: false,
      painLevel: data.vitals?.painLevel || 0,
      mobilityStatus: "independent" as const,
    }

    // Add to storage
    patients.push(newPatient)
    patientStatuses[newId] = newStatus

    return NextResponse.json({
      patient: newPatient,
      status: newStatus,
    })
  } catch (error) {
    console.error("Error adding patient:", error)
    return NextResponse.json({ error: "Failed to add patient" }, { status: 500 })
  }
}

// Export the current patients for use in other API routes
export { patients, patientStatuses }
