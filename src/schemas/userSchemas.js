import { z } from "zod";
import { ROLE_LIST } from "../constants/roles.js";

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  role: z.enum(ROLE_LIST),
  isActive: z.boolean().optional()
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().optional(),
    role: z.enum(ROLE_LIST).optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });
