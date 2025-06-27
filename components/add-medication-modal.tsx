"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X, Save, Pill } from "lucide-react"
import type { PatientMedication } from "@/types/patient"

interface AddMedicationModalProps {
  isOpen: boolean
  onClose: () => void
  onAddMedication: (
    medication: Omit<PatientMedication, "id" | "addedBy" | "addedAt">,
    nurseInitials: string,
    nurseName: string,
  ) => Promise<void>
}

export function AddMedicationModal({ isOpen, onClose, onAddMedication }: AddMedicationModalProps) {
  const [loading, setLoading] = useState(false)
  const [nurseInitials, setNurseInitials] = useState("")
  const [nurseName, setNurseName] = useState("")
  const [medication, setMedication] = useState({
    name: "",
    dosage: "",
    route: "",
    frequency: "",
    nextDue: "",
    prescriber: "",
    indication: "",
    status: "active" as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nurseInitials.trim() || !nurseName.trim()) {
      alert("Please enter your initials and full name")
      return
    }

    if (!medication.name || !medication.dosage || !medication.route || !medication.frequency) {
      alert("Please fill in all required medication fields")
      return
    }

    setLoading(true)
    try {
      await onAddMedication(medication, nurseInitials, nurseName)

      // Reset form
      setMedication({
        name: "",
        dosage: "",
        route: "",
        frequency: "",
        nextDue: "",
        prescriber: "",
        indication: "",
        status: "active",
      })
      setNurseInitials("")
      setNurseName("")

      onClose()
    } catch (error) {
      console.error("Error adding medication:", error)
      alert("Failed to add medication. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <Pill className="w-6 h-6" />
            Add New Medication
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" disabled={loading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nurse Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-2xl">
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

          {/* Medication Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medName">Medication Name *</Label>
              <Input
                id="medName"
                value={medication.name}
                onChange={(e) => setMedication((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Metoprolol"
                required
              />
            </div>

            <div>
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={medication.dosage}
                onChange={(e) => setMedication((prev) => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 25mg"
                required
              />
            </div>

            <div>
              <Label htmlFor="route">Route *</Label>
              <Select
                value={medication.route}
                onValueChange={(value) => setMedication((prev) => ({ ...prev, route: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PO">PO (By mouth)</SelectItem>
                  <SelectItem value="IV">IV (Intravenous)</SelectItem>
                  <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                  <SelectItem value="SQ">SQ (Subcutaneous)</SelectItem>
                  <SelectItem value="Topical">Topical</SelectItem>
                  <SelectItem value="Inhaled">Inhaled</SelectItem>
                  <SelectItem value="Rectal">Rectal</SelectItem>
                  <SelectItem value="Sublingual">Sublingual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={medication.frequency}
                onValueChange={(value) => setMedication((prev) => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Once daily">Once daily</SelectItem>
                  <SelectItem value="BID">BID (Twice daily)</SelectItem>
                  <SelectItem value="TID">TID (Three times daily)</SelectItem>
                  <SelectItem value="QID">QID (Four times daily)</SelectItem>
                  <SelectItem value="Q4H">Q4H (Every 4 hours)</SelectItem>
                  <SelectItem value="Q6H">Q6H (Every 6 hours)</SelectItem>
                  <SelectItem value="Q8H">Q8H (Every 8 hours)</SelectItem>
                  <SelectItem value="Q12H">Q12H (Every 12 hours)</SelectItem>
                  <SelectItem value="PRN">PRN (As needed)</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nextDue">Next Due Time</Label>
              <Input
                id="nextDue"
                type="datetime-local"
                value={medication.nextDue}
                onChange={(e) => setMedication((prev) => ({ ...prev, nextDue: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="prescriber">Prescriber</Label>
              <Input
                id="prescriber"
                value={medication.prescriber}
                onChange={(e) => setMedication((prev) => ({ ...prev, prescriber: e.target.value }))}
                placeholder="e.g., Dr. Smith"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="indication">Indication/Purpose</Label>
            <Textarea
              id="indication"
              value={medication.indication}
              onChange={(e) => setMedication((prev) => ({ ...prev, indication: e.target.value }))}
              placeholder="e.g., Hypertension, Pain management"
              className="min-h-20"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 text-white hover:bg-green-700" disabled={loading}>
              <Save className="w-5 h-5 mr-1" />
              {loading ? "Adding..." : "Add Medication"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Also keep the named export for flexibility

export default AddMedicationModal
