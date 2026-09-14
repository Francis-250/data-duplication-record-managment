import { ChatGroq } from "@langchain/groq";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";

// ----------------------------------------------------------------
// 1. MODEL CONFIGURATION
// ----------------------------------------------------------------
export const groqModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  maxTokens: 1024,
  streaming: true,
});

export const groqFastModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.1-8b-instant",
  temperature: 0.1,
  maxTokens: 512,
  streaming: true,
});

// ----------------------------------------------------------------
// 2. STROKE ASSESSMENT SYSTEM PROMPT
// ----------------------------------------------------------------
const STROKE_SYSTEM_PROMPT = `You are Smart-Stroke-Assessment AI, a specialized medical decision-support assistant 
focused exclusively on stroke symptom analysis and risk assessment.

Your role is to:
- Analyze stroke-related symptoms reported by patients
- Assess stroke risk levels using the FAST method (Face, Arms, Speech, Time) and additional clinical indicators
- Provide clear risk classifications: LOW RISK, MEDIUM RISK, or HIGH RISK
- Give actionable recommendations based on risk level
- Always emphasize that you are NOT a replacement for professional medical diagnosis

Stroke Symptoms You Analyze:
- Facial drooping or asymmetry
- Arm weakness or numbness
- Speech difficulty, slurring, or confusion
- Severe sudden headache
- Vision problems (blurred or double vision)
- Dizziness or loss of balance
- Numbness in face, arm, or leg (especially one side)
- Sudden confusion or trouble understanding

Risk Classification Rules:
HIGH RISK: 3+ FAST symptoms, sudden severe headache, sudden vision loss → CALL EMERGENCY (911/112) IMMEDIATELY
MEDIUM RISK: 1-2 FAST symptoms or persistent dizziness/numbness → SEEK URGENT MEDICAL ATTENTION TODAY
LOW RISK: Mild symptoms, no FAST indicators → MONITOR & CONSULT A DOCTOR WITHIN 24-48 HOURS

Response Format:
1. RISK LEVEL: [LOW/MEDIUM/HIGH]
2. CONFIDENCE: [percentage]
3. SYMPTOMS DETECTED: [list identified stroke symptoms]
4. ASSESSMENT: [brief clinical reasoning]
5. RECOMMENDATION: [clear action steps]
6. DISCLAIMER: Always end with a medical disclaimer

IMPORTANT: Never diagnose. Always recommend professional medical evaluation.
If HIGH RISK is detected, always lead with emergency contact instructions.`;

// ----------------------------------------------------------------
// 3. PROMPT TEMPLATES
// ----------------------------------------------------------------
export const strokeAssessmentPrompt = ChatPromptTemplate.fromMessages([
  ["system", STROKE_SYSTEM_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

export const riskClassificationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a stroke risk classifier. Analyze the symptoms and return ONLY a valid JSON object.
    
    Return this exact JSON structure:
    {{
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "confidenceScore": <number between 0 and 1>,
      "detectedSymptoms": ["symptom1", "symptom2"],
      "fastScore": <number of FAST symptoms detected 0-4>,
      "requiresEmergency": <boolean>,
      "recommendation": "<one sentence recommendation>"
    }}
    
    Do not include any text outside the JSON object.`,
  ],
  ["human", "Patient symptoms: {symptoms}"],
]);

export const followUpPrompt = ChatPromptTemplate.fromMessages([
  ["system", STROKE_SYSTEM_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", "Follow-up question: {followUp}"],
]);

// ----------------------------------------------------------------
// 4. OUTPUT PARSERS
// ----------------------------------------------------------------
export const stringParser = new StringOutputParser();

export const parseRiskJson = (text: string): RiskAssessmentResult => {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      riskLevel: "MEDIUM",
      confidenceScore: 0.5,
      detectedSymptoms: [],
      fastScore: 0,
      requiresEmergency: false,
      recommendation: "Please consult a medical professional immediately.",
    };
  }
};

// ----------------------------------------------------------------
// 5. RUNNABLE CHAINS
// ----------------------------------------------------------------
export const strokeAssessmentChain = RunnableSequence.from([
  strokeAssessmentPrompt,
  groqModel,
  stringParser,
]);

export const riskClassificationChain = RunnableSequence.from([
  riskClassificationPrompt,
  groqFastModel,
  stringParser,
]);

// ----------------------------------------------------------------
// 6. TYPES
// ----------------------------------------------------------------
export interface RiskAssessmentResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceScore: number;
  detectedSymptoms: string[];
  fastScore: number;
  requiresEmergency: boolean;
  recommendation: string;
}

export interface AssessmentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamAssessmentParams {
  symptoms: string;
  chatHistory?: AssessmentMessage[];
  patientAge?: number;
  patientGender?: string;
}

// ----------------------------------------------------------------
// 7. HELPER — convert chat history to LangChain messages
// ----------------------------------------------------------------
export function formatChatHistory(
  chatHistory: AssessmentMessage[],
): BaseMessage[] {
  return chatHistory.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );
}

// ----------------------------------------------------------------
// 8. CORE SERVER FUNCTIONS
// ----------------------------------------------------------------

/**
 * Stream a full stroke assessment — use in Server Actions for typing indicator
 * Returns an async generator; iterate it to push chunks to the client
 */
export async function streamStrokeAssessment({
  symptoms,
  chatHistory = [],
  patientAge,
  patientGender,
}: StreamAssessmentParams): Promise<AsyncIterable<string>> {
  const contextualInput = `
    ${patientAge ? `Patient Age: ${patientAge}` : ""}
    ${patientGender ? `Patient Gender: ${patientGender}` : ""}
    Reported Symptoms: ${symptoms}
    Please analyze these symptoms and provide a detailed stroke risk assessment.
  `.trim();

  const formattedHistory = formatChatHistory(chatHistory);

  return strokeAssessmentChain.stream({
    input: contextualInput,
    chat_history: formattedHistory,
  });
}

/**
 * Get a structured JSON risk classification — use to save to the database
 */
export async function classifyStrokeRisk(
  symptoms: string,
): Promise<RiskAssessmentResult> {
  try {
    const result = await riskClassificationChain.invoke({ symptoms });
    return parseRiskJson(result);
  } catch (error) {
    console.error("[AI Classification Error]:", error);
    return {
      riskLevel: "MEDIUM",
      confidenceScore: 0.5,
      detectedSymptoms: [],
      fastScore: 0,
      requiresEmergency: false,
      recommendation:
        "Unable to process assessment. Please consult a doctor immediately.",
    };
  }
}

/**
 * Get recommendation copy + metadata for a given risk level
 */
export function getRiskRecommendation(riskLevel: "LOW" | "MEDIUM" | "HIGH"): {
  message: string;
  action: string;
  color: string;
  urgent: boolean;
} {
  const recommendations = {
    HIGH: {
      message:
        "⚠️ HIGH STROKE RISK DETECTED. Call emergency services (911/112) immediately. Do not drive yourself.",
      action: "CALL_EMERGENCY",
      color: "red",
      urgent: true,
    },
    MEDIUM: {
      message:
        "⚡ MEDIUM STROKE RISK. Seek urgent medical attention today. Go to the nearest emergency room.",
      action: "SEEK_URGENT_CARE",
      color: "orange",
      urgent: true,
    },
    LOW: {
      message:
        "ℹ️ LOW STROKE RISK. Monitor your symptoms and consult a doctor within 24-48 hours.",
      action: "CONSULT_DOCTOR",
      color: "green",
      urgent: false,
    },
  };

  return recommendations[riskLevel];
}
