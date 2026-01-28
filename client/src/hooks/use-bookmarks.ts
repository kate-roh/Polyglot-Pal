import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertBookmark } from "@shared/schema";

export function useBookmarks() {
  return useQuery({
    queryKey: [api.bookmarks.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookmarks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return api.bookmarks.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertBookmark, "userId">) => {
      const res = await fetch(api.bookmarks.create.path, {
        method: api.bookmarks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create bookmark");
      return api.bookmarks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
    },
  });
}

// Alias for backward compatibility if needed, though useAddBookmark is what's used in components
export const useCreateBookmark = useAddBookmark;

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = api.bookmarks.delete.path.replace(":id", String(id));
      const res = await fetch(url, {
        method: api.bookmarks.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete bookmark");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
    },
  });
}
