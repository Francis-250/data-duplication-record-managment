export function roleHome(role?: string | null) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor";
    case "patient":
      return "/patient";
    default:
      return "/";
  }
}

export function roleForPath(pathname: string) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/doctor" || pathname.startsWith("/doctor/")) return "doctor";
  if (pathname === "/patient" || pathname.startsWith("/patient/")) return "patient";
  return null;
}
