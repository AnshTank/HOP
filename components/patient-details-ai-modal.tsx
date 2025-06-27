"use client";

import type React from "react";

// Extend the Window interface to include SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Activity,
  Pill,
  Heart,
  AlertTriangle,
} from "lucide-react";
import type { PatientDetails } from "@/types/patient";

// Define ChatMessage type locally if not exported from "@/types/patient"
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};
// SpeechRecognition is available globally in browsers
type SpeechRecognition = typeof window extends { SpeechRecognition: infer T }
  ? T
  : typeof window extends { webkitSpeechRecognition: infer W }
  ? W
  : any;

interface PatientDetailsAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDetails;
}

export default function PatientDetailsAIModal({
  isOpen,
  onClose,
  patient,
}: PatientDetailsAIModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: generateWelcomeMessage(patient),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for speech recognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Check for speech synthesis support
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update welcome message when patient data changes
    if (isOpen) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: generateWelcomeMessage(patient),
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [patient, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Simulate AI response (in real app, call your AI API)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const aiResponse = generateDetailedAIResponse(inputMessage, patient);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text: string) => {
    if (synthRef.current) {
      // Stop any current speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-600">
                AI Clinical Assistant
              </h2>
              <p className="text-sm text-gray-600">
                Comprehensive care guidance for {patient.name} - Room{" "}
                {patient.room}
              </p>
            </div>
          </div>

          {/* Patient Status Indicators */}
          <div className="flex items-center gap-2">
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
            <Badge className="bg-teal-100 text-teal-800 rounded-xl">
              Acuity {patient.acuityLevel}
            </Badge>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleQuickAction("What are the current vital signs concerns?")
              }
              className="rounded-xl text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              Vitals Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleQuickAction("Review medication schedule and interactions")
              }
              className="rounded-xl text-xs"
            >
              <Pill className="h-3 w-3 mr-1" />
              Medication Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleQuickAction(
                  "What are the priority nursing interventions?"
                )
              }
              className="rounded-xl text-xs"
            >
              <Heart className="h-3 w-3 mr-1" />
              Care Priorities
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleQuickAction("Assess discharge readiness and planning")
              }
              className="rounded-xl text-xs"
            >
              <User className="h-3 w-3 mr-1" />
              Discharge Planning
            </Button>
            {patient.allergies.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleQuickAction(
                    "Review allergy precautions and safety measures"
                  )
                }
                className="rounded-xl text-xs border-red-200 text-red-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Allergy Safety
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          isSpeaking
                            ? stopSpeaking()
                            : speakMessage(message.content)
                        }
                        className="h-6 w-6 p-0 hover:bg-white/20"
                      >
                        {isSpeaking ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
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
                placeholder="Ask about patient care, medications, assessments, discharge planning..."
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
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {isListening && (
            <div className="mt-2 text-center">
              <span className="text-sm text-purple-600 animate-pulse">
                🎤 Listening...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateWelcomeMessage(patient: PatientDetails): string {
  const criticalAlerts = [];

  if (patient.riskLevel === "critical") {
    criticalAlerts.push(
      "🚨 CRITICAL risk level - requires continuous monitoring"
    );
  }

  if (patient.acuityLevel >= 4) {
    criticalAlerts.push(
      `⚠️ High acuity level ${patient.acuityLevel} - frequent assessments needed`
    );
  }

  if (patient.allergies.length > 0) {
    criticalAlerts.push(
      `🔴 ALLERGIES: ${patient.allergies.join(
        ", "
      )} - verify before any interventions`
    );
  }

  const vitalsConcerns = [];
  if (patient.vitals.painLevel && patient.vitals.painLevel > 5) {
    vitalsConcerns.push(
      `Pain level ${patient.vitals.painLevel}/10 - requires intervention`
    );
  }

  if (
    patient.vitals.temperature &&
    (patient.vitals.temperature > 101 || patient.vitals.temperature < 96)
  ) {
    vitalsConcerns.push(
      `Temperature ${patient.vitals.temperature}°F - monitor closely`
    );
  }

  const medicationAlerts = [];
  const activeMeds = patient.medications.filter(
    (med) => med.status === "active"
  );
  if (activeMeds.length > 0) {
    medicationAlerts.push(
      `${activeMeds.length} active medications - check for interactions`
    );
  }

  return `Hello! I'm your AI Clinical Assistant for ${patient.name}.

**PATIENT OVERVIEW:**
📋 Diagnosis: ${patient.primaryDiagnosis}
🏥 Room: ${patient.room} | Age: ${patient.demographics.age} | ${
    patient.demographics.gender
  }
⚡ Risk: ${patient.riskLevel.toUpperCase()} | Acuity: ${patient.acuityLevel}

${
  criticalAlerts.length > 0
    ? `**CRITICAL ALERTS:**\n${criticalAlerts
        .map((alert) => `• ${alert}`)
        .join("\n")}\n\n`
    : ""
}

${
  vitalsConcerns.length > 0
    ? `**VITAL SIGNS CONCERNS:**\n${vitalsConcerns
        .map((concern) => `• ${concern}`)
        .join("\n")}\n\n`
    : ""
}

${
  medicationAlerts.length > 0
    ? `**MEDICATION STATUS:**\n${medicationAlerts
        .map((alert) => `• ${alert}`)
        .join("\n")}\n\n`
    : ""
}

**I CAN HELP WITH:**
🔹 Clinical assessments and monitoring priorities
🔹 Medication management and safety checks
🔹 Pain management strategies
🔹 Discharge planning and readiness
🔹 Evidence-based nursing interventions
🔹 Documentation guidance

Use the quick action buttons above or ask me anything about ${
    patient.name
  }'s care!`;
}

function generateDetailedAIResponse(
  message: string,
  patient: PatientDetails
): string {
  const lowerMessage = message.toLowerCase();

  // Vital signs analysis
  if (
    lowerMessage.includes("vital") ||
    lowerMessage.includes("assessment") ||
    lowerMessage.includes("monitor")
  ) {
    const vitalsAnalysis = analyzeVitals(patient);
    return `**VITAL SIGNS ANALYSIS FOR ${patient.name.toUpperCase()}:**

${vitalsAnalysis}

**MONITORING RECOMMENDATIONS:**
🔹 **Frequency**: Acuity ${patient.acuityLevel} requires vitals every ${
      patient.acuityLevel >= 4
        ? "1-2 hours"
        : patient.acuityLevel === 3
        ? "4 hours"
        : "6-8 hours"
    }
🔹 **Priority Parameters**: Focus on trends, not just individual readings
🔹 **Alert Thresholds**: Given ${
      patient.primaryDiagnosis
    }, watch for specific warning signs
🔹 **Documentation**: Record all abnormal findings and interventions

**NEXT STEPS:**
• Reassess vitals in ${patient.acuityLevel >= 4 ? "1 hour" : "2-4 hours"}
• Notify physician if any parameters exceed normal ranges
• Consider pain management if pain score >5`;
  }

  // Medication review
  if (
    lowerMessage.includes("medication") ||
    lowerMessage.includes("med") ||
    lowerMessage.includes("drug")
  ) {
    return generateMedicationGuidance(patient);
  }

  // Pain management
  if (lowerMessage.includes("pain")) {
    return generatePainManagementGuidance(patient);
  }

  // Care priorities
  if (
    lowerMessage.includes("priority") ||
    lowerMessage.includes("intervention") ||
    lowerMessage.includes("care plan")
  ) {
    return generateCarePriorities(patient);
  }

  // Discharge planning
  if (
    lowerMessage.includes("discharge") ||
    lowerMessage.includes("home") ||
    lowerMessage.includes("ready")
  ) {
    return generateDischargeGuidance(patient);
  }

  // Allergy safety
  if (
    lowerMessage.includes("allerg") ||
    lowerMessage.includes("safety") ||
    lowerMessage.includes("precaution")
  ) {
    return generateAllergyGuidance(patient);
  }

  // Assessment guidance
  if (
    lowerMessage.includes("assess") ||
    lowerMessage.includes("exam") ||
    lowerMessage.includes("check")
  ) {
    return generateAssessmentGuidance(patient);
  }

  // General response
  return `**CLINICAL GUIDANCE FOR ${patient.name.toUpperCase()}:**

Based on your question about "${message}", here's my analysis:

**CURRENT STATUS:**
🏥 **Condition**: ${patient.primaryDiagnosis}
⚡ **Risk Level**: ${patient.riskLevel.toUpperCase()} (requires ${
    patient.riskLevel === "critical"
      ? "continuous monitoring"
      : "regular assessment"
  })
📊 **Acuity**: Level ${patient.acuityLevel} (${
    patient.acuityLevel >= 4 ? "high priority" : "standard monitoring"
  })

**IMMEDIATE CONSIDERATIONS:**
• Monitor for complications related to ${patient.primaryDiagnosis}
• Maintain safety precautions for ${patient.riskLevel} risk patients
• Follow protocols for acuity level ${patient.acuityLevel}
${
  patient.allergies.length > 0
    ? `• ALLERGY ALERT: ${patient.allergies.join(", ")}`
    : ""
}

**RECOMMENDATIONS:**
🔹 Perform systematic head-to-toe assessment
🔹 Review medication administration record
🔹 Assess pain and comfort level
🔹 Monitor for signs of deterioration
🔹 Document all findings and interventions

Would you like specific guidance on any particular aspect of ${
    patient.name
  }'s care?`;
}

function analyzeVitals(patient: PatientDetails): string {
  const vitals = patient.vitals;
  const concerns = [];
  const normal = [];

  if (vitals.temperature) {
    if (vitals.temperature > 101) {
      concerns.push(
        `🌡️ **FEVER**: ${vitals.temperature}°F - Consider antipyretics, cooling measures, infection workup`
      );
    } else if (vitals.temperature < 96) {
      concerns.push(
        `🧊 **HYPOTHERMIA**: ${vitals.temperature}°F - Warming measures needed, assess circulation`
      );
    } else {
      normal.push(`🌡️ Temperature: ${vitals.temperature}°F (Normal)`);
    }
  }

  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;
    if (systolic > 140 || diastolic > 90) {
      concerns.push(
        `📈 **HYPERTENSION**: ${systolic}/${diastolic} mmHg - Monitor closely, consider antihypertensives`
      );
    } else if (systolic < 90 || diastolic < 60) {
      concerns.push(
        `📉 **HYPOTENSION**: ${systolic}/${diastolic} mmHg - Assess fluid status, consider IV fluids`
      );
    } else {
      normal.push(`💓 Blood Pressure: ${systolic}/${diastolic} mmHg (Normal)`);
    }
  }

  if (vitals.heartRate) {
    if (vitals.heartRate > 100) {
      concerns.push(
        `💓 **TACHYCARDIA**: ${vitals.heartRate} bpm - Assess for causes (pain, fever, anxiety, dehydration)`
      );
    } else if (vitals.heartRate < 60) {
      concerns.push(
        `💓 **BRADYCARDIA**: ${vitals.heartRate} bpm - Monitor for symptoms, assess medications`
      );
    } else {
      normal.push(`💓 Heart Rate: ${vitals.heartRate} bpm (Normal)`);
    }
  }

  if (vitals.oxygenSaturation) {
    if (vitals.oxygenSaturation < 95) {
      concerns.push(
        `🫁 **LOW O2 SAT**: ${vitals.oxygenSaturation}% - Consider oxygen therapy, assess respiratory status`
      );
    } else {
      normal.push(`🫁 Oxygen Saturation: ${vitals.oxygenSaturation}% (Normal)`);
    }
  }

  if (vitals.painLevel && vitals.painLevel > 0) {
    if (vitals.painLevel >= 7) {
      concerns.push(
        `😣 **SEVERE PAIN**: ${vitals.painLevel}/10 - Immediate intervention needed`
      );
    } else if (vitals.painLevel >= 4) {
      concerns.push(
        `😐 **MODERATE PAIN**: ${vitals.painLevel}/10 - Pain management indicated`
      );
    } else {
      normal.push(`😌 Pain Level: ${vitals.painLevel}/10 (Mild)`);
    }
  }

  let analysis = "";

  if (concerns.length > 0) {
    analysis += "**⚠️ ABNORMAL FINDINGS:**\n" + concerns.join("\n") + "\n\n";
  }

  if (normal.length > 0) {
    analysis += "**✅ NORMAL FINDINGS:**\n" + normal.join("\n") + "\n\n";
  }

  if (concerns.length === 0 && normal.length === 0) {
    analysis =
      "**📊 VITAL SIGNS STATUS:**\nNo recent vital signs recorded. Please obtain baseline measurements.\n\n";
  }

  return analysis;
}

function generateMedicationGuidance(patient: PatientDetails): string {
  const activeMeds = patient.medications.filter(
    (med) => med.status === "active"
  );
  const heldMeds = patient.medications.filter((med) => med.status === "held");

  let guidance = `**MEDICATION MANAGEMENT FOR ${patient.name.toUpperCase()}:**\n\n`;

  if (activeMeds.length > 0) {
    guidance += `**ACTIVE MEDICATIONS (${activeMeds.length}):**\n`;
    activeMeds.forEach((med) => {
      guidance += `🔹 **${med.name}** ${med.dosage} ${med.route} ${med.frequency}\n`;
      guidance += `   • Indication: ${med.indication}\n`;
      guidance += `   • Next due: ${med.nextDue || "Not scheduled"}\n`;
      guidance += `   • Last given: ${
        med.lastGiven ? new Date(med.lastGiven).toLocaleString() : "Never"
      }\n\n`;
    });
  }

  if (heldMeds.length > 0) {
    guidance += `**⚠️ HELD MEDICATIONS (${heldMeds.length}):**\n`;
    heldMeds.forEach((med) => {
      guidance += `🔸 **${med.name}** ${med.dosage} - HELD\n`;
    });
    guidance += "\n";
  }

  guidance += `**SAFETY CONSIDERATIONS:**\n`;
  if (patient.allergies.length > 0) {
    guidance += `🚨 **ALLERGIES**: ${patient.allergies.join(
      ", "
    )} - Verify before any new medications\n`;
  }

  guidance += `🔹 **Risk Level**: ${patient.riskLevel.toUpperCase()} - Enhanced monitoring required\n`;
  guidance += `🔹 **Age Considerations**: ${patient.demographics.age} years - Adjust dosing as needed\n`;
  guidance += `🔹 **Diagnosis**: Monitor for drug-disease interactions with ${patient.primaryDiagnosis}\n\n`;

  guidance += `**ADMINISTRATION GUIDELINES:**\n`;
  guidance += `• Always verify 5 rights before administration\n`;
  guidance += `• Monitor for therapeutic effects and adverse reactions\n`;
  guidance += `• Document administration time and patient response\n`;
  guidance += `• Report any concerns to prescriber immediately\n`;

  return guidance;
}

function generatePainManagementGuidance(patient: PatientDetails): string {
  const currentPain = patient.vitals.painLevel || 0;

  return `**PAIN MANAGEMENT FOR ${patient.name.toUpperCase()}:**

**CURRENT PAIN STATUS:**
😣 **Pain Level**: ${currentPain}/10 ${
    currentPain >= 7
      ? "(SEVERE - Immediate intervention needed)"
      : currentPain >= 4
      ? "(MODERATE - Management indicated)"
      : currentPain > 0
      ? "(MILD - Monitor closely)"
      : "(No pain reported)"
  }

**ASSESSMENT PRIORITIES:**
🎯 **Location**: Document specific pain location(s)
🎯 **Quality**: Sharp, dull, burning, cramping, etc.
🎯 **Duration**: Constant vs. intermittent
🎯 **Aggravating/Relieving Factors**: Movement, position, medications
🎯 **Impact**: Effect on sleep, mobility, daily activities

**INTERVENTION STRATEGIES:**
💊 **Pharmacological**:
• Review current pain medications and effectiveness
• Consider multimodal approach (different drug classes)
• Monitor for side effects (sedation, respiratory depression)
• Assess need for breakthrough pain medication

🌿 **Non-Pharmacological**:
• Positioning and comfort measures
• Heat/cold therapy as appropriate
• Relaxation techniques and distraction
• Environmental modifications (lighting, noise)

**MONITORING REQUIREMENTS:**
⏰ **Reassessment**: Every 30-60 minutes after intervention
📊 **Documentation**: Pain scores, interventions, effectiveness
🚨 **Alert Criteria**: Pain >7/10 or sudden increase in pain level

**SPECIAL CONSIDERATIONS:**
• Diagnosis: ${patient.primaryDiagnosis} may cause specific pain patterns
• Age: ${patient.demographics.age} years - consider age-related factors
• Risk Level: ${patient.riskLevel.toUpperCase()} - may affect medication choices`;
}

function generateCarePriorities(patient: PatientDetails): string {
  const priorities = [];

  // Risk-based priorities
  if (patient.riskLevel === "critical") {
    priorities.push(
      "🚨 **CRITICAL MONITORING**: Continuous assessment required"
    );
  }

  if (patient.acuityLevel >= 4) {
    priorities.push("⚡ **HIGH ACUITY**: Frequent vital signs and assessments");
  }

  // Allergy priorities
  if (patient.allergies.length > 0) {
    priorities.push(
      "🔴 **ALLERGY SAFETY**: Verify all medications and treatments"
    );
  }

  // Pain priorities
  if (patient.vitals.painLevel && patient.vitals.painLevel > 5) {
    priorities.push("😣 **PAIN MANAGEMENT**: Address elevated pain level");
  }

  // Medication priorities
  const activeMeds = patient.medications.filter(
    (med) => med.status === "active"
  );
  if (activeMeds.length > 0) {
    priorities.push(
      "💊 **MEDICATION SAFETY**: Monitor for interactions and effects"
    );
  }

  return `**NURSING CARE PRIORITIES FOR ${patient.name.toUpperCase()}:**

**IMMEDIATE PRIORITIES:**
${priorities.map((priority) => `${priority}`).join("\n")}

**SYSTEMATIC CARE PLAN:**

**1. SAFETY & MONITORING**
• Continuous monitoring per acuity level ${patient.acuityLevel}
• Fall risk assessment and precautions
• Infection control measures
${
  patient.allergies.length > 0
    ? `• Allergy precautions: ${patient.allergies.join(", ")}`
    : ""
}

**2. PHYSIOLOGICAL NEEDS**
• Vital signs monitoring and trending
• Pain assessment and management
• Medication administration and monitoring
• Nutrition and hydration status

**3. PSYCHOSOCIAL SUPPORT**
• Patient and family education
• Emotional support and coping strategies
• Communication with healthcare team
• Discharge planning preparation

**4. DOCUMENTATION**
• Accurate and timely charting
• Incident reporting as needed
• Care plan updates
• Handoff communication

**CONDITION-SPECIFIC INTERVENTIONS:**
Based on ${patient.primaryDiagnosis}:
• Monitor for specific complications
• Implement evidence-based protocols
• Coordinate with interdisciplinary team
• Patient education on condition management`;
}

function generateDischargeGuidance(patient: PatientDetails): string {
  return `**DISCHARGE PLANNING FOR ${patient.name.toUpperCase()}:**

**READINESS ASSESSMENT:**
✅ **Medical Stability**: 
• Vital signs stable for 24+ hours
• Pain controlled with oral medications
• No acute complications from ${patient.primaryDiagnosis}

✅ **Functional Status**:
• Able to perform activities of daily living
• Mobility appropriate for home environment
• Cognitive function adequate for self-care

✅ **Medication Management**:
• Medication reconciliation completed
• Patient/family understands medication regimen
• Pharmacy arrangements made

**DISCHARGE CHECKLIST:**

**📋 MEDICAL CLEARANCE:**
• Physician discharge order obtained
• All treatments completed
• Follow-up appointments scheduled
• Diagnostic results reviewed

**💊 MEDICATIONS:**
• Reconcile home vs. hospital medications
• Provide written medication list
• Ensure patient has adequate supply
• Review administration instructions

**📚 PATIENT EDUCATION:**
• Diagnosis and treatment explanation
• Activity restrictions and guidelines
• When to seek medical attention
• Emergency contact information

**🏠 HOME PREPARATION:**
• Home safety assessment completed
• Medical equipment arranged if needed
• Home health services coordinated
• Transportation arranged

**📞 FOLLOW-UP CARE:**
• Primary care physician appointment
• Specialist referrals as needed
• Home health nursing if indicated
• Physical therapy if required

**⚠️ WARNING SIGNS TO REPORT:**
Specific to ${patient.primaryDiagnosis}:
• Worsening symptoms
• New or increased pain
• Signs of infection
• Medication side effects

**SPECIAL CONSIDERATIONS:**
• Age: ${patient.demographics.age} years - may need additional support
• Risk Level: ${patient.riskLevel.toUpperCase()} - enhanced monitoring needed
${
  patient.allergies.length > 0
    ? `• Allergies: ${patient.allergies.join(", ")} - ensure awareness`
    : ""
}`;
}

function generateAllergyGuidance(patient: PatientDetails): string {
  if (patient.allergies.length === 0) {
    return `**ALLERGY STATUS FOR ${patient.name.toUpperCase()}:**

✅ **NO KNOWN ALLERGIES DOCUMENTED**

**SAFETY PROTOCOLS:**
• Always ask about allergies before any intervention
• Monitor for new allergic reactions
• Document any new allergies immediately
• Educate patient about reporting reactions

**VIGILANCE REQUIRED:**
Even with no known allergies, remain alert for:
• First-time medication reactions
• Food allergies during meal service
• Environmental allergens (latex, cleaning products)
• Cross-reactions with new substances`;
  }

  return `**ALLERGY MANAGEMENT FOR ${patient.name.toUpperCase()}:**

🚨 **CRITICAL ALLERGIES:**
${patient.allergies
  .map(
    (allergy) =>
      `• **${allergy.toUpperCase()}** - Verify before ANY intervention`
  )
  .join("\n")}

**SAFETY PROTOCOLS:**
🔴 **Before ANY medication/treatment:**
• Verify allergy band is present and accurate
• Check electronic medical record
• Ask patient to confirm allergies
• Cross-reference with medication orders

🔴 **Emergency Preparedness:**
• Know location of emergency medications (epinephrine, Benadryl)
• Have crash cart readily available
• Know rapid response activation process
• Ensure allergy information is visible on chart

**CROSS-REACTION AWARENESS:**
${patient.allergies
  .map((allergy) => {
    if (allergy.toLowerCase().includes("penicillin")) {
      return `• **Penicillin allergy**: Avoid all beta-lactam antibiotics, use alternative antibiotics`;
    }
    if (allergy.toLowerCase().includes("latex")) {
      return `• **Latex allergy**: Use latex-free gloves and equipment, avoid latex-containing products`;
    }
    if (allergy.toLowerCase().includes("sulfa")) {
      return `• **Sulfa allergy**: Avoid sulfonamide antibiotics and some diuretics`;
    }
    return `• **${allergy}**: Research potential cross-reactions before new medications`;
  })
  .join("\n")}

**DOCUMENTATION REQUIREMENTS:**
• All allergies clearly documented in chart
• Allergy band present and legible
• Reaction type and severity noted
• Date of last reaction if known

**PATIENT EDUCATION:**
• Ensure patient knows their allergies
• Provide written allergy list for discharge
• Teach importance of informing all healthcare providers
• Discuss medical alert jewelry/cards`;
}

function generateAssessmentGuidance(patient: PatientDetails): string {
  return `**COMPREHENSIVE ASSESSMENT FOR ${patient.name.toUpperCase()}:**

**SYSTEMATIC APPROACH:**

**🔍 PRIMARY SURVEY (IMMEDIATE):**
• **Airway**: Patent, clear
• **Breathing**: Rate, depth, effort, oxygen saturation
• **Circulation**: Pulse, blood pressure, perfusion
• **Disability**: Neurological status, pain level
• **Exposure**: Skin condition, temperature

**📊 FOCUSED ASSESSMENT:**
Based on ${patient.primaryDiagnosis}:

**CARDIOVASCULAR:**
• Heart rate and rhythm
• Blood pressure trends
• Peripheral pulses and circulation
• Signs of fluid overload or dehydration

**RESPIRATORY:**
• Respiratory rate and pattern
• Oxygen saturation
• Breath sounds
• Use of accessory muscles

**NEUROLOGICAL:**
• Level of consciousness
• Orientation (person, place, time)
• Motor and sensory function
• Pain assessment

**GASTROINTESTINAL:**
• Bowel sounds
• Abdominal distension or tenderness
• Nausea/vomiting
• Last bowel movement

**GENITOURINARY:**
• Urine output and characteristics
• Bladder distension
• Signs of infection

**INTEGUMENTARY:**
• Skin color, temperature, moisture
• Pressure ulcer risk areas
• Surgical sites or wounds
• IV site assessment

**PSYCHOSOCIAL:**
• Anxiety or depression screening
• Coping mechanisms
• Family support system
• Cultural considerations

**ASSESSMENT FREQUENCY:**
• **Acuity ${patient.acuityLevel}**: Every ${
    patient.acuityLevel >= 4
      ? "1-2 hours"
      : patient.acuityLevel === 3
      ? "4 hours"
      : "6-8 hours"
  }
• **Risk Level ${patient.riskLevel.toUpperCase()}**: ${
    patient.riskLevel === "critical"
      ? "Continuous monitoring"
      : "Regular scheduled assessments"
  }

**RED FLAGS TO REPORT:**
• Sudden change in mental status
• Significant vital sign changes
• New or worsening pain
• Signs of infection or complications
• Patient or family concerns`;
}
