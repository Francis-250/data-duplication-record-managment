"use client";

import { authClient } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSession() {
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw new Error(error.message);
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, 
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["session"], null);
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  return {
    session,
    isLoading,
    error,
    refetch,
    signOut: signOutMutation.mutate,
    isSigningOut: signOutMutation.isPending,
  };
}
