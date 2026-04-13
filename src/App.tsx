import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">DEOBFX</span>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">
            {flow === "signIn" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            {flow === "signIn"
              ? "Sign in to access the deobfuscator"
              : "Sign up to start deobfuscating code"}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-sm"
                placeholder="••••••••"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold py-3 rounded-lg hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                flow === "signIn" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#222222]">
            <button
              onClick={() => signIn("anonymous")}
              className="w-full bg-[#1a1a1a] border border-[#333333] text-gray-300 py-3 rounded-lg hover:bg-[#222222] hover:border-[#444444] transition-all text-sm"
            >
              Continue as Guest
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function DeobfuscatorApp() {
  const { signOut } = useAuthActions();
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "history" | "saved">("new");
  const [selectedResult, setSelectedResult] = useState<Id<"deobfuscations"> | null>(null);

  const history = useQuery(api.deobfuscations.list) ?? [];
  const savedSnippets = useQuery(api.snippets.list) ?? [];
  const selectedDoc = useQuery(api.deobfuscations.get, selectedResult ? { id: selectedResult } : "skip");

  const createDeobfuscation = useMutation(api.deobfuscations.create);
  const runDeobfuscation = useAction(api.deobfuscations.deobfuscate);
  const removeDeobfuscation = useMutation(api.deobfuscations.remove);
  const saveSnippet = useMutation(api.snippets.save);
  const removeSnippet = useMutation(api.snippets.remove);

  const [processing, setProcessing] = useState(false);

  const handleDeobfuscate = async () => {
    if (!code.trim()) return;
    setProcessing(true);
    try {
      const id = await createDeobfuscation({ originalCode: code });
      setSelectedResult(id);
      await runDeobfuscation({ id });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoc?.deobfuscatedCode) return;
    const name = prompt("Enter a name for this snippet:", `Snippet ${new Date().toLocaleDateString()}`);
    if (name) {
      await saveSnippet({
        name,
        originalCode: selectedDoc.originalCode,
        deobfuscatedCode: selectedDoc.deobfuscatedCode,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
      </div>

      {/* Header */}
      <header className="relative border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">DEOBFX</h1>
                <p className="text-xs text-gray-500 hidden sm:block">JavaScript Deobfuscator</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">VM Support Active</span>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 sm:px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-gray-400 hover:text-white hover:border-[#444444] transition-all text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#111111] rounded-xl mb-6 sm:mb-8 w-fit">
          {[
            { id: "new" as const, label: "New", icon: "M12 4v16m8-8H4" },
            { id: "history" as const, label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: "saved" as const, label: "Saved", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Input Panel */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#222222]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-sm text-gray-500 font-mono">obfuscated.js</span>
                </div>
                <span className="text-xs text-gray-600 font-mono hidden sm:block">{code.length} chars</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your obfuscated JavaScript here...&#10;&#10;var _0x4b2c=['log','Hello\x20World'];(function(_0x3d7c8e,_0x4b2c1d){...})"
                className="w-full h-64 sm:h-80 p-4 sm:p-6 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none placeholder-gray-600"
                spellCheck={false}
              />
              <div className="px-4 sm:px-6 py-4 border-t border-[#222222] flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeobfuscate}
                  disabled={!code.trim() || processing}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold py-3 rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Deobfuscate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setCode("")}
                  className="px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-gray-400 hover:text-white hover:border-[#444444] transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#222222]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-sm text-gray-500 font-mono">deobfuscated.js</span>
                </div>
                {selectedDoc?.status === "completed" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedDoc.deobfuscatedCode || "")}
                      className="p-2 hover:bg-[#222222] rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleSave}
                      className="p-2 hover:bg-[#222222] rounded-lg transition-colors"
                      title="Save snippet"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="h-64 sm:h-80 overflow-auto">
                {!selectedDoc && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 p-4">
                    <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-center">Deobfuscated code will appear here</p>
                  </div>
                )}

                {selectedDoc?.status === "processing" && (
                  <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                    </div>
                    <p className="text-emerald-400 font-medium">Analyzing code...</p>
                    <p className="text-xs text-gray-500 mt-1">Detecting obfuscation patterns</p>
                  </div>
                )}

                {selectedDoc?.status === "completed" && (
                  <div className="p-4 sm:p-6">
                    {selectedDoc.vmDetected && (
                      <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-amber-400 font-medium text-sm">VM-based obfuscation detected</p>
                          <p className="text-amber-400/70 text-xs mt-1">This code uses a virtual machine interpreter. Manual analysis may be required.</p>
                        </div>
                      </div>
                    )}

                    {selectedDoc.obfuscationType && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {selectedDoc.obfuscationType.split(", ").map((type: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-400 font-medium">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap break-all">
                      {selectedDoc.deobfuscatedCode}
                    </pre>
                  </div>
                )}

                {selectedDoc?.status === "failed" && (
                  <div className="h-full flex flex-col items-center justify-center text-red-400 p-4">
                    <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Deobfuscation failed</p>
                    <p className="text-sm text-red-400/70 mt-1 text-center">{selectedDoc.errorMessage || "Unknown error occurred"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No history yet</p>
                <p className="text-sm mt-1">Your deobfuscation history will appear here</p>
              </div>
            ) : (
              history.map((item: typeof history[number]) => (
                <HistoryItem
                  key={item._id}
                  item={item}
                  onSelect={() => {
                    setSelectedResult(item._id);
                    setActiveTab("new");
                  }}
                  onDelete={() => removeDeobfuscation({ id: item._id })}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedSnippets.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <p className="text-lg font-medium">No saved snippets</p>
                <p className="text-sm mt-1">Save your deobfuscated code for later</p>
              </div>
            ) : (
              savedSnippets.map((snippet: typeof savedSnippets[number]) => (
                <SavedSnippetItem
                  key={snippet._id}
                  snippet={snippet}
                  onLoad={() => {
                    setCode(snippet.originalCode);
                    setActiveTab("new");
                  }}
                  onDelete={() => removeSnippet({ id: snippet._id })}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-[#1a1a1a] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-600 font-mono">
            Requested by @web-user · Built by @clonkbot
          </p>
        </div>
      </footer>
    </div>
  );
}

function HistoryItem({
  item,
  onSelect,
  onDelete,
}: {
  item: {
    _id: Id<"deobfuscations">;
    status: "pending" | "processing" | "completed" | "failed";
    originalCode: string;
    obfuscationType?: string;
    vmDetected: boolean;
    createdAt: number;
    codeSize: number;
  };
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 sm:p-6 hover:border-[#333333] transition-all group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.status === "completed"
                ? "bg-emerald-500/20 text-emerald-400"
                : item.status === "failed"
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {item.status}
            </span>
            {item.vmDetected && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                VM
              </span>
            )}
            <span className="text-xs text-gray-500 font-mono">{item.codeSize} chars</span>
          </div>
          <p className="text-gray-400 text-sm font-mono truncate">
            {item.originalCode.slice(0, 100)}...
          </p>
          {item.obfuscationType && (
            <p className="text-xs text-gray-600 mt-2">{item.obfuscationType}</p>
          )}
          <p className="text-xs text-gray-600 mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onSelect}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm text-gray-300 hover:text-white hover:border-emerald-500/50 transition-all"
          >
            View
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedSnippetItem({
  snippet,
  onLoad,
  onDelete,
}: {
  snippet: {
    _id: Id<"savedSnippets">;
    name: string;
    originalCode: string;
    deobfuscatedCode: string;
    createdAt: number;
  };
  onLoad: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 sm:p-6 hover:border-[#333333] transition-all group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium mb-1">{snippet.name}</h3>
          <p className="text-gray-400 text-sm font-mono truncate">
            {snippet.deobfuscatedCode.slice(0, 80)}...
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {new Date(snippet.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onLoad}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm text-gray-300 hover:text-white hover:border-emerald-500/50 transition-all"
          >
            Load
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <DeobfuscatorApp />;
}
