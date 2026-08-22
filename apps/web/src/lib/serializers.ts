export interface RawInvitation {
  id: string;
  slug: string;
  status: string;
  templateId: string;
  theme: any;
  locale: string;
  religion: string;
  isPrivate: boolean;
  pin?: string | null;
  musicUrl?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: Date | null;
}

export interface RawEvent {
  id: string;
  invitationId: string;
  type: string;
  title: string;
  startAt: Date;
  endAt: Date;
  venueName: string;
  venueAddress: string;
  mapsUrl?: string | null;
  mapsEmbed?: string | null;
  livestreamUrl?: string | null;
  dressCode?: string | null;
  note?: string | null;
}

export interface RawWish {
  id: string;
  name: string;
  message: string;
  likes: number;
  createdAt: Date;
  isApproved?: boolean;
}

export function serializeInvitationPayload(params: {
  invite: RawInvitation;
  events: RawEvent[];
  wishes: RawWish[];
}) {
  const publicInvitation = {
    id: params.invite.id,
    slug: params.invite.slug,
    status: params.invite.status,
    templateId: params.invite.templateId,
    theme: params.invite.theme,
    locale: params.invite.locale,
    religion: params.invite.religion,
    isPrivate: params.invite.isPrivate,
    musicUrl: params.invite.musicUrl,
    coverImageUrl: params.invite.coverImageUrl,
  };

  const serializedEvents = params.events.map((e) => ({
    ...e,
    startAt: e.startAt instanceof Date ? e.startAt.toISOString() : String(e.startAt),
    endAt: e.endAt instanceof Date ? e.endAt.toISOString() : String(e.endAt),
  }));

  const serializedWishes = params.wishes.map((w) => ({
    ...w,
    createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : String(w.createdAt),
  }));

  return {
    publicInvitation,
    serializedEvents,
    serializedWishes,
  };
}
