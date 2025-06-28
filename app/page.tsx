"use client";

import { useState, useEffect } from "react";
import { WarmPatientCard } from "@/components/warm-patient-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Users,
  Clock,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Mic,
  Plus,
} from "lucide-react";
import type {
  PatientBasic,
  PatientStatus,
  AddPatientRequest,
} from "@/types/patient";
import { AddPatientModal } from "@/components/add-patient-modal";
import { useRouter } from "next/navigation";
import Clock2 from "@/components/clock";
import {
  sortPatientsByPriority,
  getCriticalCount,
  getShiftStatus,
} from "@/lib/patient-data";

export default function NurseShiftCompanion() {
  const [selectedPatient, setSelectedPatient] = useState<
    PatientBasic | undefined
  >();
  const [patients, setPatients] = useState<PatientBasic[]>([]);
  const [patientStatuses, setPatientStatuses] = useState<
    Record<string, PatientStatus>
  >({});
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const router = useRouter();

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/patients");
      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }
      const data = await response.json();
      setPatients(data.patients);

      // Generate empty statuses for each patient
      const statuses: Record<string, PatientStatus> = {};
      data.patients.forEach((p: any) => {
        statuses[p._id] = {
          hasNewOrders: false,
          hasCriticalLabs: false,
          hasUnreadMessages: false,
          painLevel: 0,
          mobilityStatus: "independent",
        };
      });
      setPatientStatuses(statuses);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (newPatientData: AddPatientRequest) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPatientData),
      });

      if (!response.ok) {
        throw new Error("Failed to add patient");
      }

      const data = await response.json();

      // Update local state
      setPatients((prev) => [...prev, data.patient]);
      setPatientStatuses((prev) => ({
        ...prev,
        [data.patient.id]: data.status,
      }));

      setShowAddPatientModal(false);
    } catch (error) {
      console.error("Error adding patient:", error);
      throw error;
    }
  };

  const sortedPatients = sortPatientsByPriority(patients);

  const getVisiblePatients = () => {
    const cardsPerView = 3;
    return sortedPatients.slice(
      currentCardIndex,
      currentCardIndex + cardsPerView
    );
  };

  const nextCards = () => {
    if (currentCardIndex + 3 < sortedPatients.length) {
      setCurrentCardIndex(currentCardIndex + 3);
    }
  };

  const prevCards = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(Math.max(0, currentCardIndex - 3));
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
            Please wait while we prepare your patient dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-teal-50 via-white to-cyan-50"
      }`}
    >
      {/* Fixed Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-teal-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-lg">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-500 bg-clip-text text-transparent">
                  Caring Handoff Companion
                </h1>
                <p className="text-gray-600 font-medium">
                  Supporting compassionate patient care transitions ✨
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-4 py-2 min-w-[140px]">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <Clock2 />
                </div>

                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl px-4 py-2 capitalize min-w-[100px] text-center">
                  {getShiftStatus()} Shift
                </Badge>

                <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-4 py-2 min-w-[120px]">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">
                    {patients.length} Patients
                  </span>
                </div>

                {getCriticalCount(patients) > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-400 text-white rounded-2xl px-4 py-2 animate-pulse min-w-[120px] text-center">
                    🚨 {getCriticalCount(patients)} Critical
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => setShowAddPatientModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white rounded-2xl px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-2xl border-teal-200 hover:bg-teal-50"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Your Patients Today
            </h2>
            <p className="text-gray-600 text-lg">
              Select a patient to begin their handoff documentation
            </p>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevCards}
              disabled={currentCardIndex === 0}
              className="rounded-2xl border-teal-200 hover:bg-teal-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              {Array.from({
                length: Math.ceil(sortedPatients.length / 3),
              }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    Math.floor(currentCardIndex / 3) === index
                      ? "bg-teal-500 w-8"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextCards}
              disabled={currentCardIndex + 3 >= sortedPatients.length}
              className="rounded-2xl border-teal-200 hover:bg-teal-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Patient Cards - Dynamic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
            {getVisiblePatients().map((patient) => (
              <WarmPatientCard
                key={patient._id}
                patient={patient}
                status={{
                  hasNewOrders: false,
                  hasCriticalLabs: false,
                  hasUnreadMessages: false,
                  painLevel: 0,
                  mobilityStatus: "independent",
                }}
                isSelected={selectedPatient?._id === patient._id}
                onSelect={() => setSelectedPatient(patient)}
                onStartHandoff={() => {
                  console.log(
                    "Navigating to patient details for:",
                    patient._id
                  );
                  router.push(`/patient-details/${patient._id}`);
                }}
              />
            ))}
          </div>

          {/* Floating Voice Button */}
          <div className="fixed bottom-8 right-8">
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
              <Mic className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Add Patient Modal */}
        <AddPatientModal
          isOpen={showAddPatientModal}
          onClose={() => setShowAddPatientModal(false)}
          onAddPatient={handleAddPatient}
        />
      </main>
    </div>
  );
}
