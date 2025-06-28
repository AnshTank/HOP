import mongoose from "mongoose";
import NursingNote from "../models/NursingSchema.js";

const MONGODB_URI = "mongodb://localhost:27017/NurseCompanionDb"; // Replace with your DB URI

async function main() {
  await mongoose.connect(MONGODB_URI);

  const dummyNotes = [
    {
      nurse: "Sarah Johnson",
      note: "Patient resting comfortably. Vitals stable.",
      category: "assessment",
      timestamp: new Date().toISOString(),
    },
    {
      nurse: "John Smith",
      note: "Administered pain medication as ordered.",
      category: "medication",
      timestamp: new Date().toISOString(),
    },
    {
      nurse: "Emily Lee",
      note: "Patient education provided on discharge instructions.",
      category: "education",
      timestamp: new Date().toISOString(),
    },
  ];

  const result = await NursingNote.insertMany(dummyNotes);
  console.log("Inserted nursing notes:", result);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
