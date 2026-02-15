import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type MediaAsset = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string | null;
};

export function useMediaLibrary() {
  return useQuery({
    queryKey: ["/api/media"],
    queryFn: async (): Promise<{ items: MediaAsset[] }> => {
      const res = await fetch("/api/media", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to load media library");
      }
      return res.json();
    },
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { file: File; idempotencyKey?: string }): Promise<{ asset: MediaAsset }> => {
      const fd = new FormData();
      fd.append("file", vars.file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: vars.idempotencyKey ? { "Idempotency-Key": vars.idempotencyKey } : undefined,
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media"] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ ok: boolean }> => {
      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Delete failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media"] });
    },
  });
}
