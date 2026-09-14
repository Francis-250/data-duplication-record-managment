"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ThemeToggle";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DashboardHeaderProps {
  title?: string;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function DashboardHeader({ title, user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const getRoleBadgeVariant = (role?: string | null) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "destructive";
      case "REGISTRY_STAFF":
        return "default";
      case "STUDENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  const initials = (user.name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold tracking-tight sm:text-base">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user.role && (
          <Badge variant={getRoleBadgeVariant(user.role)} className="text-[11px] font-medium tracking-wide">
            {user.role.replace("_", " ")}
          </Badge>
        )}

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border">
              <span className="text-xs font-semibold text-foreground">
                {initials}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
