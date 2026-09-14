import prisma from "@/lib/prisma";

export const GLOBAL_AI_DAILY_LIMIT_KEY = "ai.dailyAssessmentLimit";
export const DEFAULT_AI_DAILY_LIMIT = 5;

function parseLimit(value?: string | null) {
  if (value === "-1") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_AI_DAILY_LIMIT;
}

export async function getAiDailyLimit(userId: string) {
  const [user, setting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { aiDailyAssessmentLimit: true },
    }),
    prisma.systemSetting.findUnique({
      where: { key: GLOBAL_AI_DAILY_LIMIT_KEY },
      select: { value: true },
    }),
  ]);

  return user?.aiDailyAssessmentLimit ?? parseLimit(setting?.value);
}

export async function assertAiAssessmentAvailable(userId: string) {
  const limit = await getAiDailyLimit(userId);
  if (limit === null) return;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const used = await prisma.assessment.count({
    where: { userId, createdAt: { gte: startOfDay } },
  });

  if (used >= limit) {
    throw new Error(
      limit === 0
        ? "AI assessments are disabled for your account."
        : `You reached your daily AI assessment limit of ${limit}. Try again tomorrow.`,
    );
  }
}
