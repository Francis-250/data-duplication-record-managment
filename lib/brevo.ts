interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ?? process.env.BREVO_EMAIL_USER;
    const senderName = process.env.BREVO_SENDER_NAME || "StrokeCheck";

    if (!apiKey) {
      console.error("Email error: BREVO_API_KEY is not configured");
      return false;
    }

    if (!senderEmail) {
      console.error("Email error: BREVO_SENDER_EMAIL is not configured");
      return false;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
      }),
    });

    const responseText = await response.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Brevo can return a non-JSON proxy response.
    }

    if (!response.ok) {
      console.error("Brevo email error:", {
        status: response.status,
        response: responseBody,
      });
      return false;
    }

    console.log("Email sent to:", to);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

export const sendEmailOrThrow = async (options: EmailOptions) => {
  const sent = await sendEmail(options);

  if (!sent) {
    throw new Error("Email delivery failed. Check the Brevo sender configuration.");
  }
};

export const sendDoctorAlertEmail = async ({
  patientName,
  assessmentId,
  riskLevel,
  confidenceScore,
}: {
  patientName: string;
  assessmentId: string;
  riskLevel: string;
  confidenceScore: number;
}) => {
  const doctorAlertEmail = process.env.DOCTOR_ALERT_EMAIL;

  if (!doctorAlertEmail) {
    console.error("Email error: DOCTOR_ALERT_EMAIL is not configured");
    return false;
  }

  return sendEmail({
    to: doctorAlertEmail,
    subject: `High-risk stroke assessment: ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>High-risk stroke assessment</h2>
        <p><strong>${patientName}</strong> submitted an assessment that requires doctor review.</p>
        <p>Risk level: <strong>${riskLevel}</strong></p>
        <p>Confidence: <strong>${Math.round(confidenceScore * 100)}%</strong></p>
        <p>Assessment ID: <strong>${assessmentId}</strong></p>
      </div>
    `,
  });
};

export const sendAssessmentResultEmail = async ({
  to,
  patientName,
  riskLevel,
  confidenceScore,
  recommendation,
}: {
  to: string;
  patientName: string;
  riskLevel: string;
  confidenceScore: number;
  recommendation: string;
}) => {
  return sendEmail({
    to,
    subject: `Your stroke assessment result: ${riskLevel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Assessment complete</h2>
        <p>Hello ${patientName},</p>
        <p>Your stroke symptom assessment has been processed.</p>
        <p>Risk level: <strong>${riskLevel}</strong></p>
        <p>Confidence: <strong>${Math.round(confidenceScore * 100)}%</strong></p>
        <p>${recommendation}</p>
        <p>This is not a medical diagnosis. Always consult a qualified healthcare professional.</p>
      </div>
    `,
  });
};
