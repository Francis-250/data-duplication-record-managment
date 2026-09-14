import { getServerSession } from "@/hooks/get-server-session";
import { getPostLoginDestination, setUserInitialRole } from "@/lib/auth-registration";

type AccountFlowRequest =
  | { operation: "set-initial-role"; role: "STUDENT" | "REGISTRY_STAFF" }
  | { operation: "post-login-destination" };

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as AccountFlowRequest;

    switch (input.operation) {
      case "set-initial-role": {
        const session = await getServerSession();
        if (!session?.user) {
          return Response.json({ error: "Authentication required." }, { status: 401 });
        }
        await setUserInitialRole(session.user.id, input.role);
        return Response.json({ ok: true });
      }
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
