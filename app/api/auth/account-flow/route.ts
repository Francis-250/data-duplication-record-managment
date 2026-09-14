import { getServerSession } from "@/hooks/get-server-session";
import {
  completeDoctorRegistration,
  createDoctorRegistrationIntent,
  getPostLoginDestination,
  startDoctorRegistration,
} from "@/lib/auth-registration";

type AccountFlowRequest =
  | { operation: "create-doctor-intent"; email: string }
  | { operation: "start-doctor-registration"; email: string; token: string }
  | {
      operation: "complete-doctor-registration";
      token: string;
      email: string;
      specialization: string;
      hospitalName: string;
      licenseNumber: string;
      phoneNumber: string;
    }
  | { operation: "post-login-destination" };

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as AccountFlowRequest;

    switch (input.operation) {
      case "create-doctor-intent":
        return Response.json({
          token: createDoctorRegistrationIntent(input.email),
        });
      case "start-doctor-registration":
        await startDoctorRegistration(input.email, input.token);
        return Response.json({ ok: true });
      case "complete-doctor-registration":
        await completeDoctorRegistration(input);
        return Response.json({ ok: true });
      case "post-login-destination": {
        const session = await getServerSession();
        if (!session?.user) {
          return Response.json(
            { error: "Authentication required." },
            { status: 401 },
          );
        }
        return Response.json(await getPostLoginDestination(session.user));
      }
      default:
        return Response.json({ error: "Invalid operation." }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
