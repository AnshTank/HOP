"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  Clock,
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Activity,
  Pill,
  FileText,
  History,
  Plus,
  Save,
  Phone,
  Thermometer,
  Check,
  X,
  Edit,
  Bot,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import type {
  PatientDetails,
  NursingNote,
  PatientVitals,
  PatientMedication,
} from "@/types/patient";
import UpdateVitalsModal from "./update-vitals-modal";
import AddMedicationModal from "./add-medication-modal";
import PatientDetailsAIModal from "./patient-details-ai-modal";
import Clock2 from "./clock";

interface PatientDetailsClientProps {
  patientId: string;
}

export default function PatientDetailsClient({
  patientId,
}: PatientDetailsClientProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNursingNote, setNewNursingNote] = useState("");
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [currentNurse] = useState("Sarah RN");

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${patientId}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.error(`Patient with ID ${patientId} not found`);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPatient(data);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDischargePatient = async () => {
    if (!patient) return;

    try {
      setDischarging(true);
      const response = await fetch(`/api/patients/${patientId}/discharge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nurseInitials: "SJ",
          nurseName: currentNurse,
          dischargeTime: new Date().toISOString(),
          dischargeNotes: `Patient ${patient.name} discharged by ${currentNurse}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to discharge patient");
      }

      alert(`Patient ${patient.name} has been successfully discharged!`);
      router.push("/");
    } catch (error) {
      console.error("Error discharging patient:", error);
      alert("Failed to discharge patient. Please try again.");
    } finally {
      setDischarging(false);
      setShowDischargeConfirm(false);
    }
  };

  const handleUpdateVitals = async (
    vitals: Partial<PatientVitals>,
    nurseInitials: string,
    nurseName: string
  ) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/vitals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vitals,
          nurseInitials,
          nurseName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update vitals");
      }

      const data = await response.json();
      setPatient((prev) =>
        prev ? { ...prev, vitals: data.patient.vitals } : data.patient
      );
      setShowVitalsModal(false);
    } catch (error) {
      console.error("Error updating vitals:", error);
      throw error;
    }
  };

  // 1) Add Medication (unchanged – appends the new one)
  const handleAddMedication = async (
    medication: Omit<PatientMedication, "id" | "addedBy" | "addedAt">,
    nurseInitials: string,
    nurseName: string
  ) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication, nurseInitials, nurseName }),
      });
      if (!res.ok) throw new Error("Failed to add medication");
      const data = await res.json();

      if (data.medication) {
        setPatient((prev) =>
          prev
            ? {
                ...prev,
                medications: [...prev.medications, data.medication],
              }
            : prev
        );
      } else {
        // fallback if full patient returned
        setPatient(data.patient);
      }
      setShowMedicationModal(false);
    } catch (err) {
      console.error(err);
      alert("Error adding medication. Please try again.");
    }
  };

  // 2) Update / Hold / Discontinue
  const handleMedicationAction = async (
    medicationId: string,
    action: "given" | "held" | "discontinued",
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          action,
          nurseInitials: "SJ",
          nurseName: "Sarah Johnson",
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to update medication");

      const data = await res.json();
      console.log("Update response:", data);

      //  – Discontinue: remove immediately
      if (action === "discontinued") {
        setPatient((prev) =>
          prev
            ? {
                ...prev,
                medications: prev.medications.filter(
                  (m) => m.id !== medicationId
                ),
              }
            : prev
        );
        return;
      }

      //  – Otherwise update in place
      const updatedMed: PatientMedication = data.medication;
      setPatient((prev) =>
        prev
          ? {
              ...prev,
              medications: prev.medications.map((m) =>
                m.id === updatedMed.id ? updatedMed : m
              ),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update medication. Please try again.");
    }
  };

  const handleAddNursingNote = () => {
    if (!newNursingNote.trim() || !patient) return;

    const newNote: NursingNote = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      nurse: currentNurse,
      note: newNursingNote,
      category: "general",
    };

    setPatient((prev) =>
      prev
        ? {
            ...prev,
            nursingNotes: [newNote, ...prev.nursingNotes],
          }
        : null
    );

    setNewNursingNote("");
  };

  const getShiftStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 7 && hour < 19) return "day";
    if (hour >= 19 && hour < 23) return "evening";
    return "night";
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMinutes}m ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "vitals":
        return <Activity className="h-4 w-4" />;
      case "medication":
        return <Pill className="h-4 w-4" />;
      case "assessment":
        return <User className="h-4 w-4" />;
      case "notes":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Patient Information...
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare the patient details
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Patient Not Found
          </h2>
          <p className="text-gray-600 mb-2">Patient ID: {patientId}</p>
          <p className="text-gray-600 mb-4">
            The requested patient could not be found in the system.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/")} className="rounded-2xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patient List
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-2xl"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Discharge Confirmation Modal */}
      {showDischargeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Discharge Patient
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to discharge{" "}
                <strong>{patient.name}</strong>? This action cannot be undone
                and the patient will be removed from the system.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setShowDischargeConfirm(false)}
                  variant="outline"
                  className="rounded-2xl px-6"
                  disabled={discharging}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDischargePatient}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl px-6"
                  disabled={discharging}
                >
                  {discharging ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Discharging...
                    </>
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Confirm Discharge
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-teal-100 sticky top-0 z-40">
        <div className="max-w-[120rem] mx-auto px-10 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            {/* Left: Patient Info */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="rounded-2xl border-teal-200 hover:bg-teal-50 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patients
              </Button>

              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Heart className="h-7 w-7 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-cyan-500 bg-clip-text text-transparent truncate">
                  {patient.name}
                </h1>
                <p className="text-sm italic text-gray-500">
                  “Every handoff is a new chance to heal.” 💙
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-gray-600 text-base mt-1">
              <div className="flex items-center gap-1 whitespace-nowrap">
                <MapPin className="h-4 w-4" />
                <span>Room {patient.room}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-4 w-4" />
                <span>Age {patient.demographics.age}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span className="truncate">{patient.primaryDiagnosis}</span>
            </div>
            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-4 justify-end mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-5 py-2 min-w-[160px]">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <Clock2 />
              </div>

              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl px-5 py-2 capitalize min-w-[110px] text-center text-base">
                {getShiftStatus()} Shift
              </Badge>

              <Button
                onClick={() => setShowAIAssistant(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-medium flex items-center gap-2 text-base"
              >
                <Bot className="h-5 w-5" />
                <span>🤖 AI Assistant</span>
              </Button>

              <Button
                onClick={() => setShowDischargeConfirm(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-medium flex items-center gap-2 text-base"
                disabled={discharging}
              >
                <UserMinus className="h-5 w-5" />
                <span>Discharge Patient</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating AI Assistant Button
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setShowAIAssistant(true)}
          className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group border-4 border-white animate-pulse"
          title="AI Clinical Assistant"
        >
          <div className="flex flex-col items-center">
            <Bot className="h-8 w-8 group-hover:animate-bounce" />
            <span className="text-xs font-bold">AI</span>
          </div>
        </Button>
      </div> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Assistant Banner
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-2xl mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold">
                  🤖 AI Clinical Assistant Available
                </h3>
                <p className="text-purple-100">
                  Get instant clinical guidance for {patient.name}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAIAssistant(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 rounded-xl px-6 py-3 font-bold shadow-lg"
            >
              OPEN AI ASSISTANT
            </Button>
          </div>
        </div> */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 rounded-3xl p-2 mb-8">
            <TabsTrigger value="overview" className="rounded-2xl">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="vitals" className="rounded-2xl">
              <Activity className="h-4 w-4 mr-2" />
              Vitals & Meds
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-2xl">
              <FileText className="h-4 w-4 mr-2" />
              Nursing Notes
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-2xl">
              <History className="h-4 w-4 mr-2" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Demographics */}
              <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span>Demographics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {new Date(
                          patient.demographics.dateOfBirth
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Age</p>
                      <p className="font-medium">
                        {patient.demographics.age} years
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium">
                        {patient.demographics.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Marital Status</p>
                      <p className="font-medium">
                        {patient.demographics.maritalStatus}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <span>Emergency Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">
                        {patient.emergencyContact.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Relationship</p>
                      <p className="font-medium">
                        {patient.emergencyContact.relationship}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">
                        {patient.emergencyContact.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vitals">
            <div className="space-y-6">
              {/* Vital Signs */}
              <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <span>Vital Signs</span>
                    </div>
                    <Button
                      onClick={() => setShowVitalsModal(true)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-2xl"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Vitals
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(patient.vitals).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        No vital signs recorded yet
                      </p>
                      <p className="text-sm">
                        Click "Update Vitals" to add the first measurements
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {patient.vitals.temperature && (
                          <div className="bg-white/80 rounded-2xl p-3 text-center border">
                            <div className="text-lg font-bold flex items-center justify-center gap-1">
                              <Thermometer className="h-4 w-4" />
                              {patient.vitals.temperature}°F
                            </div>
                            <div className="text-xs opacity-70">
                              Temperature
                            </div>
                          </div>
                        )}
                        {patient.vitals.heartRate && (
                          <div className="bg-white/80 rounded-2xl p-3 text-center border">
                            <div className="text-lg font-bold">
                              {patient.vitals.heartRate}
                            </div>
                            <div className="text-xs opacity-70">Heart Rate</div>
                          </div>
                        )}
                        {patient.vitals.bloodPressure && (
                          <div className="bg-white/80 rounded-2xl p-3 text-center border">
                            <div className="text-lg font-bold">
                              {patient.vitals.bloodPressure.systolic}/
                              {patient.vitals.bloodPressure.diastolic}
                            </div>
                            <div className="text-xs opacity-70">
                              Blood Pressure
                            </div>
                          </div>
                        )}
                        {patient.vitals.respiratoryRate && (
                          <div className="bg-white/80 rounded-2xl p-3 text-center border">
                            <div className="text-lg font-bold">
                              {patient.vitals.respiratoryRate}
                            </div>
                            <div className="text-xs opacity-70">
                              Respiratory Rate
                            </div>
                          </div>
                        )}
                        {patient.vitals.oxygenSaturation && (
                          <div className="bg-white/80 rounded-2xl p-3 text-center border">
                            <div className="text-lg font-bold">
                              {patient.vitals.oxygenSaturation}%
                            </div>
                            <div className="text-xs opacity-70">
                              O2 Saturation
                            </div>
                          </div>
                        )}
                        {patient.vitals.painLevel !== undefined && (
                          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                            <div className="text-lg font-bold text-red-600">
                              {patient.vitals.painLevel}/10
                            </div>
                            <div className="text-xs text-red-600">
                              Pain Level
                            </div>
                          </div>
                        )}
                      </div>
                      {patient.vitals.lastTaken && (
                        <div className="mt-4 text-xs text-gray-500">
                          Last taken by {patient.vitals.takenBy} at{" "}
                          {new Date(patient.vitals.lastTaken).toLocaleString()}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Medications */}
              <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                        <Pill className="h-5 w-5 text-white" />
                      </div>
                      <span>Medications ({patient.medications.length})</span>
                    </div>
                    <Button
                      onClick={() => setShowMedicationModal(true)}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.medications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        No medications added yet
                      </p>
                      <p className="text-sm">
                        Click "Add Medication" to add the first medication
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {patient.medications.map((med) => (
                        <li key={med.id}>
                          <div
                            className={`bg-white/80 rounded-2xl p-3 border-l-4 ${
                              med.status === "held"
                                ? "border-red-500"
                                : "border-emerald-400"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-800">
                                  {med.name} {med.dosage}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {med.route} • {med.frequency} •{" "}
                                  {med.indication}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Added by {med.addedBy} on{" "}
                                  {new Date(med.addedAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex gap-2 flex-wrap justify-end">
                                {/* Status Badge */}
                                {med.status === "held" && (
                                  <Badge
                                    variant="destructive"
                                    className="rounded-xl"
                                  >
                                    Held
                                  </Badge>
                                )}
                                {med.status === "given" && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-xl"
                                  >
                                    Given
                                  </Badge>
                                )}

                                {/* Action Buttons */}
                                {(med.status === "active" ||
                                  med.status === "held") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMedicationAction(med.id, "given")
                                    }
                                    className="rounded-xl text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Mark Given
                                  </Button>
                                )}

                                {med.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMedicationAction(med.id, "held")
                                    }
                                    className="rounded-xl text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Hold
                                  </Button>
                                )}

                                {/* Discontinue always visible */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMedicationAction(
                                      med.id,
                                      "discontinued"
                                    )
                                  }
                                  className="rounded-xl text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Discontinue
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <p className="text-gray-500">Next Due</p>
                                <p className="font-medium">
                                  {med.nextDue || "Not scheduled"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Last Given</p>
                                <p className="font-medium">
                                  {med.lastGiven
                                    ? new Date(med.lastGiven).toLocaleString()
                                    : "Never"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-6">
              {/* Add New Note */}
              <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span>Add Nursing Note</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={newNursingNote}
                      onChange={(e) => setNewNursingNote(e.target.value)}
                      placeholder="Enter your nursing note here..."
                      className="min-h-24 rounded-2xl"
                    />
                    <Button
                      onClick={handleAddNursingNote}
                      disabled={!newNursingNote.trim()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Notes */}
              <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span>Nursing Notes ({patient.nursingNotes.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 hide-scrollbar">
                    <div className="space-y-4">
                      {patient.nursingNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white/80 rounded-2xl p-4 border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="rounded-xl text-xs"
                              >
                                {note.category}
                              </Badge>
                              <span className="text-sm font-medium text-gray-800">
                                {note.nurse}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(note.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-white/60 border-0 shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <span>Activity Log ({patient.activityLog.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {patient.activityLog.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white/80 rounded-2xl p-4 border-l-4 border-violet-400"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(log.category)}
                            <span className="font-medium text-gray-800">
                              {log.action}
                            </span>
                            <Badge
                              className={`rounded-xl text-xs ${getPriorityColor(
                                log.priority
                              )}`}
                            >
                              {log.priority}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-800">
                              {log.nurse}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          {log.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <UpdateVitalsModal
        isOpen={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
        onUpdateVitals={handleUpdateVitals}
        currentVitals={patient.vitals}
      />

      <AddMedicationModal
        isOpen={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        onAddMedication={handleAddMedication}
      />

      {/* AI Assistant Modal */}
      {patient && (
        <PatientDetailsAIModal
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          patient={patient}
        />
      )}
    </div>
  );
}
