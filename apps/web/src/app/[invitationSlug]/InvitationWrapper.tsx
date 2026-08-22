"use client";

import React, { useState } from "react";
import { submitRsvpAction } from "./actions";
import { ClassicGold, ModernMinimal, RomanticBlush } from "templates";

interface InvitationWrapperProps {
  invitation: any;
  couple: any;
  events: any[];
  stories: any[];
  gallery: any[];
  gifts: any[];
  wishes: any[];
  guestName?: string;
  guestToken?: string;
  guestId?: string;
  showWatermark?: boolean;
}

export function InvitationWrapper({
  invitation,
  couple,
  events,
  stories,
  gallery,
  gifts,
  wishes: initialWishes,
  guestName,
  guestToken,
  guestId,
  showWatermark = false
}: InvitationWrapperProps) {
  const [wishesList, setWishesList] = useState<any[]>(initialWishes);

  // 1. Submit RSVP handler
  const handleRsvpSubmit = async (data: { 
    name: string;
    attendance: "yes" | "no" | "maybe"; 
    headcount: number; 
    message?: string 
  }) => {
    const res = await submitRsvpAction({
      submissionType: "rsvp",
      invitationId: invitation.id,
      guestId: guestId || null,
      guestToken: guestToken || null,
      name: data.name,
      attendance: data.attendance,
      headcount: data.headcount,
      message: data.message || null
    });

    if (res && res.error) {
      return { success: false, message: res.error };
    }

    return { success: true };
  };

  // 2. Submit Wish only handler
  const handleWishSubmit = async (data: { name: string; message: string }) => {
    const res = await submitRsvpAction({
      submissionType: "wish",
      invitationId: invitation.id,
      guestId: guestId || null,
      guestToken: guestToken || null,
      name: data.name,
      attendance: "maybe",
      headcount: 1,
      message: data.message
    });

    if (res && res.error) {
      return { success: false, message: res.error };
    }

    return { success: true };
  };

  // 3. Like wish helper
  const handleLikeWish = async (wishId: string) => {
    // Increment likes locally for responsive click feel
    setWishesList(prev => prev.map(w => w.id === wishId ? { ...w, likes: w.likes + 1 } : w));
  };

  // 4. Gift envelope checkout handler
  const handleGiftCheckout = async (data: {
    amount: number;
    senderName: string;
    message?: string;
    giftId: string;
  }) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invitationId: invitation.id,
          guestId: guestId || null,
          guestToken: guestToken || null,
          amount: data.amount,
          senderName: data.senderName,
          message: data.message || "",
          method: "qris" // default to QRIS mock checkout
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        return { success: false, message: errData.error || "Gagal membuat transaksi checkout." };
      }

      const txData = await response.json();
      
      return {
        success: true,
        transactionId: txData.transactionId,
        checkoutUrl: `/checkout/${txData.transactionId}?token=${encodeURIComponent(txData.checkoutToken)}`,
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Terjadi kesalahan koneksi internet." };
    }
  };

  // Choose visual template component
  const themeId = invitation.templateId || "classic-gold";
  let TemplateComponent = ClassicGold;

  if (themeId === "modern-minimal") {
    TemplateComponent = ModernMinimal;
  } else if (themeId === "romantic-blush") {
    TemplateComponent = RomanticBlush;
  }

  return (
    <TemplateComponent 
      invitation={invitation}
      couple={couple}
      events={events}
      stories={stories}
      gallery={gallery}
      gifts={gifts}
      wishes={wishesList}
      guestName={guestName}
      guestToken={guestToken}
      onRsvpSubmit={handleRsvpSubmit}
      onWishSubmit={handleWishSubmit}
      onLikeWish={handleLikeWish}
      onGiftCheckout={handleGiftCheckout}
      showWatermark={showWatermark}
    />
  );
}
