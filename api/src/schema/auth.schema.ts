import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be more than 2 chars")
    .max(200, "Name must be less than 200 chars"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email")
    .max(255, "Email is too long"),

  password: z
    .string()
    .trim()
    .min(6, "Password must be atleast 6 characters long")
    .max(15, "Password can be maximum of size 15")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

export const verifySignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email")
    .max(255, "Email is too long"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email")
    .max(255, "Email is too long"),

  password: z
    .string()
    .trim()
    .min(6, "Password must be atleast 6 characters long")
    .max(15, "Password can be maximum of size 15")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

export type signupSchemaType = z.infer<typeof signupSchema>;
export type verifySignUpSchemaType = z.infer<typeof verifySignupSchema>;
export type loginSchemaType = z.infer<typeof loginSchema>;
