import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, patientId, patientName, patientDiagnosis, riskLevel, acuityLevel } = await request.json()

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate contextual AI response based on patient data
    const aiResponse = generateNursingAIResponse(message, {
      id: patientId,
      name: patientName,
      diagnosis: patientDiagnosis,
      riskLevel,
      acuityLevel,
    })

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing AI chat:", error)
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}

function generateNursingAIResponse(
  message: string,
  patient: { id: string; name: string; diagnosis: string; riskLevel: string; acuityLevel: number },
): string {
  const lowerMessage = message.toLowerCase()

  // Medication-related queries
  if (lowerMessage.includes("medication") || lowerMessage.includes("med") || lowerMessage.includes("drug")) {
    return `For ${patient.name} with ${patient.diagnosis}, I recommend:

🔹 **Medication Safety**: Always verify the 5 rights (right patient, medication, dose, route, time)
🔹 **Risk Assessment**: Given their ${patient.riskLevel} risk level, monitor for adverse reactions
🔹 **Documentation**: Record administration time, route, and patient response
🔹 **Interactions**: Check for drug-drug interactions, especially with their current diagnosis

Would you like specific medication protocols for ${patient.diagnosis}?`
  }

  // Vital signs queries
  if (
    lowerMessage.includes("vital") ||
    lowerMessage.includes("bp") ||
    lowerMessage.includes("temperature") ||
    lowerMessage.includes("pulse")
  ) {
    return `For vital signs monitoring of ${patient.name}:

📊 **Frequency**: Acuity level ${patient.acuityLevel} suggests monitoring every ${patient.acuityLevel >= 4 ? "1-2 hours" : "4 hours"}
🌡️ **Parameters**: Focus on temperature, BP, pulse, respirations, O2 sat, pain level
⚠️ **Alert Values**: Given ${patient.diagnosis}, watch for signs of deterioration
📝 **Documentation**: Record trends, not just individual readings

Need specific normal ranges for their condition?`
  }

  // Pain management
  if (lowerMessage.includes("pain")) {
    return `Pain management for ${patient.name}:

🎯 **Assessment**: Use 0-10 scale, document location, quality, duration
💊 **Interventions**: Consider both pharmacological and non-pharmacological approaches
⏰ **Timing**: Monitor effectiveness 30-60 minutes post-medication
🔄 **Reassessment**: Continuous evaluation, especially with ${patient.riskLevel} risk level

Would you like pain management protocols for ${patient.diagnosis}?`
  }

  // Discharge planning
  if (lowerMessage.includes("discharge") || lowerMessage.includes("planning") || lowerMessage.includes("home")) {
    return `Discharge planning for ${patient.name}:

✅ **Medical Clearance**: Ensure all treatments completed for ${patient.diagnosis}
💊 **Medication Reconciliation**: Review all medications, provide clear instructions
📚 **Patient Education**: Teach about condition, medications, warning signs
📞 **Follow-up**: Schedule appropriate appointments based on acuity level ${patient.acuityLevel}
🏠 **Home Safety**: Assess need for equipment, home health services

Need a discharge checklist for their specific condition?`
  }

  // Allergies and safety
  if (lowerMessage.includes("allerg") || lowerMessage.includes("reaction") || lowerMessage.includes("safety")) {
    return `Safety considerations for ${patient.name}:

🚨 **Allergy Verification**: Always check allergy bands and chart before any intervention
🔍 **Cross-Reactions**: Be aware of related allergens and cross-sensitivities
📋 **Documentation**: Ensure all allergies are clearly documented and communicated
⚠️ **Emergency Preparedness**: Know location of emergency medications (epinephrine, etc.)

Given their ${patient.riskLevel} risk level, extra vigilance is warranted. Need specific allergy protocols?`
  }

  // Assessment and monitoring
  if (lowerMessage.includes("assess") || lowerMessage.includes("monitor") || lowerMessage.includes("check")) {
    return `Assessment priorities for ${patient.name}:

🔍 **Primary Focus**: Monitor for complications related to ${patient.diagnosis}
📊 **Systematic Approach**: Use head-to-toe assessment, prioritize by acuity level ${patient.acuityLevel}
⏱️ **Frequency**: ${patient.riskLevel === "critical" ? "Continuous monitoring" : "Regular scheduled assessments"}
📝 **Documentation**: Record objective findings, changes from baseline
🚨 **Early Warning Signs**: Watch for deterioration indicators

Would you like specific assessment tools for their condition?`
  }

  // General nursing care
  return `I'm here to help with ${patient.name}'s care. Based on their ${patient.diagnosis} and ${patient.riskLevel} risk level, I can assist with:

🏥 **Clinical Decision Support**: Evidence-based care recommendations
💊 **Medication Management**: Dosing, interactions, administration guidelines
📊 **Assessment Guidance**: Systematic evaluation approaches
📋 **Documentation**: Proper charting and communication
🎯 **Care Planning**: Individualized interventions
⚠️ **Safety Protocols**: Risk mitigation strategies

What specific aspect of their care would you like guidance on?`
}
