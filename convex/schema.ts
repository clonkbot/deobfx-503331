import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  deobfuscations: defineTable({
    userId: v.id("users"),
    originalCode: v.string(),
    deobfuscatedCode: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    obfuscationType: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    codeSize: v.number(),
    vmDetected: v.boolean(),
  }).index("by_user", ["userId"]).index("by_status", ["status"]),

  savedSnippets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    originalCode: v.string(),
    deobfuscatedCode: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
