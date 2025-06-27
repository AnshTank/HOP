import { type NextRequest, NextResponse } from "next/server"
import { mockPatients, mockPatientStatuses } from "@/backend/lib/patient-data"
import type { AddPatientRequest, PatientBasic } from "@/frontend/types/patient"

// In-memory storage (in a real app, this would be a database)
const patients: PatientBasic[] = [...mockPatients]
const patientStatuses = { ...mockPatientStatuses }

export async function GET() {
  try {
    return NextResponse.json({
      patients,
      statuses: patientStatuses,
      count: patients.length,
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch patients",
        message: "An internal server error occurred",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AddPatientRequest = await request.json()

    // Generate new patient ID
    const newId = (Math.max(...patients.map((p) => Number.parseInt(p.id))) + 1).toString()

    // Create new patient
    const newPatient: PatientBasic = {
      id: newId,
      name: body.name,
      room: body.room,
      admissionDate: new Date().toISOString().split("T")[0],
      primaryDiagnosis: body.primaryDiagnosis,
      allergies: body.allergies,
      riskLevel: body.riskLevel,
      acuityLevel: body.acuityLevel,
      hasAlerts: body.hasAlerts || false,
      isPendingDischarge: body.isPendingDischarge || false,
      requiresFollowUp: body.requiresFollowUp || false,
      nursingNotes: body.nursingNotes || [],
      age: body.age,
      gender: body.gender,
      emergencyContact: body.emergencyContact,
    }

    // Create patient status
    const newStatus = {
      hasNewOrders: false,
      hasCriticalLabs: false,
      hasUnreadMessages: false,
      painLevel: 0,
      mobilityStatus: "independent" as const,
    }

    // Add to storage
    patients.push(newPatient)
    patientStatuses[newId] = newStatus

    return NextResponse.json({
      patient: newPatient,
      status: newStatus,
      message: "Patient added successfully",
    })
  } catch (error) {
    console.error("Error adding patient:", error)
    return NextResponse.json(
      {
        error: "Failed to add patient",
        message: "An internal server error occurred",
      },
      { status: 500 },
    )
  }
}
