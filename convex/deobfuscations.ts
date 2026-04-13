import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("deobfuscations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { id: v.id("deobfuscations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});

export const create = mutation({
  args: { originalCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("deobfuscations", {
      userId,
      originalCode: args.originalCode,
      status: "pending",
      createdAt: Date.now(),
      codeSize: args.originalCode.length,
      vmDetected: false,
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("deobfuscations"),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    deobfuscatedCode: v.optional(v.string()),
    obfuscationType: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    vmDetected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Not found");

    await ctx.db.patch(id, {
      ...updates,
      ...(args.status === "completed" || args.status === "failed" ? { completedAt: Date.now() } : {}),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("deobfuscations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

// Deobfuscation action that processes the code
export const deobfuscate = action({
  args: { id: v.id("deobfuscations") },
  handler: async (ctx, args) => {
    const doc = await ctx.runQuery(api.deobfuscations.get, { id: args.id });
    if (!doc) throw new Error("Document not found");

    await ctx.runMutation(api.deobfuscations.updateStatus, {
      id: args.id,
      status: "processing",
    });

    try {
      const code = doc.originalCode;

      // Detect obfuscation type
      const obfuscationType = detectObfuscationType(code);
      const vmDetected = detectVMObfuscation(code);

      // Perform deobfuscation
      const deobfuscatedCode = performDeobfuscation(code, obfuscationType, vmDetected);

      await ctx.runMutation(api.deobfuscations.updateStatus, {
        id: args.id,
        status: "completed",
        deobfuscatedCode,
        obfuscationType,
        vmDetected,
      });
    } catch (error) {
      await ctx.runMutation(api.deobfuscations.updateStatus, {
        id: args.id,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

function detectObfuscationType(code: string): string {
  const patterns = {
    "JavaScript Obfuscator": /var _0x[a-f0-9]+\s*=\s*\[/i,
    "JScrambler": /_0x[a-f0-9]+\['\\x/i,
    "Obfuscator.io": /function\s*_0x[a-f0-9]+\s*\(\s*_0x[a-f0-9]+/i,
    "Packed": /eval\(function\(p,a,c,k,e,[rd]\)/i,
    "JSFuck": /^\s*[\[\]\(\)\+\!]+$/,
    "AAEncode": /ﾟωﾟﾉ|ﾟДﾟﾉ/,
    "JJEncode": /\$=~\[\]/,
    "VM-based": /case\s+\d+\s*:\s*[a-z]+\s*=\s*[a-z]+\[[a-z]+\+\+\]/i,
    "String Array Rotation": /_0x[a-f0-9]+\['push'\]\(_0x[a-f0-9]+\['shift'\]\(\)\)/i,
    "Control Flow Flattening": /switch\s*\([a-z_$]+\[[a-z_$]+\+\+\]\)/i,
    "Hex Encoding": /\\x[0-9a-f]{2}/gi,
    "Base64": /atob\s*\(/i,
    "Unicode Escape": /\\u[0-9a-f]{4}/gi,
  };

  const detected: string[] = [];
  for (const [name, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      detected.push(name);
    }
  }

  return detected.length > 0 ? detected.join(", ") : "Unknown/Custom";
}

function detectVMObfuscation(code: string): boolean {
  const vmPatterns = [
    /while\s*\(\s*true\s*\)\s*{\s*switch/i,
    /case\s+\d+\s*:\s*[a-z]+\s*=\s*[a-z]+\[[a-z]+\+\+\]/i,
    /vm\s*\.\s*run|interpreter|bytecode/i,
    /\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/,
    /opcodes?\s*\[/i,
    /stack\s*\.\s*push|stack\s*\.\s*pop/i,
    /instruction\s*pointer|ip\s*\+\+/i,
  ];

  return vmPatterns.some(pattern => pattern.test(code));
}

function performDeobfuscation(code: string, obfuscationType: string, vmDetected: boolean): string {
  let result = code;

  // Hex string decoding
  result = result.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Unicode escape decoding
  result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Remove unnecessary escapes
  result = result.replace(/\\(['"])/g, '$1');

  // Extract and inline string arrays
  const stringArrayMatch = result.match(/var\s+(_0x[a-f0-9]+)\s*=\s*\[([\s\S]*?)\];/);
  if (stringArrayMatch) {
    const arrayName = stringArrayMatch[1];
    const arrayContent = stringArrayMatch[2];
    const strings = arrayContent.match(/'[^']*'|"[^"]*"/g) || [];
    const stringValues = strings.map(s => s.slice(1, -1));

    // Replace array accesses with actual strings
    const arrayAccessRegex = new RegExp(arrayName + '\\[(\\d+)\\]', 'g');
    result = result.replace(arrayAccessRegex, (_, index) => {
      const idx = parseInt(index);
      return stringValues[idx] !== undefined ? `'${stringValues[idx]}'` : _;
    });
  }

  // Unpack Dean Edwards packer
  if (/eval\(function\(p,a,c,k,e,[rd]\)/.test(code)) {
    const unpackedMatch = code.match(/\|([^|']+)\|/);
    if (unpackedMatch) {
      result = `// Detected Dean Edwards Packer\n// Keywords found: ${unpackedMatch[1].split('|').slice(0, 10).join(', ')}...\n\n${result}`;
    }
  }

  // Handle VM-based obfuscation
  if (vmDetected) {
    result = `// VM-based obfuscation detected\n// This code uses a virtual machine interpreter pattern\n// Manual analysis may be required for full deobfuscation\n\n${result}`;

    // Try to identify VM instruction handlers
    const caseMatches = result.match(/case\s+(\d+)\s*:/g);
    if (caseMatches && caseMatches.length > 5) {
      result = `// Found ${caseMatches.length} VM instruction handlers\n${result}`;
    }
  }

  // Clean up variable names (basic)
  let varCounter = 0;
  const varMap = new Map<string, string>();
  result = result.replace(/_0x[a-f0-9]+/g, (match) => {
    if (!varMap.has(match)) {
      varMap.set(match, `var${varCounter++}`);
    }
    return varMap.get(match)!;
  });

  // Format the code
  result = formatCode(result);

  return result;
}

function formatCode(code: string): string {
  let result = code;
  let indentLevel = 0;
  const lines: string[] = [];

  // Split by semicolons and braces
  const tokens = result.split(/([{};])/);
  let currentLine = '';

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed === '{') {
      currentLine += ' {';
      lines.push('  '.repeat(indentLevel) + currentLine.trim());
      currentLine = '';
      indentLevel++;
    } else if (trimmed === '}') {
      if (currentLine.trim()) {
        lines.push('  '.repeat(indentLevel) + currentLine.trim());
        currentLine = '';
      }
      indentLevel = Math.max(0, indentLevel - 1);
      lines.push('  '.repeat(indentLevel) + '}');
    } else if (trimmed === ';') {
      currentLine += ';';
      lines.push('  '.repeat(indentLevel) + currentLine.trim());
      currentLine = '';
    } else {
      currentLine += trimmed + ' ';
    }
  }

  if (currentLine.trim()) {
    lines.push('  '.repeat(indentLevel) + currentLine.trim());
  }

  return lines.filter(l => l.trim()).join('\n');
}
