"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import {
  classifyStrokeRisk,
  getRiskRecommendation,
  streamStrokeAssessment,
  type RiskAssessmentResult,
} from "@/lib/ai";
import {
  sendAssessmentResultEmail,
  sendDoctorAlertEmail,
} from "@/lib/brevo";
import { assertAiAssessmentAvailable } from "@/lib/ai-limits";
import { requirePatientAction } from "@/lib/patient-auth";

type CreateAssessmentInput = {
  symptoms: string[];
  symptomsText?: string;
};

const symptomLabels: Record<string, string> = {
  facial_drooping: "Facial drooping",
  arm_weakness: "Arm weakness",
  speech_difficulty: "Speech difficulty",
  blurred_vision: "Blurred vision",
  severe_headache: "Severe headache",
  dizziness: "Dizziness",
  confusion: "Confusion",
  numbness: "Numbness",
  loss_of_balance: "Loss of balance",
  nausea: "Nausea",
};

const fallbackClassification: RiskAssessmentResult = {
  riskLevel: "MEDIUM",
  confidenceScore: 0.5,
  detectedSymptoms: [],
  fastScore: 0,
  requiresEmergency: false,
  recommendation:
    "Unable to complete AI classification. Please consult a medical professional immediately.",
};

function normalizeConfidence(score: number) {
  if (!Number.isFinite(score)) return 0.5;
  return score > 1 ? Math.min(score / 100, 1) : Math.max(score, 0);
}

function buildSymptomsText(input: CreateAssessmentInput) {
  const selected = input.symptoms
    .map((symptom) => symptomLabels[symptom] ?? symptom)
    .join(", ");

  return [
    selected ? `Selected symptoms: ${selected}` : "",
    input.symptomsText?.trim()
      ? `Patient description: ${input.symptomsText.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function runFullAssessment(symptoms: string) {
  const startedAt = Date.now();

  try {
    const stream = await streamStrokeAssessment({ symptoms });
    let text = "";

    for await (const chunk of stream) {
      text += chunk;
    }

    return {
      text,
      latencyMs: Date.now() - startedAt,
      status: "SUCCESS" as const,
      errorMessage: null,
    };
  } catch (error) {
    return {
      text:
        "The AI assessment could not be completed. Based on the submitted symptoms, please seek timely medical evaluation and call emergency services for severe or sudden symptoms.",
      latencyMs: Date.now() - startedAt,
      status: "FAILED" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error",
    };
  }
}

async function runClassification(symptoms: string) {
  const startedAt = Date.now();

  try {
    const result = await classifyStrokeRisk(symptoms);

    return {
      result,
      latencyMs: Date.now() - startedAt,
      status: "SUCCESS" as const,
      errorMessage: null,
    };
  } catch (error) {
    return {
      result: fallbackClassification,
      latencyMs: Date.now() - startedAt,
      status: "FAILED" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error",
    };
  }
}

export async function createAssessment(input: CreateAssessmentInput) {
  const session = await requirePatientAction();

  await assertAiAssessmentAvailable(session.user.id);

  const symptoms = input.symptoms.filter(Boolean);
  const symptomsText = input.symptomsText?.trim() ?? "";

  if (symptoms.length === 0 && symptomsText.length === 0) {
    throw new Error("Select at least one symptom or describe what you feel.");
  }

  const requestHeaders = await headers();
  const prompt = buildSymptomsText({ symptoms, symptomsText });
  const [assessmentResult, classificationResult] = await Promise.all([
    runFullAssessment(prompt),
    runClassification(prompt),
  ]);

  const classification = classificationResult.result;
  const confidenceScore = normalizeConfidence(classification.confidenceScore);
  const recommendation =
    classification.recommendation ||
    getRiskRecommendation(classification.riskLevel).message;

  const assessment = await prisma.assessment.create({
    data: {
      userId: session.user.id,
      symptoms,
      symptomsText: symptomsText || null,
      riskLevel: classification.riskLevel,
      confidenceScore,
      detectedSymptoms: classification.detectedSymptoms,
      fastScore: classification.fastScore,
      requiresEmergency: classification.requiresEmergency,
      aiResponse: assessmentResult.text,
      recommendation,
      status: classification.riskLevel === "HIGH" ? "FLAGGED" : "COMPLETED",
      ipAddress: requestHeaders.get("x-forwarded-for"),
      userAgent: requestHeaders.get("user-agent"),
    },
  });

  await prisma.$transaction([
    prisma.aiUsageLog.create({
      data: {
        userId: session.user.id,
        assessmentId: assessment.id,
        model: "LLAMA_3_3_70B",
        callType: "STREAM_ASSESSMENT",
        status: assessmentResult.status,
        latencyMs: assessmentResult.latencyMs,
        errorMessage: assessmentResult.errorMessage,
      },
    }),
    prisma.aiUsageLog.create({
      data: {
        userId: session.user.id,
        assessmentId: assessment.id,
        model: "LLAMA_3_1_8B",
        callType: "RISK_CLASSIFICATION",
        status: classificationResult.status,
        latencyMs: classificationResult.latencyMs,
        errorMessage: classificationResult.errorMessage,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSESSMENT_CREATED",
        entity: "Assessment",
        entityId: assessment.id,
        description: `Patient created a ${classification.riskLevel.toLowerCase()} risk assessment.`,
        metadata: {
          riskLevel: classification.riskLevel,
          confidenceScore,
          fastScore: classification.fastScore,
        },
        ipAddress: requestHeaders.get("x-forwarded-for"),
        userAgent: requestHeaders.get("user-agent"),
      },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        assessmentId: assessment.id,
        type: "ASSESSMENT_RESULT",
        title: "Assessment complete",
        message: `Your assessment result is ${classification.riskLevel.toLowerCase()} risk with ${Math.round(confidenceScore * 100)}% confidence.`,
      },
    }),
    ...(classification.riskLevel === "HIGH"
      ? [
          prisma.notification.create({
            data: {
              userId: session.user.id,
              assessmentId: assessment.id,
              type: "HIGH_RISK_ALERT" as const,
              title: "High risk detected",
              message:
                "Your symptoms indicate high stroke risk. Call emergency services immediately and do not drive yourself.",
            },
          }),
        ]
      : []),
  ]);

  if (classification.riskLevel === "HIGH") {
    await Promise.all([
      sendDoctorAlertEmail({
        patientName: session.user.name,
        assessmentId: assessment.id,
        riskLevel: classification.riskLevel,
        confidenceScore,
      }),
      sendAssessmentResultEmail({
        to: session.user.email,
        patientName: session.user.name,
        riskLevel: classification.riskLevel,
        confidenceScore,
        recommendation,
      }),
    ]);
  }

  revalidatePath("/patient");
  revalidatePath("/patient/notifications");
  revalidatePath(`/patient/assessment/${assessment.id}`);

  return { assessmentId: assessment.id };
}
