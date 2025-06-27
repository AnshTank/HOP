import PatientDetailsClient from "@/components/patient-details-client"

interface PatientDetailsPageProps {
  params: { patientId: string }
}

export default async function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const resolvedParams = await params
  return <PatientDetailsClient patientId={resolvedParams.patientId} />
}
