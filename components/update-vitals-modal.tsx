"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Save, Activity } from "lucide-react"
import type { PatientVitals } from "@/types/patient"

interface UpdateVitalsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateVitals: (vitals: Partial<PatientVitals>, nurseInitials: string, nurseName: string) => Promise<void>
  currentVitals: PatientVitals
}

function UpdateVitalsModal({ isOpen, onClose, onUpdateVitals, currentVitals }: UpdateVitalsModalProps) {
  const [loading, setLoading] = useState(false)
  const [nurseInitials, setNurseInitials] = useState("")
  const [nurseName, setNurseName] = useState("")
  const [vitals, setVitals] = useState<Partial<PatientVitals>>({
    temperature: currentVitals.temperature || undefined,
    heartRate: currentVitals.heartRate || undefined,
    respiratoryRate: currentVitals.respiratoryRate || undefined,
    oxygenSaturation: currentVitals.oxygenSaturation || undefined,
    painLevel: currentVitals.painLevel || undefined,
    weight: currentVitals.weight || undefined,
    height: currentVitals.height || "",
    bloodPressure: currentVitals.bloodPressure || { systolic: undefined, diastolic: undefined },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nurseInitials.trim() || !nurseName.trim()) {
      alert("Please enter your initials and full name")
      return
    }

    setLoading(true)
    try {
      // Filter out empty values
      const filteredVitals: Partial<PatientVitals> = {}

      if (vitals.temperature) filteredVitals.temperature = vitals.temperature
      if (vitals.heartRate) filteredVitals.heartRate = vitals.heartRate
      if (vitals.respiratoryRate) filteredVitals.respiratoryRate = vitals.respiratoryRate
      if (vitals.oxygenSaturation) filteredVitals.oxygenSaturation = vitals.oxygenSaturation
      if (vitals.painLevel !== undefined) filteredVitals.painLevel = vitals.painLevel
      if (vitals.weight) filteredVitals.weight = vitals.weight
      if (vitals.height) filteredVitals.height = vitals.height
      if (vitals.bloodPressure?.systolic && vitals.bloodPressure?.diastolic) {
        filteredVitals.bloodPressure = vitals.bloodPressure
      }

      await onUpdateVitals(filteredVitals, nurseInitials, nurseName)
      onClose()
    } catch (error) {
      console.error("Error updating vitals:", error)
      alert("Failed to update vitals. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Update Vital Signs
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" disabled={loading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nurse Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-2xl">
            <div>
              <Label htmlFor="nurseInitials">Your Initials *</Label>
              <Input
                id="nurseInitials"
                value={nurseInitials}
                onChange={(e) => setNurseInitials(e.target.value.toUpperCase())}
                placeholder="e.g., SJ"
                maxLength={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="nurseName">Your Full Name *</Label>
              <Input
                id="nurseName"
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
                required
              />
            </div>
          </div>

          {/* Vital Signs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°F)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={vitals.temperature || ""}
                onChange={(e) =>
                  setVitals((prev) => ({
                    ...prev,
                    temperature: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="98.6"
              />
            </div>

            <div>
              <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
              <Input
                id="heartRate"
                type="number"
                value={vitals.heartRate || ""}
                onChange={(e) =>
                  setVitals((prev) => ({
                    ...prev,
                    heartRate: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  }))
                }
                placeholder="72"
              />
            </div>

            <div>
              <Label htmlFor="systolic">Blood Pressure (mmHg)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={vitals.bloodPressure?.systolic || ""}
                  onChange={(e) =>
                    setVitals((prev) => ({
                      ...prev,
                      bloodPressure: {
                        ...prev.bloodPressure,
                        systolic: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        diastolic: prev.bloodPressure?.diastolic || undefined,
                      },
                    }))
                  }
                  placeholder="120"
                />
                <span className="flex items-center">/</span>
                <Input
                  type="number"
                  value={vitals.bloodPressure?.diastolic || ""}
                  onChange={(e) =>
                    setVitals((prev) => ({
                      ...prev,
                      bloodPressure: {
                        ...prev.bloodPressure,
                        systolic: prev.bloodPressure?.systolic || undefined,
                        diastolic: e.target.value ? Number.parseInt(e.target.value) : undefined,
                      },
                    }))
                  }
                  placeholder="80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
              <Input
                id="respiratoryRate"
                type="number"
                value={vitals.respiratoryRate || ""}
                onChange={(e) =>
                  setVitals((prev) => ({
                    ...prev,
                    respiratoryRate: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  }))
                }
                placeholder="16"
              />
            </div>

            <div>
              <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
              <Input
                id="oxygenSaturation"
                type="number"
                value={vitals.oxygenSaturation || ""}
                onChange={(e) =>
                  setVitals((prev) => ({
                    ...prev,
                    oxygenSaturation: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  }))
                }
                placeholder="98"
              />
            </div>

            <div>
              <Label htmlFor="painLevel">Pain Level (0-10)</Label>
              <Input
                id="painLevel"
                type="number"
                min="0"
                max="10"
                value={vitals.painLevel !== undefined ? vitals.painLevel : ""}
                onChange={(e) =>
                  setVitals((prev) => ({ ...prev, painLevel: e.target.value ? Number.parseInt(e.target.value) : 0 }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={vitals.weight || ""}
                onChange={(e) =>
                  setVitals((prev) => ({
                    ...prev,
                    weight: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="150"
              />
            </div>

            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={vitals.height || ""}
                onChange={(e) => setVitals((prev) => ({ ...prev, height: e.target.value }))}
                placeholder="5'6&quot;"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
            <strong>Note:</strong> You can leave any field empty if not measured. Only filled fields will be updated.
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
              <Save className="w-5 h-5 mr-1" />
              {loading ? "Updating..." : "Update Vitals"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateVitalsModal

// Also keep the named export for flexibility
export { UpdateVitalsModal }
