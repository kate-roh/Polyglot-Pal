import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBookmark } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useBookmarks() {
  return useQuery({
    queryKey: [api.bookmarks.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookmarks.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return api.bookmarks.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertBookmark, "userId">) => {
      const res = await fetch(api.bookmarks.create.path, {
        method: api.bookmarks.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add bookmark");
      return api.bookmarks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
      toast({ 
        title: "Saved!", 
        description: "Added to your collection.",
        className: "border-primary/50 bg-primary/10 text-primary-foreground",
      });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bookmarks.delete.path, { id });
      const res = await fetch(url, { 
        method: api.bookmarks.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to remove bookmark");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
      toast({ title: "Removed", description: "Bookmark deleted." });
    },
  });
}
