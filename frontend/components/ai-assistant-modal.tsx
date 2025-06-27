"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  ArrowRight,
  FileText,
  Activity,
  Pill,
  Heart,
  AlertTriangle,
} from "lucide-react"
import type { ChatMessage, PatientBasic, PatientDetails } from "@/frontend/types/patient"
import type { SpeechRecognition } from "web-speech-api"

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  patient: PatientBasic | PatientDetails
  isHandoffMode?: boolean
  onNavigateToDetails?: () => void
}

export function AIAssistantModal({
  isOpen,
  onClose,
  patient,
  isHandoffMode = false,
  onNavigateToDetails,
}: AIAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Initialize messages based on mode
    if (isOpen) {
      const welcomeMessage = isHandoffMode
        ? generateHandoffWelcomeMessage(patient)
        : `Hello! I'm your AI nursing assistant for ${patient.name} in Room ${patient.room}. I can help you with patient care questions, medication information, care planning, and documentation. How can I assist you today?`

      setMessages([
        {
          id: "1",
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }, [isOpen, patient, isHandoffMode])

  useEffect(() => {
    // Check for speech recognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInputMessage(transcript)
          setIsListening(false)
        }

        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }

      // Check for speech synthesis support
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Simulate AI response (in real app, call your AI API)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const aiResponse = isHandoffMode
        ? generateHandoffAIResponse(inputMessage, patient as PatientBasic)
        : generateAIResponse(inputMessage, patient as PatientBasic)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateHandoffWelcomeMessage = (patient: PatientBasic): string => {
    const criticalAlerts = []

    if (patient.riskLevel === "critical") {
      criticalAlerts.push("🚨 CRITICAL RISK - Requires immediate attention")
    }

    if (patient.acuityLevel >= 4) {
      criticalAlerts.push(`⚡ HIGH ACUITY (Level ${patient.acuityLevel}) - Frequent monitoring needed`)
    }

    if (patient.allergies.length > 0) {
      criticalAlerts.push(`🔴 ALLERGIES: ${patient.allergies.join(", ")} - Verify before any interventions`)
    }

    return `🏥 **HANDOFF PREPARATION FOR ${patient.name.toUpperCase()}**

**PATIENT OVERVIEW:**
📋 **Room**: ${patient.room} | **Diagnosis**: ${patient.primaryDiagnosis}
👤 **Age**: ${patient.age || "Unknown"} | **Gender**: ${patient.gender || "Unknown"}
⚡ **Risk Level**: ${patient.riskLevel.toUpperCase()} | **Acuity**: ${patient.acuityLevel}

${criticalAlerts.length > 0 ? `**🚨 CRITICAL ALERTS:**\n${criticalAlerts.map((alert) => `• ${alert}`).join("\n")}\n\n` : ""}

**HANDOFF CHECKLIST:**
✅ **Safety Review**: Verify allergies, fall risk, isolation precautions
✅ **Current Status**: Pain level, mobility, mental status
✅ **Medications**: Due times, recent changes, PRN usage
✅ **Procedures**: Scheduled tests, treatments, appointments
✅ **Family**: Communication needs, concerns, updates

**QUICK HANDOFF QUESTIONS:**
• "What are the priority concerns for this patient?"
• "Review medication schedule and interactions"
• "What safety precautions are needed?"
• "Any pending procedures or tests?"
• "Family communication updates needed?"

Ready to help you prepare a comprehensive handoff! What would you like to review first?`
  }

  const generateHandoffAIResponse = (message: string, patient: PatientBasic): string => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("priority") || lowerMessage.includes("concern") || lowerMessage.includes("important")) {
      return `**PRIORITY CONCERNS FOR ${patient.name.toUpperCase()}:**

🔴 **IMMEDIATE PRIORITIES:**
• **Risk Level**: ${patient.riskLevel.toUpperCase()} - ${patient.riskLevel === "critical" ? "Continuous monitoring required" : "Regular assessment needed"}
• **Acuity**: Level ${patient.acuityLevel} - ${patient.acuityLevel >= 4 ? "Q1-2H vitals" : "Q4H vitals"}
${patient.allergies.length > 0 ? `• **ALLERGIES**: ${patient.allergies.join(", ")} - Critical safety concern` : ""}

🟡 **ONGOING MONITORING:**
• **Diagnosis**: ${patient.primaryDiagnosis} - Watch for complications
• **Pain Management**: Assess and document pain levels
• **Mobility**: Current status - ${patient.hasAlerts ? "Has active alerts" : "No current alerts"}

📋 **HANDOFF ESSENTIALS:**
• Verify all safety measures are in place
• Review medication timing and effectiveness
• Check for any new orders or changes
• Assess family communication needs

Would you like me to elaborate on any specific priority area?`
    }

    if (lowerMessage.includes("medication") || lowerMessage.includes("med") || lowerMessage.includes("drug")) {
      return `**MEDICATION HANDOFF FOR ${patient.name.toUpperCase()}:**

💊 **MEDICATION SAFETY:**
• **Allergy Check**: ${patient.allergies.length > 0 ? `⚠️ ALLERGIC TO: ${patient.allergies.join(", ")}` : "✅ No known allergies"}
• **Risk Considerations**: ${patient.riskLevel.toUpperCase()} risk level - Enhanced monitoring needed
• **Age Factors**: ${patient.age || "Unknown"} years - Consider age-appropriate dosing

⏰ **TIMING CONSIDERATIONS:**
• **Next Med Time**: ${patient.nextMedTime ? new Date(patient.nextMedTime).toLocaleTimeString() : "Check MAR for schedule"}
• **PRN Medications**: Review recent usage and effectiveness
• **Scheduled Meds**: Verify timing with shift change

🔍 **HANDOFF QUESTIONS TO ASK:**
• "Any medications held or refused this shift?"
• "Pain medication effectiveness and timing?"
• "Any new medication orders or changes?"
• "Patient tolerance of current regimen?"

Ready to review specific medications or need help with administration timing?`
    }

    if (lowerMessage.includes("safety") || lowerMessage.includes("precaution") || lowerMessage.includes("risk")) {
      return `**SAFETY HANDOFF FOR ${patient.name.toUpperCase()}:**

🚨 **CRITICAL SAFETY ALERTS:**
${patient.riskLevel === "critical" ? "• **CRITICAL RISK** - Requires continuous monitoring" : ""}
${patient.acuityLevel >= 4 ? `• **HIGH ACUITY** - Level ${patient.acuityLevel} monitoring protocol` : ""}
${patient.allergies.length > 0 ? `• **ALLERGIES**: ${patient.allergies.join(", ")} - Verify before ALL interventions` : ""}
${patient.isolationStatus ? `• **ISOLATION**: ${patient.isolationStatus} - Follow precautions` : ""}

🛡️ **SAFETY PROTOCOLS:**
• **Fall Risk**: Assess and implement precautions
• **Skin Integrity**: Check pressure points and positioning
• **Mental Status**: Monitor for changes or confusion
• **Equipment Safety**: Verify all devices functioning properly

📋 **HANDOFF SAFETY CHECKLIST:**
✅ Bed in low position, call light within reach
✅ Side rails up per protocol
✅ Allergy bands visible and accurate
✅ Emergency equipment accessible
✅ Family aware of safety measures

Any specific safety concerns you'd like me to address?`
    }

    if (lowerMessage.includes("family") || lowerMessage.includes("communication") || lowerMessage.includes("update")) {
      return `**FAMILY COMMUNICATION HANDOFF FOR ${patient.name.toUpperCase()}:**

👨‍👩‍👧‍👦 **EMERGENCY CONTACT:**
• **Name**: ${patient.emergencyContact?.name || "Not documented"}
• **Relationship**: ${patient.emergencyContact?.relationship || "Unknown"}
• **Phone**: ${patient.emergencyContact?.phone || "Not available"}

📞 **COMMUNICATION STATUS:**
• **Recent Updates**: Check if family has been updated this shift
• **Concerns Expressed**: Any family questions or worries?
• **Visiting Restrictions**: Current policies and schedules
• **Decision Making**: Who is the primary contact for medical decisions?

📋 **HANDOFF COMMUNICATION POINTS:**
• "Has family been updated on patient status?"
• "Any family concerns or questions raised?"
• "Who should be contacted for updates?"
• "Any cultural or language considerations?"

🔄 **NEXT SHIFT ACTIONS:**
• Schedule family conference if needed
• Return any missed calls
• Provide status updates as appropriate
• Document all family communications

Need help with specific family communication strategies?`
    }

    // Default handoff response
    return generateAIResponse(message, patient)
  }

  const generateAIResponse = (message: string, patient: PatientBasic): string => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("medication") || lowerMessage.includes("med")) {
      return `For ${patient.name}, I recommend checking their current medication list and ensuring proper timing. Given their ${patient.riskLevel} risk level and acuity ${patient.acuityLevel}, please monitor for any adverse reactions. Would you like me to help you document medication administration?`
    }

    if (lowerMessage.includes("vital") || lowerMessage.includes("bp") || lowerMessage.includes("temperature")) {
      return `For vital signs monitoring of ${patient.name}, given their ${patient.primaryDiagnosis}, I suggest checking vitals every 4 hours or as ordered. Their acuity level ${patient.acuityLevel} indicates they need close monitoring. Would you like guidance on normal ranges for their condition?`
    }

    if (lowerMessage.includes("pain")) {
      return `Pain assessment is crucial for ${patient.name}. Please use the 0-10 pain scale and document location, quality, and duration. Consider non-pharmacological interventions alongside medications. Their current risk level is ${patient.riskLevel}. Would you like pain management suggestions?`
    }

    if (lowerMessage.includes("discharge") || lowerMessage.includes("planning")) {
      return `For discharge planning for ${patient.name}, consider their diagnosis of ${patient.primaryDiagnosis} and current acuity level ${patient.acuityLevel}. Ensure all medications are reconciled, follow-up appointments scheduled, and patient education completed. Need help with discharge checklist?`
    }

    if (lowerMessage.includes("allerg")) {
      return `${patient.name} has the following allergies: ${patient.allergies.length > 0 ? patient.allergies.join(", ") : "No known allergies"}. Always verify allergies before administering any medications or treatments. Would you like me to help you check for potential interactions?`
    }

    return `I understand you're asking about ${patient.name} in Room ${patient.room}. Based on their ${patient.primaryDiagnosis} and ${patient.riskLevel} risk level, I can help with care planning, medication questions, documentation, or clinical decision support. Could you be more specific about what you need assistance with?`
  }

  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const speakMessage = (text: string) => {
    if (synthRef.current) {
      // Stop any current speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickAction = (action: string) => {
    setInputMessage(action)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-600">
                {isHandoffMode ? "AI Handoff Assistant" : "AI Nursing Assistant"}
              </h2>
              <p className="text-sm text-gray-600">
                {isHandoffMode
                  ? `Preparing handoff for ${patient.name} - Room ${patient.room}`
                  : `Helping with ${patient.name} - Room ${patient.room}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient Status Indicators */}
            <Badge
              className={`rounded-xl ${
                patient.riskLevel === "critical"
                  ? "bg-red-100 text-red-800"
                  : patient.riskLevel === "high"
                    ? "bg-orange-100 text-orange-800"
                    : patient.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
              }`}
            >
              {patient.riskLevel.toUpperCase()} Risk
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 rounded-xl">Acuity {patient.acuityLevel}</Badge>

            {isHandoffMode && onNavigateToDetails && (
              <Button
                onClick={onNavigateToDetails}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 py-2 ml-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Go to Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 ml-4">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Actions for Handoff Mode */}
        {isHandoffMode && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("What are the priority concerns for this patient?")}
                className="rounded-xl text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Priority Concerns
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("Review medication schedule and safety considerations")}
                className="rounded-xl text-xs"
              >
                <Pill className="h-3 w-3 mr-1" />
                Medication Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("What safety precautions are needed for this patient?")}
                className="rounded-xl text-xs"
              >
                <Heart className="h-3 w-3 mr-1" />
                Safety Precautions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("Any family communication updates needed?")}
                className="rounded-xl text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                Family Updates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("Review current vital signs and assessment needs")}
                className="rounded-xl text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Vitals Review
              </Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-line">{message.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (isSpeaking ? stopSpeaking() : speakMessage(message.content))}
                        className="h-6 w-6 p-0 hover:bg-white/20"
                      >
                        {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isHandoffMode
                    ? "Ask about handoff priorities, safety concerns, medications..."
                    : "Ask about patient care, medications, documentation..."
                }
                className="pr-12 rounded-2xl"
                disabled={isLoading}
              />
              {speechSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
                    isListening ? "text-red-500" : "text-gray-400"
                  }`}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {isListening && (
            <div className="mt-2 text-center">
              <span className="text-sm text-purple-600 animate-pulse">🎤 Listening...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAssistantModal
