export function roleHome(role?: string | null) {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin";
    case "REGISTRY_STAFF":
      return "/registry";
    case "STUDENT":
      return "/student";
    default:
      return "/";
  }
}

export function roleForPath(pathname: string): "ADMIN" | "REGISTRY_STAFF" | "STUDENT" | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "ADMIN";
  if (pathname === "/registry" || pathname.startsWith("/registry/")) return "REGISTRY_STAFF";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "STUDENT";
  return null;
}

