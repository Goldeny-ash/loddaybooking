import { z } from "zod";

export const PublicBusinessSchema = z.object({
  _id: z.string(),
  name: z.string(),
  username: z.string(),
  logo: z.string().nullable().optional(),

  bookingRules: z.object({
    autoApprove: z.boolean().optional(),
  }).optional(),

  location: z.object({
    area: z.string().optional(),
    city: z.string().optional(),
  }).optional(),

  workingHours: z.any().optional(),

  access: z.object({
    status: z.enum(["ACTIVE","TRIAL","GRACE","EXPIRED","INACTIVE"]),
  }),

  subscriptionExpiresAt: z.date().nullable().optional(),

  theme: z.any().optional(),
});

export const PublicServiceSchema = z.object({
  _id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  price: z.number().optional(),
  gallery: z.array(z.string()).optional(),
  category: z.string().optional(),
  featured: z.boolean().optional(),
  depositOverride: z.any().optional(),
});

export type PublicBusiness = z.infer<typeof PublicBusinessSchema>;
export type PublicService = z.infer<typeof PublicServiceSchema>;
