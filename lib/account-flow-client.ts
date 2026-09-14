type AccountFlowInput =
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

export async function accountFlow<T>(input: AccountFlowInput): Promise<T> {
  const response = await fetch("/api/auth/account-flow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Request failed.");
  return result;
}
