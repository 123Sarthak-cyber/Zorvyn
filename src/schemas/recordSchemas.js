import { z } from "zod";
import { RECORD_TYPE_LIST } from "../constants/recordTypes.js";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createRecordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(RECORD_TYPE_LIST),
  category: z.string().trim().min(2).max(100),
  date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  notes: z.string().trim().max(500).optional().nullable()
});

export const updateRecordSchema = z
  .object({
    amount: z.number().positive().optional(),
    type: z.enum(RECORD_TYPE_LIST).optional(),
    category: z.string().trim().min(2).max(100).optional(),
    date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format").optional(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });

export const recordFilterSchema = z.object({
  type: z.enum(RECORD_TYPE_LIST).optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});
