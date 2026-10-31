import { z } from 'zod';

/** One prescription line as sent by the UI; value rules live in the database. */
export const RxItemInput = z.object({
  medication_id: z.coerce.number().int(),
  dosage: z.string().trim(),
  frequency: z.string().trim(),
  duration_days: z.coerce.number().int(),
});

export const MedicationInput = z.object({
  name: z.string().trim(),
  form: z.string().trim(),
  strength: z.string().trim().nullish(),
  drug_class: z.string().trim().nullish(),
  description: z.string().trim().nullish(),
  stock_qty: z.coerce.number().int(),
  unit_price: z.coerce.number(),
  reorder_level: z.coerce.number().int().default(50),
});

/** The text embedded for natural-language drug search. */
export function medicationText(m: { name: string; drug_class?: string | null; form: string; description?: string | null }) {
  return `${m.name} (${m.drug_class ?? 'medication'}, ${m.form}). ${m.description ?? ''}`.trim();
}

/** The text embedded for a knowledge-base condition. */
export function conditionText(c: { name: string; description: string; red_flags?: string | null }) {
  return `${c.name}. ${c.description}`;
}
