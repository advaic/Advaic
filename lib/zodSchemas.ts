import { z } from "zod";

export const keyInfoSchema = z.object({
  employer: z.string().optional(),
  income: z.string().optional(),
  contract_type: z.string().optional(),
  schufa: z.string().optional(),
  employment_since: z.string().optional(),
});

export type KeyInfo = z.infer<typeof keyInfoSchema>;
