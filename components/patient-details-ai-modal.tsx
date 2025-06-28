"use client";

import type React from "react";

// Extend the Window interface to include SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

import nlp from "compromise";
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
  Thermometer,
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
  const [chatEnded, setChatEnded] = useState(false);

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
          // Auto-send after speech, using transcript directly
          setTimeout(() => handleSendMessage(transcript), 500);
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

  useEffect(() => {
    if (!isOpen) return;
    // Example: Proactive pain alert
    if (
      patient.vitals?.painLevel !== undefined &&
      patient.vitals.painLevel >= 7
    ) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Alert: Severe pain detected for ${patient.name} (${patient.vitals.painLevel}/10). Immediate intervention recommended.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    // Add more rules for other vitals, meds, etc.
  }, [patient.vitals, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (msg?: string) => {
    const messageToSend = String(msg ?? inputMessage).trim();
    if (!messageToSend) return;

    // Check for end/thanks before sending
    const lowerMessage = messageToSend.toLowerCase();
    if (/\b(thank you|thanks|end|bye|close)\b/i.test(lowerMessage)) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: messageToSend,
          timestamp: new Date().toISOString(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `You're welcome! If you need further assistance, just ask. Ending the AI assistant chat.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setChatEnded(true);
      setInputMessage("");
      setTimeout(onClose, 3000); // Close after 3 seconds
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const aiResponse = generateDetailedAIResponse(messageToSend, patient);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse, // <-- aiResponse must be a string!
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
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Add a delay before restarting recognition
        setTimeout(() => {
          if (
            recognitionRef.current &&
            speechSupported &&
            !isListening // Only start if not already listening
          ) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 800); // 800ms delay, adjust as needed
      };
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

  // New useEffect for proactive alerts based on vitals (moved inside component)
  useEffect(() => {
    if (!isOpen) return;
    const vitals = patient.vitals;
    if (!vitals) return;

    const alerts: string[] = [];

    // Pain
    if (vitals.painLevel !== undefined && vitals.painLevel >= 7) {
      alerts.push(
        `Severe pain detected for ${patient.name} (${vitals.painLevel}/10). Immediate intervention recommended.`
      );
    }
    // Fever
    if (vitals.temperature && vitals.temperature > 101) {
      alerts.push(
        `Fever detected for ${patient.name} (${vitals.temperature}°F). Consider antipyretics and infection workup.`
      );
    }
    // Hypothermia
    if (vitals.temperature && vitals.temperature < 96) {
      alerts.push(
        `Hypothermia detected for ${patient.name} (${vitals.temperature}°F). Warming measures needed, assess circulation.`
      );
    }
    // High BP
    if (
      vitals.bloodPressure &&
      (vitals.bloodPressure.systolic > 140 ||
        vitals.bloodPressure.diastolic > 90)
    ) {
      alerts.push(
        `High blood pressure detected for ${patient.name} (${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg). Monitor closely, consider antihypertensives.`
      );
    }
    // Low BP
    if (
      vitals.bloodPressure &&
      (vitals.bloodPressure.systolic < 90 ||
        vitals.bloodPressure.diastolic < 60)
    ) {
      alerts.push(
        `Low blood pressure detected for ${patient.name} (${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg). Assess fluid status, consider IV fluids.`
      );
    }
    // Tachycardia
    if (vitals.heartRate && vitals.heartRate > 100) {
      alerts.push(
        `Tachycardia detected for ${patient.name} (${vitals.heartRate} bpm). Assess for causes (pain, fever, anxiety, dehydration).`
      );
    }
    // Bradycardia
    if (vitals.heartRate && vitals.heartRate < 60) {
      alerts.push(
        `Bradycardia detected for ${patient.name} (${vitals.heartRate} bpm). Monitor for symptoms, assess medications.`
      );
    }
    // Low O2
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) {
      alerts.push(
        `Low oxygen saturation detected for ${patient.name} (${vitals.oxygenSaturation}%). Consider oxygen therapy, assess respiratory status.`
      );
    }

    // Only add new alerts if any exist
    if (alerts.length > 0) {
      setMessages((prev) => [
        ...prev,
        ...alerts.map((content) => ({
          id: Date.now().toString() + Math.random(),
          role: "assistant" as "assistant",
          content,
          timestamp: new Date().toISOString(),
        })),
      ]);
    }
  }, [patient.vitals, isOpen]);

  useEffect(() => {
    // Only speak the latest assistant message
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(last.content);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => {
          if (
            recognitionRef.current &&
            speechSupported &&
            !isListening // Only start if not already listening
          ) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 800); // Add delay here too
      };
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
    // eslint-disable-next-line
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col m-4">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Show temperature")}
              className="rounded-xl text-xs"
            >
              <Thermometer className="h-3 w-3 mr-1" />
              Temperature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Show blood pressure")}
              className="rounded-xl text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              Blood Pressure
            </Button>
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
              onClick={() => handleSendMessage()}
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
      "CRITICAL risk level - requires continuous monitoring."
    );
  }

  if (patient.acuityLevel >= 4) {
    criticalAlerts.push(
      `High acuity level ${patient.acuityLevel} - frequent assessments needed.`
    );
  }

  if (patient.allergies.length > 0) {
    criticalAlerts.push(
      `Allergies: ${patient.allergies.join(
        ", "
      )} - verify before any interventions.`
    );
  }

  const vitalsConcerns = [];
  if (
    patient.vitals &&
    patient.vitals.painLevel &&
    patient.vitals.painLevel > 5
  ) {
    vitalsConcerns.push(
      `Pain level ${patient.vitals.painLevel}/10 - requires intervention.`
    );
  }

  if (
    patient.vitals &&
    patient.vitals.temperature &&
    (patient.vitals.temperature > 101 || patient.vitals.temperature < 96)
  ) {
    vitalsConcerns.push(
      `Temperature ${patient.vitals.temperature}°F - monitor closely.`
    );
  }

  const medicationAlerts = [];
  const activeMeds = patient.medications.filter(
    (med) => med.status === "active"
  );
  if (activeMeds.length > 0) {
    medicationAlerts.push(
      `${activeMeds.length} active medications - check for interactions.`
    );
  }

  let message = `Hello! I'm your clinical assistant for ${patient.name}.

Patient overview:
Diagnosis: ${patient.primaryDiagnosis}
Room: ${patient.room} | Age: ${
    patient.demographics?.age ?? patient.age ?? "N/A"
  } | ${patient.demographics?.gender ?? patient.gender ?? "N/A"}
Risk: ${patient.riskLevel.toUpperCase()} | Acuity: ${patient.acuityLevel}
`;

  if (criticalAlerts.length > 0) {
    message += `Alerts:\n${criticalAlerts
      .map((alert) => `- ${alert}`)
      .join("\n")}\n\n`;
  }

  if (vitalsConcerns.length > 0) {
    message += `Vital signs concerns:\n${vitalsConcerns
      .map((concern) => `- ${concern}`)
      .join("\n")}\n\n`;
  }

  if (medicationAlerts.length > 0) {
    message += `Medication status:\n${medicationAlerts
      .map((alert) => `- ${alert}`)
      .join("\n")}\n\n`;
  }

  message += `I can help with:
- Clinical assessments and monitoring priorities
- Medication management and safety checks
- Pain management strategies
- Discharge planning and readiness
- Evidence-based nursing interventions
- Documentation guidance

Use the quick action buttons above or ask me anything about ${patient.name}'s care.`;

  return message;
}

function generateDetailedAIResponse(
  message: string,
  patient: PatientDetails
): string {
  const lowerMessage = message.toLowerCase();

  // Use compromise NLP to extract nouns and medical terms
  const doc = nlp(message);
  const nouns = doc
    .nouns()
    .out("array")
    .map((n: string) => n.toLowerCase());
  const terms = doc
    .terms()
    .out("array")
    .map((t) => t.toLowerCase());

  // Define all keywords/entities
  const vitalKeywords = [
    "temperature",
    "temp",
    "blood pressure",
    "bp",
    "heart rate",
    "pulse",
    "oxygen",
    "spo2",
    "saturation",
    "pain",
    "respiratory rate",
    "resp rate",
    "rr",
    "weight",
    "height",
  ];
  const symptomKeywords = [
    "fever",
    "cough",
    "nausea",
    "vomiting",
    "diarrhea",
    "fatigue",
    "dizziness",
  ];
  const labKeywords = [
    "wbc",
    "white blood cell",
    "hemoglobin",
    "creatinine",
    "potassium",
    "sodium",
  ];
  const diagnosisKeywords = [
    "diabetes",
    "hypertension",
    "infection",
    "sepsis",
    "stroke",
  ];
  const procedureKeywords = [
    "iv",
    "catheter",
    "surgery",
    "intubation",
    "dialysis",
  ];
  const medicationKeywords = [
    ...patient.medications.map((med) => med.name?.toLowerCase() ?? ""),
  ];
  const allergyKeywords = [
    ...patient.allergies.map((allergy) => allergy.toLowerCase()),
  ];

  // NLP-based entity detection
  const foundVitals = vitalKeywords.filter(
    (vital) => nouns.includes(vital) || terms.includes(vital)
  );
  const foundSymptoms = symptomKeywords.filter(
    (symptom) => nouns.includes(symptom) || terms.includes(symptom)
  );
  const foundLabs = labKeywords.filter(
    (lab) => nouns.includes(lab) || terms.includes(lab)
  );
  const foundDiagnosis = diagnosisKeywords.filter(
    (dx) => nouns.includes(dx) || terms.includes(dx)
  );
  const foundProcedures = procedureKeywords.filter(
    (proc) => nouns.includes(proc) || terms.includes(proc)
  );
  const foundMedications = medicationKeywords.filter(
    (med) => nouns.includes(med) || terms.includes(med)
  );
  const foundAllergies = allergyKeywords.filter(
    (allergy) => nouns.includes(allergy) || terms.includes(allergy)
  );

  // 1. Handle vitals (show all found)
  if (foundVitals.length > 0) {
    let responses: string[] = [];
    for (const vital of foundVitals) {
      if (["temperature", "temp"].includes(vital)) {
        const temp = patient.vitals?.temperature;
        if (!temp)
          responses.push(`No temperature recorded for ${patient.name}.`);
        else {
          let status = "";
          if (temp > 101) status = "This is considered a fever (abnormal).";
          else if (temp < 96)
            status = "This is considered hypothermia (abnormal).";
          else status = "This is within the normal range.";
          responses.push(`Current temperature: ${temp}°F. ${status}`);
        }
      }
      if (["blood pressure", "bp"].includes(vital)) {
        const bp = patient.vitals?.bloodPressure;
        if (!bp)
          responses.push(`No blood pressure recorded for ${patient.name}.`);
        else {
          let status = "";
          if (bp.systolic > 140 || bp.diastolic > 90)
            status = "This is considered high (hypertension, abnormal).";
          else if (bp.systolic < 90 || bp.diastolic < 60)
            status = "This is considered low (hypotension, abnormal).";
          else status = "This is within the normal range.";
          responses.push(
            `Current blood pressure: ${bp.systolic}/${bp.diastolic} mmHg. ${status}`
          );
        }
      }
      if (["heart rate", "pulse"].includes(vital)) {
        const hr = patient.vitals?.heartRate;
        if (!hr) responses.push(`No heart rate recorded for ${patient.name}.`);
        else {
          let status = "";
          if (hr > 100) status = "This is considered tachycardia (abnormal).";
          else if (hr < 60)
            status = "This is considered bradycardia (abnormal).";
          else status = "This is within the normal range.";
          responses.push(`Current heart rate: ${hr} bpm. ${status}`);
        }
      }
      if (["oxygen", "spo2", "saturation"].includes(vital)) {
        const ox = patient.vitals?.oxygenSaturation;
        if (!ox)
          responses.push(`No oxygen saturation recorded for ${patient.name}.`);
        else {
          let status = "";
          if (ox < 95) status = "This is considered low (abnormal).";
          else status = "This is within the normal range.";
          responses.push(`Current oxygen saturation: ${ox}%. ${status}`);
        }
      }
      if (["respiratory rate", "resp rate", "rr"].includes(vital)) {
        const rr = patient.vitals?.respiratoryRate;
        if (!rr)
          responses.push(`No respiratory rate recorded for ${patient.name}.`);
        else {
          let status = "";
          if (rr > 24) status = "This is considered tachypnea (abnormal).";
          else if (rr < 12) status = "This is considered bradypnea (abnormal).";
          else status = "This is within the normal range.";
          responses.push(`Current respiratory rate: ${rr}/min. ${status}`);
        }
      }
      if (vital === "weight") {
        const wt = patient.vitals?.weight;
        if (!wt) responses.push(`No weight recorded for ${patient.name}.`);
        else responses.push(`Current weight: ${wt} kg.`);
      }
      if (vital === "height") {
        const ht = patient.vitals?.height;
        if (!ht) responses.push(`No height recorded for ${patient.name}.`);
        else responses.push(`Current height: ${ht} cm.`);
      }
      if (vital === "pain") {
        const pain = patient.vitals?.painLevel;
        if (pain === undefined)
          responses.push(`No pain level recorded for ${patient.name}.`);
        else {
          let status = "";
          if (pain >= 7)
            status = "Severe pain (immediate intervention needed).";
          else if (pain >= 4) status = "Moderate pain (management indicated).";
          else if (pain > 0) status = "Mild pain (monitor closely).";
          else status = "No pain reported.";
          responses.push(`Current pain level: ${pain}/10. ${status}`);
        }
      }
    }
    return responses.join("\n");
  }

  // 2. Handle symptoms
  if (foundSymptoms.length > 0) {
    return `Symptom(s) detected: ${foundSymptoms.join(
      ", "
    )}. Please monitor and document appropriately.`;
  }

  // 3. Handle labs
  if (foundLabs.length > 0) {
    return `Lab(s) detected: ${foundLabs.join(
      ", "
    )}. Please review latest results in the chart.`;
  }

  // 4. Handle diagnoses
  if (foundDiagnosis.length > 0) {
    return `Diagnosis detected: ${foundDiagnosis.join(
      ", "
    )}. Refer to protocols for management.`;
  }

  // 5. Handle procedures
  if (foundProcedures.length > 0) {
    return `Procedure(s) detected: ${foundProcedures.join(
      ", "
    )}. Ensure all safety and documentation protocols are followed.`;
  }

  // 6. Handle medications
  if (foundMedications.length > 0) {
    return `Medication(s) detected: ${foundMedications.join(
      ", "
    )}. Review administration schedule and monitor for side effects.`;
  }

  // 7. Handle allergies
  if (foundAllergies.length > 0) {
    return `Allergy detected: ${foundAllergies.join(
      ", "
    )}. Ensure strict avoidance and monitor for reactions.`;
  }

  // 8. Personal data queries
  if (lowerMessage.includes("name")) {
    return `Patient name: ${patient.name}`;
  }
  if (lowerMessage.includes("gender")) {
    return `Patient gender: ${
      patient.demographics?.gender ?? patient.gender ?? "Not specified"
    }`;
  }
  if (lowerMessage.includes("age")) {
    return `Patient age: ${
      patient.demographics?.age ?? patient.age ?? "Not specified"
    }`;
  }
  if (lowerMessage.includes("marital status")) {
    return `Patient marital status: ${
      patient.demographics?.maritalStatus ??
      patient.maritalStatus ??
      "Not specified"
    }`;
  }
  if (lowerMessage.includes("room")) {
    return `Patient room: ${patient.room}`;
  }
  if (lowerMessage.includes("diagnosis")) {
    return `Primary diagnosis: ${patient.primaryDiagnosis}`;
  }
  if (lowerMessage.includes("risk")) {
    return `Risk level: ${patient.riskLevel}`;
  }
  if (lowerMessage.includes("acuity")) {
    return `Acuity level: ${patient.acuityLevel}`;
  }
  if (lowerMessage.includes("allerg")) {
    if (patient.allergies.length > 0) {
      return `Allergies: ${patient.allergies.join(", ")}`;
    } else {
      return "No known allergies documented.";
    }
  }

  // 9. Vital signs analysis
  if (
    lowerMessage.includes("vital") ||
    lowerMessage.includes("assessment") ||
    lowerMessage.includes("monitor")
  ) {
    const vitalsAnalysis = analyzeVitals(patient);
    return `Vital signs analysis for ${patient.name}:\n\n${vitalsAnalysis}`;
  }

  // 10. Medication review
  if (
    lowerMessage.includes("medication") ||
    lowerMessage.includes("med") ||
    lowerMessage.includes("drug")
  ) {
    return generateMedicationGuidance(patient);
  }

  // 11. Pain management
  if (lowerMessage.includes("pain")) {
    return generatePainManagementGuidance(patient);
  }

  // 12. Care priorities
  if (
    lowerMessage.includes("priority") ||
    lowerMessage.includes("intervention") ||
    lowerMessage.includes("care plan")
  ) {
    return generateCarePriorities(patient);
  }

  // 13. Discharge planning
  if (
    lowerMessage.includes("discharge") ||
    lowerMessage.includes("home") ||
    lowerMessage.includes("ready")
  ) {
    return generateDischargeGuidance(patient);
  }

  // 14. Allergy safety
  if (
    lowerMessage.includes("allerg") ||
    lowerMessage.includes("safety") ||
    lowerMessage.includes("precaution")
  ) {
    return generateAllergyGuidance(patient);
  }

  // 15. Assessment guidance
  if (
    lowerMessage.includes("assess") ||
    lowerMessage.includes("exam") ||
    lowerMessage.includes("check")
  ) {
    return generateAssessmentGuidance(patient);
  }

  // 16. General fallback
  return `Clinical guidance for ${patient.name}:

Based on your question about "${message}", here's my analysis:

Current status:
- Condition: ${patient.primaryDiagnosis}
- Risk Level: ${patient.riskLevel.toUpperCase()} (${
    patient.riskLevel === "critical"
      ? "requires continuous monitoring"
      : "requires regular assessment"
  })
- Acuity: Level ${patient.acuityLevel} (${
    patient.acuityLevel >= 4 ? "high priority" : "standard monitoring"
  })

Immediate considerations:
- Monitor for complications related to ${patient.primaryDiagnosis}
- Maintain safety precautions for ${patient.riskLevel} risk patients
- Follow protocols for acuity level ${patient.acuityLevel}
${
  patient.allergies.length > 0
    ? `- ALLERGY ALERT: ${patient.allergies.join(", ")}`
    : ""
}

Recommendations:
- Perform systematic head-to-toe assessment
- Review medication administration record
- Assess pain and comfort level
- Monitor for signs of deterioration
- Document all findings and interventions

Would you like specific guidance on any particular aspect of ${
    patient.name
  }'s care?`;
}

function analyzeVitals(patient: PatientDetails): string {
  const vitals = patient.vitals;
  const concerns: string[] = [];
  const normal: string[] = [];

  if (!vitals) {
    return "No recent vital signs recorded. Please obtain baseline measurements.\n";
  }

  // Temperature
  if (vitals.temperature !== undefined) {
    if (vitals.temperature > 101) {
      concerns.push(
        `Fever: ${vitals.temperature}°F. Suggest: Give antipyretics, monitor for infection, increase fluids, notify provider if persistent.`
      );
    } else if (vitals.temperature < 96) {
      concerns.push(
        `Hypothermia: ${vitals.temperature}°F. Suggest: Apply warming blankets, monitor for shivering, check for sepsis or exposure.`
      );
    } else {
      normal.push(`Temperature: ${vitals.temperature}°F (Normal)`);
    }
  }

  // Blood Pressure
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;
    if (systolic > 140 || diastolic > 90) {
      concerns.push(
        `High BP: ${systolic}/${diastolic} mmHg. Suggest: Recheck BP, assess for headache or vision changes, review antihypertensive meds, notify provider if sustained.`
      );
    } else if (systolic < 90 || diastolic < 60) {
      concerns.push(
        `Low BP: ${systolic}/${diastolic} mmHg. Suggest: Check for dizziness, increase fluids if allowed, lay patient flat, notify provider if symptomatic.`
      );
    } else {
      normal.push(`Blood Pressure: ${systolic}/${diastolic} mmHg (Normal)`);
    }
  }

  // Heart Rate
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate > 100) {
      concerns.push(
        `Tachycardia: ${vitals.heartRate} bpm. Suggest: Assess for pain, fever, dehydration, anxiety, check ECG if new.`
      );
    } else if (vitals.heartRate < 60) {
      concerns.push(
        `Bradycardia: ${vitals.heartRate} bpm. Suggest: Assess for dizziness, check medications (beta-blockers), monitor for syncope.`
      );
    } else {
      normal.push(`Heart Rate: ${vitals.heartRate} bpm (Normal)`);
    }
  }

  // Respiratory Rate
  if (vitals.respiratoryRate !== undefined) {
    if (vitals.respiratoryRate > 24) {
      concerns.push(
        `Tachypnea: ${vitals.respiratoryRate}/min. Suggest: Assess for respiratory distress, check oxygen, encourage deep breathing.`
      );
    } else if (vitals.respiratoryRate < 12) {
      concerns.push(
        `Bradypnea: ${vitals.respiratoryRate}/min. Suggest: Assess sedation, check for opioid use, stimulate patient, notify provider if <10.`
      );
    } else {
      normal.push(`Respiratory Rate: ${vitals.respiratoryRate}/min (Normal)`);
    }
  }

  // Oxygen Saturation
  if (vitals.oxygenSaturation !== undefined) {
    if (vitals.oxygenSaturation < 95) {
      concerns.push(
        `Low O2 Sat: ${vitals.oxygenSaturation}%. Suggest: Apply oxygen if ordered, check airway, encourage coughing/deep breathing, notify provider if <92%.`
      );
    } else {
      normal.push(`Oxygen Saturation: ${vitals.oxygenSaturation}% (Normal)`);
    }
  }

  // Pain Level
  if (vitals.painLevel !== undefined) {
    if (vitals.painLevel >= 7) {
      concerns.push(
        `Severe pain: ${vitals.painLevel}/10. Suggest: Administer prescribed analgesics, reassess in 30 min, notify provider if not relieved.`
      );
    } else if (vitals.painLevel >= 4) {
      concerns.push(
        `Moderate pain: ${vitals.painLevel}/10. Suggest: Give pain meds as ordered, use non-pharmacological methods, reassess.`
      );
    } else if (vitals.painLevel > 0) {
      normal.push(`Mild pain: ${vitals.painLevel}/10 (Monitor)`);
    } else {
      normal.push(`Pain Level: 0/10 (No pain)`);
    }
  }

  let analysis = "";
  if (concerns.length > 0) {
    analysis +=
      "Abnormal findings & suggestions:\n" + concerns.join("\n") + "\n\n";
  }
  if (normal.length > 0) {
    analysis += "Normal findings:\n" + normal.join("\n") + "\n\n";
  }
  if (concerns.length === 0 && normal.length === 0) {
    analysis =
      "No recent vital signs recorded. Please obtain baseline measurements.\n";
  }
  return analysis;
}

function generateMedicationGuidance(patient: PatientDetails): string {
  const activeMeds = patient.medications.filter(
    (med) => med.status === "active"
  );
  const heldMeds = patient.medications.filter((med) => med.status === "held");

  let guidance = `Medication management for ${patient.name}:\n\n`;

  if (activeMeds.length > 0) {
    guidance += `Active medications (${activeMeds.length}):\n`;
    activeMeds.forEach((med) => {
      guidance += `- ${med.name} (${med.dose} ${med.route}) - ${med.indication}\n`;
    });
    guidance += `\n`;
  } else {
    guidance += `No active medications found.\n\n`;
  }

  if (heldMeds.length > 0) {
    guidance += `Held medications (${heldMeds.length}):\n`;
    heldMeds.forEach((med) => {
      guidance += `- ${med.name} (${med.dose} ${med.route}) - ${med.indication}\n`;
    });
    guidance += `\n`;
  } else {
    guidance += `No held medications found.\n\n`;
  }

  guidance += `General medication safety recommendations:
- Verify patient allergies before administering any medications
- Double-check all high-risk medications (e.g., anticoagulants, insulin)
- Ensure correct patient, drug, dose, route, and time (5 rights of medication administration)
- Monitor for and document any side effects or adverse reactions
- Educate patient about their medications, including purpose, dosage, and potential side effects
- Encourage adherence to prescribed medication regimen

Special considerations for ${patient.name}:
- ${patient.primaryDiagnosis} may require specific medication adjustments
- Renal or hepatic impairment? Adjust doses accordingly and monitor closely
- Elderly patients may be more sensitive to medications - start low, go slow
- Be cautious with medications that can cause sedation or respiratory depression, especially in patients with compromised respiratory function

Consult pharmacy for:
- Any drug interaction concerns
- Clarification of medication orders
- Patient-specific medication counseling
`;
}

function generatePainManagementGuidance(patient: PatientDetails): string {
  return `Pain management for ${patient.name}:

Current pain status:
- Pain level: ${
    patient.vitals.painLevel
  }/10 (0 = no pain, 10 = worst pain imaginable)
- Location: ${patient.pain?.location ?? "Not specified"}
- Quality: ${patient.pain?.quality ?? "Not specified"}
- Duration: ${patient.pain?.duration ?? "Not specified"}
- Aggravating factors: ${patient.pain?.aggravatingFactors ?? "Not specified"}
- Alleviating factors: ${patient.pain?.relievingFactors ?? "Not specified"}

Recommended interventions:
- Pharmacological:
  - Administer prescribed analgesics (e.g., acetaminophen, ibuprofen, opioids)
  - Consider adjuvant medications (e.g., anticonvulsants, antidepressants) for neuropathic pain
  - Use patient-controlled analgesia (PCA) if appropriate
- Non-pharmacological:
  - Positioning and comfort measures
  - Heat/cold therapy as appropriate
  - Relaxation techniques and distraction
  - Environmental modifications (lighting, noise)

Monitoring requirements:
- Reassessment every 30-60 minutes after intervention
- Document pain scores, interventions, effectiveness
- Alert if pain >7/10 or sudden increase in pain level

Special considerations:
- Diagnosis: ${patient.primaryDiagnosis} may cause specific pain patterns
- Age: ${patient.demographics.age} years - consider age-related factors
- Risk Level: ${patient.riskLevel.toUpperCase()} - may affect medication choices`;
}

function generateCarePriorities(patient: PatientDetails): string {
  const priorities = [];

  // Risk-based priorities
  if (patient.riskLevel === "critical") {
    priorities.push("Critical monitoring: Continuous assessment required");
  }

  if (patient.acuityLevel >= 4) {
    priorities.push("High acuity: Frequent vital signs and assessments");
  }

  // Allergy priorities
  if (patient.allergies.length > 0) {
    priorities.push("Allergy safety: Verify all medications and treatments");
  }

  // Pain priorities
  if (patient.vitals.painLevel && patient.vitals.painLevel > 5) {
    priorities.push("Pain management: Address elevated pain level");
  }

  // Medication priorities
  const activeMeds = patient.medications.filter(
    (med) => med.status === "active"
  );
  if (activeMeds.length > 0) {
    priorities.push("Medication safety: Monitor for interactions and effects");
  }

  return `Nursing care priorities for ${patient.name}:

Immediate priorities:
${priorities.map((priority) => `- ${priority}`).join("\n")}

Systematic care plan:

1. Safety & Monitoring
- Continuous monitoring per acuity level ${patient.acuityLevel}
- Fall risk assessment and precautions
- Infection control measures
${
  patient.allergies.length > 0
    ? `- Allergy precautions: ${patient.allergies.join(", ")}`
    : ""
}

2. Physiological Needs
- Vital signs monitoring and trending
- Pain assessment and management
- Medication administration and monitoring
- Nutrition and hydration status

3. Psychosocial Support
- Patient and family education
- Emotional support and coping strategies
- Communication with healthcare team
- Discharge planning preparation

4. Documentation
- Accurate and timely charting
- Incident reporting as needed
- Care plan updates
- Handoff communication

Condition-specific interventions:
Based on ${patient.primaryDiagnosis}:
- Monitor for specific complications
- Implement evidence-based protocols
- Coordinate with interdisciplinary team
- Patient education on condition management`;
}

function generateDischargeGuidance(patient: PatientDetails): string {
  return `Discharge planning for ${patient.name}:

Readiness assessment:
- Medical stability: Vital signs stable for 24+ hours, pain controlled with oral medications, no acute complications from ${
    patient.primaryDiagnosis
  }
- Functional status: Able to perform activities of daily living, mobility appropriate for home environment, cognitive function adequate for self-care
- Medication management: Medication reconciliation completed, patient/family understands medication regimen, pharmacy arrangements made

Discharge checklist:
Medical clearance:
- Physician discharge order obtained
- All treatments completed
- Follow-up appointments scheduled
- Diagnostic results reviewed

Medications:
- Reconcile home vs. hospital medications
- Provide written medication list
- Ensure patient has adequate supply
- Review administration instructions

Patient education:
- Diagnosis and treatment explanation
- Activity restrictions and guidelines
- When to seek medical attention
- Emergency contact information

Home preparation:
- Home safety assessment completed
- Medical equipment arranged if needed
- Home health services coordinated
- Transportation arranged

Follow-up care:
- Primary care physician appointment
- Specialist referrals as needed
- Home health nursing if indicated
- Physical therapy if required

Warning signs to report (specific to ${patient.primaryDiagnosis}):
- Worsening symptoms
- New or increased pain
- Signs of infection
- Medication side effects

Special considerations:
- Age: ${
    patient.demographics?.age ?? patient.age ?? "N/A"
  } years - may need additional support
- Risk Level: ${patient.riskLevel.toUpperCase()} - enhanced monitoring needed
${
  patient.allergies.length > 0
    ? `- Allergies: ${patient.allergies.join(", ")} - ensure awareness`
    : ""
}`;
}

function generateAllergyGuidance(patient: PatientDetails): string {
  if (patient.allergies.length === 0) {
    return `Allergy status for ${patient.name}:

No known allergies documented.

Safety protocols:
- Always ask about allergies before any intervention
- Monitor for new allergic reactions
- Document any new allergies immediately
- Educate patient about reporting reactions

Vigilance required:
Even with no known allergies, remain alert for:
- First-time medication reactions
- Food allergies during meal service
- Environmental allergens (latex, cleaning products)
- Cross-reactions with new substances`;
  }

  return `Allergy management for ${patient.name}:

Critical allergies:
${patient.allergies
  .map(
    (allergy) => `- ${allergy.toUpperCase()} - Verify before any intervention`
  )
  .join("\n")}

Safety protocols:
Before any medication/treatment:
- Verify allergy band is present and accurate
- Check electronic medical record
- Ask patient to confirm allergies
- Cross-reference with medication orders

Emergency preparedness:
- Know location of emergency medications (epinephrine, Benadryl)
- Have crash cart readily available
- Know rapid response activation process
- Ensure allergy information is visible on chart

Cross-reaction awareness:
${patient.allergies
  .map((allergy) => {
    if (allergy.toLowerCase().includes("penicillin")) {
      return "- Penicillin allergy: Avoid all beta-lactam antibiotics, use alternative antibiotics";
    }
    return `- ${allergy}: Research potential cross-reactions before new medications`;
  })
  .join("\n")}

Documentation requirements:
- All allergies clearly documented in chart
- Allergy band present and legible
- Reaction type and severity noted
- Date of last reaction if known

Patient education:
- Ensure patient knows their allergies
- Provide written allergy list for discharge
- Teach importance of informing all healthcare providers
- Discuss medical alert jewelry/cards`;
}
function generateAssessmentGuidance(patient: PatientDetails): string {
  return `Assessment guidance for ${patient.name}:

1. General Appearance:
- Observe for distress, discomfort, or changes in mental status
- Note posture, mobility, and ability to communicate

2. Vital Signs:
- Temperature: ${patient.vitals?.temperature ?? "N/A"}°F
- Blood Pressure: ${
    patient.vitals?.bloodPressure
      ? `${patient.vitals.bloodPressure.systolic}/${patient.vitals.bloodPressure.diastolic} mmHg`
      : "N/A"
  }
- Heart Rate: ${patient.vitals?.heartRate ?? "N/A"} bpm
- Respiratory Rate: ${patient.vitals?.respiratoryRate ?? "N/A"}/min
- Oxygen Saturation: ${patient.vitals?.oxygenSaturation ?? "N/A"}%
- Pain Level: ${patient.vitals?.painLevel ?? "N/A"}/10

3. Focused Assessment:
- Primary diagnosis: ${patient.primaryDiagnosis}
- Assess for complications or changes related to diagnosis
- Monitor for abnormal findings in vital signs or symptoms

4. Allergies:
${
  patient.allergies.length > 0
    ? `- ${patient.allergies.join(", ")} (verify before interventions)`
    : "- No known allergies"
}

5. Medication Review:
- Check for new, held, or high-risk medications
- Monitor for side effects or adverse reactions

6. Functional Status:
- Assess mobility, fall risk, and ability to perform activities of daily living
- Evaluate cognitive status and orientation

7. Psychosocial:
- Assess mood, coping, and support systems
- Identify any barriers to care or discharge

Documentation:
- Record all findings, interventions, and patient responses
- Notify provider of any abnormal or concerning findings

Would you like a more detailed assessment in a specific area?`;
}
