import { z } from 'zod';

const FacebookUserLocationSchema = z.object({
  country: z.string(),
  city: z.string(),
});

const FacebookUserSchema = z.object({
  userId: z.string(),
  name: z.string(),
  age: z.number(),
  gender: z.enum(['male', 'female', 'non-binary']),
  location: FacebookUserLocationSchema,
});

const FacebookEngagementTopSchema = z.object({
  actionTime: z.string(),
  referrer: z.enum(['newsfeed', 'marketplace', 'groups']),
  videoId: z.string().nullable(),
});

const FacebookEngagementBottomSchema = z.object({
  adId: z.string(),
  campaignId: z.string(),
  clickPosition: z.enum(['top_left', 'bottom_right', 'center']),
  device: z.enum(['mobile', 'desktop']),
  browser: z.enum(['Chrome', 'Firefox', 'Safari']),
  purchaseAmount: z.string().nullable(),
});

const FacebookEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string(),
  source: z.literal('facebook'),
  funnelStage: z.enum(['top', 'bottom']),
  eventType: z.enum(['ad.view', 'page.like', 'comment', 'video.view', 'ad.click', 'form.submission', 'checkout.complete']),
  data: z.object({
    user: FacebookUserSchema,
    engagement: z.union([FacebookEngagementTopSchema, FacebookEngagementBottomSchema]),
  }),
});

const TiktokUserSchema = z.object({
  userId: z.string(),
  username: z.string(),
  followers: z.number(),
});

const TiktokEngagementTopSchema = z.object({
  watchTime: z.number(),
  percentageWatched: z.number(),
  device: z.enum(['Android', 'iOS', 'Desktop']),
  country: z.string(),
  videoId: z.string(),
});

const TiktokEngagementBottomSchema = z.object({
  actionTime: z.string(),
  profileId: z.string().nullable(),
  purchasedItem: z.string().nullable(),
  purchaseAmount: z.string().nullable(),
});

const TiktokEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string(),
  source: z.literal('tiktok'),
  funnelStage: z.enum(['top', 'bottom']),
  eventType: z.enum(['video.view', 'like', 'share', 'comment', 'profile.visit', 'purchase', 'follow']),
  data: z.object({
    user: TiktokUserSchema,
    engagement: z.union([TiktokEngagementTopSchema, TiktokEngagementBottomSchema]),
  }),
});

export const EventSchema = z.union([FacebookEventSchema, TiktokEventSchema]);