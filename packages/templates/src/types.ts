export interface ThemeConfig {
  colorPrimary: string;
  colorAccent: string;
  colorBg: string;
  colorText: string;
  fontHeading: string;
  fontBody: string;
  radius: string;
  pattern: string;
}

export interface InvitationData {
  id: string;
  slug: string;
  status: string;
  templateId: string;
  theme: ThemeConfig;
  locale: string;
  religion: string;
  isPrivate: boolean;
  pin?: string | null;
  musicUrl?: string | null;
  coverImageUrl?: string | null;
}

export interface CoupleData {
  groomFullName: string;
  groomNickname: string;
  groomChildOrder?: string | null;
  groomFather?: string | null;
  groomMother?: string | null;
  groomPhotoUrl?: string | null;
  groomInstagram?: string | null;
  brideFullName: string;
  brideNickname: string;
  brideChildOrder?: string | null;
  brideFather?: string | null;
  brideMother?: string | null;
  bridePhotoUrl?: string | null;
  brideInstagram?: string | null;
  orderDisplay: "groom_first" | "bride_first";
}

export interface EventData {
  id: string;
  type: string;
  title: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string;
  mapsUrl?: string | null;
  mapsEmbed?: string | null;
  livestreamUrl?: string | null;
  dressCode?: string | null;
  note?: string | null;
}

export interface StoryData {
  id: string;
  date: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  orderIndex: number;
}

export interface GalleryItemData {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  orderIndex: number;
  layoutHint: string;
}

export interface GiftData {
  id: string;
  type: string; // bank, ewallet, qris_static, physical_address
  label: string;
  accountName: string;
  accountNumber: string;
  qrisImageUrl?: string | null;
  addressText?: string | null;
  orderIndex: number;
}

export interface WishData {
  id: string;
  name: string;
  message: string;
  likes: number;
  createdAt: string | Date;
}

export interface TemplateProps {
  invitation: InvitationData;
  couple: CoupleData;
  events: EventData[];
  stories: StoryData[];
  gallery: GalleryItemData[];
  gifts: GiftData[];
  wishes: WishData[];
  guestName?: string;
  guestToken?: string;
  onRsvpSubmit: (data: { name: string; attendance: "yes" | "no" | "maybe"; headcount: number; message?: string }) => Promise<{ success: boolean; message?: string }>;
  onWishSubmit: (data: { name: string; message: string }) => Promise<{ success: boolean; newWish?: WishData; message?: string }>;
  onLikeWish?: (wishId: string) => Promise<void>;
  onGiftCheckout: (data: { amount: number; senderName: string; message?: string; giftId: string }) => Promise<{ success: boolean; checkoutUrl?: string; transactionId?: string; message?: string }>;
  isDemo?: boolean;
  showWatermark?: boolean;
}
