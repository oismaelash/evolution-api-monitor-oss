import { z } from 'zod';

export const ossAccessSetupSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ossAccessVerifySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type OssAccessSetupInput = z.infer<typeof ossAccessSetupSchema>;
export type OssAccessVerifyInput = z.infer<typeof ossAccessVerifySchema>;
