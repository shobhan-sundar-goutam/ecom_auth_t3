import { object, string } from "zod";

export const registerSchema = object({
  name: string({ required_error: "Name is Required" }).min(
    1,
    "Name is Required",
  ),
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid Email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters"),
  confirmPassword: string({
    required_error: "Please confirm your password",
  }).min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export const loginSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email or password"),
  password: string({ required_error: "Password is required" }).min(
    1,
    "Password is required",
  ),
});

export const verifyEmailSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email or password"),
  verifyCode: string({ required_error: "Verification code is required" }).min(
    8,
    "Verification code is required",
  ),
});
