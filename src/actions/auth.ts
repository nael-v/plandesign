"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/server/db";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type RegisterInput = z.infer<typeof registerSchema>;
type ActionResult = { error?: string };

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with that email already exists." };
    }

    const hashed = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        // Default role is "client" from the schema
      },
    });

    return {};
  } catch {
    return { error: "Could not create account. Please try again." };
  }
}
