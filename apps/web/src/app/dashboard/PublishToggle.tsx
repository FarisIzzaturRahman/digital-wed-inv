"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, EyeOff, Loader2 } from "lucide-react";

async function togglePublishAction(invitationId: string, newStatus: "published" | "draft") {
  const res = await fetch("/api/invite/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invitationId, status: newStatus }),
  });
  return res.ok;
}

export function PublishToggle({
  invitationId,
  currentStatus,
}: {
  invitationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isPublished = currentStatus === "published";

  const handleToggle = async () => {
    const newStatus = isPublished ? "draft" : "published";
    if (
      !confirm(
        isPublished
          ? "Sembunyikan undangan dari publik? Tamu tidak dapat membuka link undangan."
          : "Publikasikan undangan agar dapat diakses tamu secara online?"
      )
    )
      return;

    setLoading(true);
    const ok = await togglePublishAction(invitationId, newStatus);
    setLoading(false);
    if (ok) router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-5 py-2.5 text-xs font-bold rounded-xl transition shadow-md inline-flex items-center justify-center gap-1.5 ${
        isPublished
          ? "bg-amber-500 hover:bg-amber-600 text-white"
          : "bg-emerald-500 hover:bg-emerald-600 text-white"
      } disabled:opacity-60`}
    >
      {loading ? (
        <>
          <Loader2 size={13} className="animate-spin" />
          <span>Memproses...</span>
        </>
      ) : isPublished ? (
        <>
          <EyeOff size={13} />
          <span>Unpublish</span>
        </>
      ) : (
        <>
          <Globe size={13} />
          <span>Publikasikan</span>
        </>
      )}
    </button>
  );
}
