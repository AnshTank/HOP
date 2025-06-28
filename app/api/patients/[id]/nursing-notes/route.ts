import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/backend/Users";
import Patient from "@/backend/models/PatientSchema";
import NursingNote from "@/backend/models/NursingSchema";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await request.json();

    // Create the nursing note
    const newNote = await NursingNote.create({
      nurse: data.nurse,
      note: data.note,
      category: data.category || "general",
      timestamp: new Date().toISOString(),
    });

    // Add the note to the patient's nursingNotes array
    const patient = await Patient.findByIdAndUpdate(
      id,
      { $push: { nursingNotes: newNote._id } },
      { new: true }
    ).populate("nursingNotes");

    return NextResponse.json({ patient, nursingNote: newNote });
  } catch (error) {
    console.error("Error adding nursing note:", error);
    return NextResponse.json(
      { error: "Failed to add nursing note" },
      { status: 500 }
    );
  }
}
