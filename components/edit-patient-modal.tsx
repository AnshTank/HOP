"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Save } from "lucide-react";
import type { PatientDetails } from "@/types/patient";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDetails;
  onEditPatient: (patient: Partial<PatientDetails>) => Promise<void>;
}

const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
const ACUITY_LEVELS = [1, 2, 3, 4, 5] as const;

export function EditPatientModal({
  isOpen,
  onClose,
  patient,
  onEditPatient,
}: EditPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientDetails>>({
    name: patient.name || "",
    room: patient.room || "",
    primaryDiagnosis: patient.primaryDiagnosis || "",
    allergies: patient.allergies || [],
    riskLevel: patient.riskLevel || "medium",
    acuityLevel: patient.acuityLevel || 3,
    hasAlerts: !!patient.hasAlerts,
    requiresFollowUp: !!patient.requiresFollowUp,
    isPendingDischarge: !!patient.isPendingDischarge,
    hasCriticalLabs: !!patient.hasCriticalLabs,
    requiresContactPrecautions: !!patient.requiresContactPrecautions,
    nursingNotes: Array.isArray(patient.nursingNotes)
      ? patient.nursingNotes.map((n: any) =>
          typeof n === "string" ? n : n.note
        )
      : [],
    age: patient.age ?? "",
    gender: patient.gender ?? "",
    emergencyContact: patient.emergencyContact || {
      name: "",
      relationship: "",
      phone: "",
    },
  });

  const [currentAllergy, setCurrentAllergy] = useState("");
  const [currentNote, setCurrentNote] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !formData.name?.trim() ||
      !formData.room?.trim() ||
      !formData.primaryDiagnosis?.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await onEditPatient(formData);
      onClose();
    } catch (error) {
      alert("Failed to update patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addToList = (listKey: keyof PatientDetails, value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [listKey]: [...((prev[listKey] as string[]) || []), value.trim()],
      }));
    }
  };

  const removeFromList = (listKey: keyof PatientDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [listKey]: ((prev[listKey] as string[]) || []).filter(
        (item) => item !== value
      ),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 md:p-8 my-10 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            Edit Patient Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            disabled={loading}
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Full Name *"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Input
                placeholder="Room Number *"
                value={formData.room || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, room: e.target.value }))
                }
                required
              />
              <Input
                placeholder="Primary Diagnosis *"
                value={formData.primaryDiagnosis || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryDiagnosis: e.target.value,
                  }))
                }
                required
              />
              <Input
                type="number"
                placeholder="Age *"
                value={formData.age?.toString() || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age: Number.parseInt(e.target.value) || "",
                  }))
                }
                required
              />
              <Input
                placeholder="Gender"
                value={formData.gender || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gender: e.target.value }))
                }
              />
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Contact Name *"
                value={formData.emergencyContact?.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      name: e.target.value,
                    },
                  }))
                }
                required
              />
              <Input
                placeholder="Relationship *"
                value={formData.emergencyContact?.relationship || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      relationship: e.target.value,
                    },
                  }))
                }
                required
              />
              <Input
                placeholder="Phone Number *"
                value={formData.emergencyContact?.phone || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      phone: e.target.value,
                    },
                  }))
                }
                required
              />
            </div>
          </section>

          {/* Risk & Acuity */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Risk & Acuity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={formData.riskLevel}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    riskLevel: value as "low" | "medium" | "high" | "critical",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={formData.acuityLevel?.toString() || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    acuityLevel: Number(value) as 1 | 2 | 3 | 4 | 5,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Acuity Level" />
                </SelectTrigger>
                <SelectContent>
                  {ACUITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Allergies */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Allergies</h3>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Add Allergy"
                value={currentAllergy}
                onChange={(e) => setCurrentAllergy(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  addToList("allergies", currentAllergy);
                  setCurrentAllergy("");
                }}
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.allergies || []).map((allergy, index) => (
                <Badge
                  key={index}
                  variant="destructive"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {allergy}
                  <span
                    className="cursor-pointer"
                    onClick={() => removeFromList("allergies", allergy)}
                  >
                    ×
                  </span>
                </Badge>
              ))}
            </div>
          </section>

          {/* Nursing Notes */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Nursing Notes
            </h3>
            <div className="flex gap-2 items-start">
              <Textarea
                placeholder="Add nursing note..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  addToList("nursingNotes", currentNote);
                  setCurrentNote("");
                }}
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <ul className="list-disc pl-6 space-y-1">
              {(formData.nursingNotes || []).map((note, index) => (
                <li key={index} className="flex justify-between items-center">
                  {note}
                  <span
                    className="cursor-pointer text-red-500"
                    onClick={() => removeFromList("nursingNotes", note)}
                  >
                    ×
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Status Flags */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Status Flags
            </h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.hasAlerts}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hasAlerts: e.target.checked,
                    }))
                  }
                />
                Has Alerts
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.requiresFollowUp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiresFollowUp: e.target.checked,
                    }))
                  }
                />
                Follow-up Needed
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.isPendingDischarge}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPendingDischarge: e.target.checked,
                    }))
                  }
                />
                Pending Discharge
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.hasCriticalLabs}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hasCriticalLabs: e.target.checked,
                    }))
                  }
                />
                Critical Labs
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.requiresContactPrecautions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiresContactPrecautions: e.target.checked,
                    }))
                  }
                />
                Contact Precautions
              </label>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-1" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
