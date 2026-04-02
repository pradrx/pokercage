import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { prisma } from "@/lib/prisma";

// ~22M unique combinations (1202 adjectives x 52 colors x 355 animals)
export function generateGameSlug(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "",
    style: "lowerCase",
  });
}

export async function generateUniqueGameSlug(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = generateGameSlug();
    const existing = await prisma.game.findUnique({ where: { slug } });
    if (!existing) return slug;
  }
  throw new Error("Failed to generate unique slug after 5 attempts");
}

export function generateInviteSlug(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "",
    style: "lowerCase",
  });
}

export async function generateUniqueInviteSlug(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = generateInviteSlug();
    const existing = await prisma.groupInvite.findFirst({
      where: { code: slug },
    });
    if (!existing) return slug;
  }
  throw new Error("Failed to generate unique invite slug after 5 attempts");
}
