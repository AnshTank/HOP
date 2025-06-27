"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Clock,
  Pill,
  Shield,
  Calendar,
  Mic,
  Volume2,
  MessageCircle,
  Activity,
  AlertTriangle,
  Bed,
} from "lucide-react"
import type { PatientBasic, PatientStatus } from "@/types/patient"

interface WarmPatientCardProps {
  patient: PatientBasic
  status: PatientStatus
  isSelected?: boolean
  onSelect: () => void
  onStartHandoff: () => void
}

export function WarmPatientCard({ patient, status, isSelected, onSelect, onStartHandoff }: WarmPatientCardProps) {
  const [mood, setMood] = useState<"calm" | "anxious" | "pain" | null>(null)

  const getPriorityRibbon = () => {
    if (patient.riskLevel === "critical" || patient.acuityLevel >= 4) {
      return "bg-gradient-to-r from-red-500 to-red-300"
    }
    if (patient.riskLevel === "high" || patient.acuityLevel === 3) {
      return "bg-gradient-to-r from-orange-500 to-orange-300"
    }
    return "bg-gradient-to-r from-green-500 to-green-300"
  }

  const getMoodColor = () => {
    switch (mood) {
      case "calm":
        return "bg-green-200"
      case "anxious":
        return "bg-yellow-200"
      case "pain":
        return "bg-red-200"
      default:
        return "bg-gray-200"
    }
  }

  const getMoodEmoji = () => {
    switch (mood) {
      case "calm":
        return "😌"
      case "anxious":
        return "😰"
      case "pain":
        return "😣"
      default:
        return "😐"
    }
  }

  const getTimeUntilNext = (nextTime?: string) => {
    if (!nextTime) return null
    const now = new Date()
    const next = new Date(nextTime)
    const diffMinutes = Math.floor((next.getTime() - now.getTime()) / (1000 * 60))

    if (diffMinutes < 0) return "Overdue"
    if (diffMinutes < 60) return `${diffMinutes}m`
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffHours > 0) return `${diffHours}h ago`
    return `${diffMinutes}m ago`
  }

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300 ease-out
        hover:shadow-lg hover:scale-[1.02] group h-full flex flex-col
        ${isSelected ? "ring-2 ring-blue-500 shadow-lg scale-[1.02]" : "shadow-md"}
        bg-gradient-to-br from-white to-blue-50/30
        border-0 rounded-3xl
      `}
      onClick={onSelect}
    >
      {/* Priority Ribbon */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${getPriorityRibbon()}`} />

      <CardContent className="p-6 flex flex-col h-full">
        {/* Header with Patient Name and Acuity */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-800 truncate">{patient.name}</h3>

              {/* Mood Indicator */}
              <div className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full ${getMoodColor()} flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-110`}
                  onClick={(e) => {
                    e.stopPropagation()
                    const moods: ("calm" | "anxious" | "pain")[] = ["calm", "anxious", "pain"]
                    const currentIndex = mood ? moods.indexOf(mood) : -1
                    const nextMood = moods[(currentIndex + 1) % moods.length]
                    setMood(nextMood)
                  }}
                  title="Click to set patient mood"
                >
                  {getMoodEmoji()}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-600 truncate mb-3">{patient.primaryDiagnosis}</div>
          </div>

          <div className="flex flex-col items-center flex-shrink-0 ml-2">
            <div
              className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white
                ${
                  patient.acuityLevel >= 4
                    ? "bg-gradient-to-br from-red-500 to-red-400"
                    : patient.acuityLevel === 3
                      ? "bg-gradient-to-br from-orange-500 to-orange-400"
                      : "bg-gradient-to-br from-green-500 to-green-400"
                }
              `}
            >
              {patient.acuityLevel}
            </div>
            <span className="text-xs text-gray-500 text-center">Acuity</span>
          </div>
        </div>

        {/* Room and Admission Date */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Badge variant="outline" className="bg-white/80 border-blue-200 text-blue-700 rounded-xl px-3 flex-shrink-0">
            Room {patient.room}
          </Badge>
          <span className="text-xs text-gray-500 flex-shrink-0">•</span>
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <Calendar className="h-3 w-3" />
            <span>Admitted {new Date(patient.admissionDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
          {patient.hasAlerts && (
            <Badge className="bg-red-100 text-red-800 border-red-300 rounded-xl animate-pulse">🚨 Alert</Badge>
          )}

          {status.hasCriticalLabs && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 rounded-xl">🧪 Critical Labs</Badge>
          )}

          {status.hasNewOrders && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 rounded-xl">📋 New Orders</Badge>
          )}

          {patient.requiresFollowUp && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 rounded-xl">📅 Follow-up</Badge>
          )}

          {patient.isPendingDischarge && (
            <Badge className="bg-green-100 text-green-800 border-green-300 rounded-xl">🏠 Discharge Pending</Badge>
          )}

          {patient.isolationStatus && (
            <Badge className="bg-red-100 text-red-800 border-red-300 rounded-xl">
              <Shield className="h-3 w-3 mr-1" />
              {patient.isolationStatus}
            </Badge>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 flex-grow">
          {patient.nextMedTime && (
            <div className="bg-white/60 rounded-2xl p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Pill className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Next Medication</span>
              </div>
              <div className="text-sm font-semibold text-gray-800">{getTimeUntilNext(patient.nextMedTime)}</div>
            </div>
          )}

          {status.painLevel > 0 && (
            <div className="bg-white/60 rounded-2xl p-3 border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-gray-600">Pain Level</span>
              </div>
              <div
                className={`text-sm font-semibold ${
                  status.painLevel >= 7 ? "text-red-600" : status.painLevel >= 4 ? "text-yellow-600" : "text-green-600"
                }`}
              >
                {status.painLevel}/10
              </div>
            </div>
          )}

          <div className="bg-white/60 rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Bed className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Mobility</span>
            </div>
            <div className="text-sm font-semibold text-gray-800 capitalize">{status.mobilityStatus}</div>
          </div>

          <div className="bg-white/60 rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Last Vitals</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">{getTimeAgo(patient.lastVitalsTime)}</div>
          </div>
        </div>

        {/* Allergies */}
        {patient.allergies.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-3 border border-red-200 mb-4 min-h-[60px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-600">⚠️ Allergies</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {patient.allergies.slice(0, 3).map((allergy, index) => (
                <Badge key={index} variant="destructive" className="text-xs rounded-lg">
                  {allergy}
                </Badge>
              ))}
              {patient.allergies.length > 3 && (
                <Badge variant="destructive" className="text-xs rounded-lg">
                  +{patient.allergies.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onStartHandoff()
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl h-12 font-medium transition-all duration-200 hover:shadow-lg"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Handoff
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl h-12 w-12 border-blue-200 hover:bg-blue-50 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation()
              // Voice input functionality
            }}
          >
            <Mic className="h-4 w-4 text-blue-600" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl h-12 w-12 border-purple-200 hover:bg-purple-50 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation()
              // Text-to-speech functionality
            }}
          >
            <Volume2 className="h-4 w-4 text-purple-600" />
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center pt-3 mt-2 border-t border-gray-100">
          <Clock className="h-3 w-3 inline mr-1" />
          Last updated by day shift at 6:00 AM
        </div>
      </CardContent>

      {/* Gentle glow effect when selected */}
      {isSelected && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
      )}
    </Card>
  )
}
