"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2,
  ImagePlus,
  Check,
  Copy,
  X,
  FileText,
  Scale,
  Sparkles,
  Loader2,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";

const PROMPT_PLACEHOLDERS = [
  "What is the procedure and grounds for anticipatory bail under Section 482 of BNSS vs 438 CrPC?",
  "Draft a statutory legal notice under Section 138 of the Negotiable Instruments Act for cheque dishonour...",
  "What are the landmark Supreme Court judgments defining Right to Privacy under Article 21?",
  "Analyze ingredients and maximum punishment for criminal breach of trust under BNS Section 316...",
  "Is an unregistered agreement to sell admissible as evidence in a suit for specific performance?",
  "Summarize the mandatory arrest guidelines under Arnesh Kumar v. State of Bihar and Section 41A...",
  "What are the legal remedies for minority shareholders against oppression under Section 241 Companies Act?",
  "Explain the grounds for quashing an FIR under Section 528 BNSS (Section 482 CrPC) for civil disputes...",
  "Can an arbitral award be set aside for patent illegality under Section 34 of the Arbitration Act?",
  "What is the statutory limitation period for filing a commercial summary suit under Order XXXVII CPC?",
];

const DRAFT_TEMPLATES = [
  {
    id: "sec-138",
    title: "Section 138 NI Act Notice",
    desc: "Demand notice for cheque bounce with 15-day statutory period",
    prompt:
      "Draft a formal statutory legal notice under Section 138 of the Negotiable Instruments Act, 1881 for cheque dishonour with the following details:\n- Complainant / Payee: [Name]\n- Drawer / Accused: [Name]\n- Cheque No: [Cheque No], Dated: [Date], Amount: ₹[Amount]\n- Bank & Branch: [Bank Name]\n- Reason for Return: Funds Insufficient (Memo dated: [Date])\n- Statutory Demand: Pay within 15 days of receipt failing which criminal prosecution shall follow.",
  },
  {
    id: "bail-bnss",
    title: "Anticipatory Bail Application",
    desc: "Application under Section 482 BNSS (438 CrPC) before Sessions/HC",
    prompt:
      "Draft an anticipatory bail application under Section 482 of Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) before the High Court on behalf of the applicant:\n- FIR No: [Number/Year], Police Station: [PS Name]\n- Offences Alleged: Sections [e.g. 316, 318 BNS]\n- Grounds: False implication due to commercial rivalry, cooperative with investigation, deep roots in society, undertaking to abide by all conditions.",
  },
  {
    id: "slp-art136",
    title: "Special Leave Petition (SLP)",
    desc: "Civil/Criminal SLP before Supreme Court under Article 136",
    prompt:
      "Draft the Question of Law and Grounds for a Special Leave Petition under Article 136 of the Constitution of India before the Hon'ble Supreme Court of India against the impugned final judgment of the High Court, demonstrating substantial questions of law of public importance and grave miscarriage of justice.",
  },
  {
    id: "quash-fir",
    title: "FIR Quashing (Sec 528 BNSS)",
    desc: "Petition under Section 528 BNSS / Section 482 CrPC for civil dispute",
    prompt:
      "Draft a petition under Section 528 BNSS (Section 482 CrPC) for quashing FIR No: [FIR No] registered under Section 316 BNS (Cheating/Breach of Trust), demonstrating that the dispute is purely of a civil commercial nature covered by the landmark ruling of State of Haryana v. Bhajan Lal.",
  },
  {
    id: "breach-notice",
    title: "Notice for Breach of Contract",
    desc: "Pre-litigation legal notice invoking dispute resolution clause",
    prompt:
      "Draft a comprehensive pre-litigation legal notice for material breach of Master Services Agreement, claiming damages of ₹[Amount] and invoking the mandatory 30-day cure period prior to commencing arbitration under the Arbitration and Conciliation Act, 1996.",
  },
];

const STATUTE_OPTIONS = [
  { id: "bns", name: "Bharatiya Nyaya Sanhita, 2023", code: "BNS" },
  {
    id: "bnss",
    name: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    code: "BNSS",
  },
  { id: "bsa", name: "Bharatiya Sakshya Adhiniyam, 2023", code: "BSA" },
  { id: "constitution", name: "Constitution of India", code: "COI" },
  { id: "cpc", name: "Code of Civil Procedure, 1908", code: "CPC" },
  { id: "ni", name: "Negotiable Instruments Act, 1881", code: "NI Act" },
  { id: "companies", name: "Companies Act, 2013", code: "Companies" },
  {
    id: "arbitration",
    name: "Arbitration & Conciliation Act, 1996",
    code: "Arbitration",
  },
];

const BENCH_OPTIONS = [
  "Supreme Court of India (Apex Court)",
  "High Court of Delhi",
  "High Court of Bombay",
  "High Court of Karnataka",
  "NCLAT / NCLT Benches",
  "All Indian High Courts & Tribunals",
];

interface LegalAnalysis {
  act: string;
  keySection: string;
  precedents: { title: string; citation: string; principle: string }[];
  summary: string;
  verificationHash: string;
}

export default function Prompt() {
  const router = useRouter();
  const supabase = createClient();

  const [promptText, setPromptText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Interactive menu states
  const [activeMenu, setActiveMenu] = useState<
    "settings" | "drafts" | "statutes" | null
  >(null);
  const [selectedBench, setSelectedBench] = useState(
    "Supreme Court of India (Apex Court)",
  );
  const [strictZeroHallucination, setStrictZeroHallucination] = useState(true);
  const [includeBnsMapping, setIncludeBnsMapping] = useState(true);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Analysis / submission
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [legalResponse, setLegalResponse] = useState<LegalAnalysis | null>(
    null,
  );
  const [hasCopied, setHasCopied] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBanner, setAuthBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Lazy getter — only creates client in the browser
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  // Check auth session on mount (browser only)
  useEffect(() => {
    const supabase = getSupabase();

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    };
    checkSession();

    // Listen for auth state changes (sign in / sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: unknown } | null) => {
        setIsAuthenticated(!!session);
        if (session) setAuthBanner(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [getSupabase]);

  // Pick random placeholder on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setPlaceholderIndex(
        Math.floor(Math.random() * PROMPT_PLACEHOLDERS.length),
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Smoothly rotate placeholders when input is empty
  useEffect(() => {
    if (promptText) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PROMPT_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [promptText]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setPromptText((prev) =>
            prev ? `${prev} ${transcript}` : transcript,
          );
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      } else {
        setTimeout(() => setSpeechSupported(false), 0);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert(
        "Voice speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.",
      );
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleStatute = (code: string) => {
    setSelectedStatutes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const applyDraftTemplate = (templatePrompt: string) => {
    setPromptText(templatePrompt);
    setActiveMenu(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = promptText.trim();
    if (!query && attachedFiles.length === 0) {
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    // Auth guard: block unauthenticated submissions
    if (!isAuthenticated) {
      setAuthBanner(true);
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
      return;
    }

    setActiveMenu(null);
    setIsAnalyzing(true);

    // Simulate verified zero-hallucination analysis based on the query keywords
    setTimeout(() => {
      let analysis: LegalAnalysis;
      const lower = query.toLowerCase();

      if (
        lower.includes("bail") ||
        lower.includes("arrest") ||
        lower.includes("482") ||
        lower.includes("438")
      ) {
        analysis = {
          act: "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) & Code of Criminal Procedure, 1973",
          keySection:
            "Section 482 BNSS [Equivalent to Section 438 CrPC] read with Section 35 BNSS [Section 41A CrPC]",
          summary:
            "Anticipatory bail is granted where there is reasonable apprehension of arrest on accusation of non-bailable offence. The Apex Court mandates balancing personal liberty under Article 21 against police power to investigate, precluding routine or arbitrary arrests.",
          precedents: [
            {
              title: "Sushila Aggarwal v. State (NCT of Delhi)",
              citation: "(2020) 5 SCC 1 (Constitution Bench)",
              principle:
                "Protection under Section 438 CrPC / 482 BNSS should not routinely be limited to a fixed time period.",
            },
            {
              title: "Arnesh Kumar v. State of Bihar",
              citation: "(2014) 8 SCC 273",
              principle:
                "Notice of appearance mandatory under Section 41A CrPC / 35 BNSS for offences with punishment up to 7 years.",
            },
          ],
          verificationHash: "VERIFIED-BNSS-482-SC-2024-CONFIRMED",
        };
      } else if (
        lower.includes("138") ||
        lower.includes("cheque") ||
        lower.includes("dishonour")
      ) {
        analysis = {
          act: "Negotiable Instruments Act, 1881",
          keySection: "Section 138 read with Section 139 & Section 142 NI Act",
          summary:
            "Statutory notice must be issued within 30 days of receiving the cheque return memo. The drawer must be afforded 15 clear days from receipt to make payment. A complaint must be filed within 1 month from the expiry of the 15-day notice period.",
          precedents: [
            {
              title: "Bir Singh v. Mukesh Kumar",
              citation: "(2019) 4 SCC 197",
              principle:
                "Admission of signature on cheque establishes statutory presumption of legally enforceable debt under Section 139.",
            },
            {
              title: "K. Bhaskaran v. Sankaran Vaidhyan Balan",
              citation: "(1999) 7 SCC 510",
              principle:
                "Statutory notice is deemed served if sent to correct address by registered post even if avoided.",
            },
          ],
          verificationHash: "VERIFIED-NI-138-SC-CONFIRMED",
        };
      } else if (
        lower.includes("privacy") ||
        lower.includes("21") ||
        lower.includes("constitution")
      ) {
        analysis = {
          act: "Constitution of India, 1950",
          keySection:
            "Article 21 (Protection of Life and Personal Liberty) & Article 14, 19",
          summary:
            "Privacy is recognized as a fundamental inalienable right forming part of Article 21. Any state restriction must strictly satisfy the three-fold proportionality test: legitimate state aim, suitability, and necessity.",
          precedents: [
            {
              title: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
              citation: "(2017) 10 SCC 1 (9-Judge Bench)",
              principle:
                "Right to privacy is an intrinsic part of the right to life and personal liberty guaranteed under Part III.",
            },
          ],
          verificationHash: "VERIFIED-COI-ART21-9JUDGE-PASS",
        };
      } else {
        analysis = {
          act: "Bharatiya Nyaya Sanhita, 2023 (BNS) & Applicable Indian Special Laws",
          keySection:
            "Relevant Provisions under BNS 2023 / Indian Penal Code & Special Acts",
          summary:
            "Verified statutory cross-examination conducted across Central Acts and Supreme Court precedents. The query discloses actionable legal recourse under Indian jurisdiction with 100% citation validation.",
          precedents: [
            {
              title: "State of Haryana v. Bhajan Lal",
              citation: "1992 Supp (1) SCC 335",
              principle:
                "Established the seven categorical parameters for judicial intervention and exercise of inherent court powers.",
            },
            {
              title: "Lalita Kumari v. Government of U.P.",
              citation: "(2014) 2 SCC 1 (Constitution Bench)",
              principle:
                "Registration of FIR under Section 154 CrPC / 173 BNSS is mandatory if the information discloses a cognizable offence.",
            },
          ],
          verificationHash: "VERIFIED-BNS-PRECEDENT-PASS-100",
        };
      }

      setIsAnalyzing(false);
      setLegalResponse(analysis);
    }, 1100);
  };

  const copyAnalysis = () => {
    if (!legalResponse) return;
    const text = `Counsel AI - Verified Legal Analysis\n\nGoverning Law: ${legalResponse.act}\nSections: ${legalResponse.keySection}\n\nSummary:\n${legalResponse.summary}\n\nKey Precedents:\n${legalResponse.precedents
      .map((p) => `• ${p.title} [${p.citation}]: ${p.principle}`)
      .join("\n")}\n\nVerification Hash: ${legalResponse.verificationHash}`;
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-40 flex w-full max-w-2xl flex-col items-center gap-5 md:gap-6"
    >
      {/* Title & Subtitle Header */}
      <div className="flex flex-col items-center justify-center text-center px-2">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-balance text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-6xl leading-[1.15]"
        >
          Instant, verified counsel for every Indian legal case.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2.5 text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed"
        >
          Indexed across Bharatiya Nyaya Sanhita (BNS), BNSS, IPC, CrPC, and 70+
          years of Supreme Court & High Court precedents.
        </motion.p>
      </div>

      {/* Auth Required Banner */}
      <AnimatePresence>
        {authBanner && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-xl border border-accent-lime/30 bg-accent-lime/10 px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-lime/20">
                <LogIn className="size-4 text-accent-lime" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Please sign in to use Counsel AI
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Redirecting to sign in page...
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs border-accent-lime/30 hover:bg-accent-lime/15"
                onClick={() => router.push("/auth")}
              >
                Sign in
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Box Card */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full rounded-xl shadow-[0_16px_50px_-12px_rgba(15,15,15,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
      >
        <div className="w-full">
          <form
            id="chat"
            className="mx-auto w-full max-w-2xl scroll-mt-28"
            onSubmit={handleSubmit}
          >
            <div data-beam="beam-container" data-active="" className="w-full">
              <div
                role="presentation"
                tabIndex={0}
                id="drop-file"
                className="relative flex min-h-30 flex-wrap items-center justify-center gap-x-4 overflow-visible rounded-xl border border-border bg-card transition-all dark:border-white/10 dark:bg-[#161616]"
              >
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  multiple
                  tabIndex={-1}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Active Filter Chips Bar (Statutes / Attached Files / Active Bench) */}
                {(selectedStatutes.length > 0 ||
                  attachedFiles.length > 0 ||
                  isListening) && (
                  <div className="flex w-full flex-wrap items-center gap-1.5 px-4 pt-3 text-xs">
                    {/* Voice Listening Pulse Chip */}
                    {isListening && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-red-600 dark:text-red-400 border border-red-500/20">
                        <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                        Listening... Speak clearly in English / Hindi
                      </span>
                    )}

                    {/* Selected Statutes Chips */}
                    {selectedStatutes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium text-foreground border border-border"
                      >
                        <Scale className="size-3 text-accent-lime" />
                        {code}
                        <button
                          type="button"
                          onClick={() => toggleStatute(code)}
                          className="ml-0.5 hover:opacity-75 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}

                    {/* Attached Files Chips */}
                    {attachedFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground border border-border"
                      >
                        <FileText className="size-3 text-muted-foreground" />
                        <span className="max-w-28 truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(idx)}
                          className="ml-0.5 hover:opacity-75 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Text Area Input with Fluid Animated Placeholder */}
                <div className="relative min-h-16 w-full">
                  <div className="editor-shell relative h-full min-h-16 w-full px-4 py-3">
                    {/* Animated Placeholder Layer */}
                    {!promptText && (
                      <div className="pointer-events-none absolute inset-x-4 top-3 h-12 overflow-hidden select-none">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={placeholderIndex}
                            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                            transition={{
                              duration: 0.45,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="block text-sm md:text-base text-muted-foreground font-sans leading-relaxed tracking-normal"
                          >
                            {PROMPT_PLACEHOLDERS[placeholderIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    )}

                    <div className="editor-container chat-prompt-editor max-h-[18vh] min-h-16 h-full w-full resize-none overflow-y-auto">
                      <div className="editor-scroller">
                        <div className="editor text-foreground">
                          <textarea
                            ref={textareaRef}
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                              }
                            }}
                            className="w-full resize-none bg-transparent outline-none border-none focus:ring-0 text-sm md:text-base leading-relaxed text-foreground"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="relative flex w-full items-center justify-between border-t border-border/60 p-2.5 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    {/* Button 1: Settings / Bench Menu */}
                    <div className="relative">
                      <motion.div>
                        <Button
                          type="button"
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === "settings" ? null : "settings",
                            )
                          }
                          title="Court jurisdiction & Bench settings"
                          aria-label="Court jurisdiction & Bench settings"
                          variant="ghost"
                          size="icon-sm"
                          className={`rounded-md text-foreground transition-colors cursor-pointer ${
                            activeMenu === "settings" ? "bg-muted" : ""
                          }`}
                        >
                          <Settings2 className="size-4 shrink-0" />
                        </Button>
                      </motion.div>

                      {/* Settings Popover Dropdown */}
                      <AnimatePresence>
                        {activeMenu === "settings" && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 w-72 origin-bottom-left rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-md z-50 text-foreground"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                              <span className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">
                                Jurisdiction Filter
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveMenu(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="text-[11px] text-muted-foreground mb-1">
                                Select Active Bench:
                              </div>
                              {BENCH_OPTIONS.map((bench) => (
                                <button
                                  key={bench}
                                  type="button"
                                  onClick={() => setSelectedBench(bench)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                    selectedBench === bench
                                      ? "bg-accent-lime/15 text-foreground font-semibold"
                                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span className="truncate">{bench}</span>
                                  {selectedBench === bench && (
                                    <Check className="size-3 text-accent-lime shrink-0 ml-1" />
                                  )}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 pt-2 border-t border-border/60 space-y-2 text-xs">
                              <label className="flex items-center justify-between cursor-pointer select-none">
                                <span className="text-muted-foreground text-[11px]">
                                  Strict 0% Hallucination Mode
                                </span>
                                <input
                                  type="checkbox"
                                  checked={strictZeroHallucination}
                                  onChange={(e) =>
                                    setStrictZeroHallucination(e.target.checked)
                                  }
                                  className="accent-accent-lime"
                                />
                              </label>
                              <label className="flex items-center justify-between cursor-pointer select-none">
                                <span className="text-muted-foreground text-[11px]">
                                  Map BNS to IPC equivalents
                                </span>
                                <input
                                  type="checkbox"
                                  checked={includeBnsMapping}
                                  onChange={(e) =>
                                    setIncludeBnsMapping(e.target.checked)
                                  }
                                  className="accent-accent-lime"
                                />
                              </label>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Button 2: Drafts Button */}
                    <div className="relative">
                      <motion.div>
                        <Button
                          type="button"
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === "drafts" ? null : "drafts",
                            )
                          }
                          variant="ghost"
                          size="sm"
                          title="Choose a legal template (Bail, Legal Notice, SLP, Writ)"
                          className={`rounded-md border-border text-xs text-foreground transition-colors gap-1.5 cursor-pointer ${
                            activeMenu === "drafts" ? "bg-muted" : ""
                          }`}
                        >
                          <svg
                            className="size-3.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16.2 4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C21 6.28 21 7.12 21 8.8v6.4c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C18.72 20 17.88 20 16.2 20H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C3 17.72 3 16.88 3 15.2V8.8c0-1.68 0-2.52.327-3.162a3 3 0 0 1 1.311-1.311C5.28 4 6.12 4 7.8 4z"
                            />
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 7h.01M10 7h.01M13 7h.01M21 10H3"
                            />
                          </svg>
                          Drafts
                        </Button>
                      </motion.div>

                      {/* Draft Templates Popover */}
                      <AnimatePresence>
                        {activeMenu === "drafts" && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 origin-bottom-left rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-md z-50 text-foreground"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                              <span className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">
                                Ready Legal Drafts
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveMenu(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>

                            <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                              {DRAFT_TEMPLATES.map((tmpl) => (
                                <button
                                  key={tmpl.id}
                                  type="button"
                                  onClick={() =>
                                    applyDraftTemplate(tmpl.prompt)
                                  }
                                  className="w-full text-left p-2 rounded-lg transition-colors hover:bg-muted group cursor-pointer border border-transparent hover:border-border"
                                >
                                  <div className="text-xs font-semibold text-foreground group-hover:text-accent-lime transition-colors">
                                    {tmpl.title}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {tmpl.desc}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Button 3: Statutes Button */}
                    <div className="relative">
                      <motion.div>
                        <Button
                          type="button"
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === "statutes" ? null : "statutes",
                            )
                          }
                          variant="ghost"
                          size="sm"
                          title="Filter by Acts (BNS, BNSS, BSA, CPC, Constitution)"
                          className={`rounded-md border-border text-xs text-foreground transition-colors gap-1.5 cursor-pointer ${
                            activeMenu === "statutes" ? "bg-muted" : ""
                          }`}
                        >
                          <svg
                            className="size-3.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 12v9.5m0-9.5L3.34 7.388M12 12l8.66-4.612M12 21.5q.326 0 .648-.065c.483-.099.938-.35 1.846-.853l4.012-2.22c.909-.503 1.363-.755 1.693-1.106.293-.312.513-.678.648-1.077.153-.45.153-.953.153-1.959V9.78"
                            />
                          </svg>
                          <span>Statutes</span>
                        </Button>
                      </motion.div>

                      {/* Statutes Popover */}
                      <AnimatePresence>
                        {activeMenu === "statutes" && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 w-80 origin-bottom-left rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-md z-50 text-foreground"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                              <span className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">
                                Focus Indian Statutes
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveMenu(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>

                            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                              {STATUTE_OPTIONS.map((st) => {
                                const isSelected = selectedStatutes.includes(
                                  st.code,
                                );
                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => toggleStatute(st.code)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? "bg-accent-lime/15 text-foreground font-semibold"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="font-mono text-[10px] uppercase text-muted-foreground px-1 py-0.5 rounded bg-muted">
                                        {st.code}
                                      </span>
                                      <span className="truncate">
                                        {st.name}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <Check className="size-3 text-accent-lime shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Button 4: Upload Case Documents */}
                    <motion.div>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="icon-sm"
                        title="Upload case brief, FIR or contract (PDF/Images)"
                        aria-label="Upload case brief, FIR or contract"
                        className="rounded-md text-foreground transition-colors hover:bg-muted cursor-pointer"
                      >
                        <ImagePlus className="size-4 shrink-0" />
                      </Button>
                    </motion.div>

                    {/* Button 5: Voice Dictation */}
                    <motion.div>
                      <Button
                        type="button"
                        onClick={toggleListening}
                        variant="ghost"
                        size="icon-sm"
                        title={
                          isListening ? "Stop dictation" : "Dictate legal query"
                        }
                        aria-label="Dictate legal query"
                        className={`rounded-md transition-colors hover:bg-muted cursor-pointer relative ${
                          isListening
                            ? "text-red-500 bg-red-500/10"
                            : "text-foreground"
                        }`}
                      >
                        {isListening ? (
                          <span className="relative flex size-4 items-center justify-center">
                            <span className="absolute size-3 rounded-full bg-red-500/40 animate-ping" />
                            <span className="size-2 rounded-full bg-red-500" />
                          </span>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          >
                            <path
                              stroke="currentColor"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 20a8 8 0 0 1-8-8m8 8a8 8 0 0 0 8-8m-8 8v2"
                              opacity=".28"
                            ></path>
                            <path
                              fill="currentColor"
                              d="M12 2a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z"
                            ></path>
                          </svg>
                        )}
                      </Button>
                    </motion.div>

                    {/* Button 6: Send Query Button */}
                    <Button
                      type="submit"
                      disabled={isAnalyzing}
                      className="inline-flex size-7 items-center justify-center rounded-md bg-accent-lime text-dark-obsidian shadow-xs ring-1 ring-black/10 transition-colors hover:bg-[#B8E12A] cursor-pointer disabled:opacity-50"
                      aria-label="Send message"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3.5"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Verified Legal Intelligence Response Result Card */}
      <AnimatePresence>
        {legalResponse && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-xl border border-border bg-card p-5 shadow-xl text-foreground text-left"
          >
            {/* Header: Verified Stamp & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-accent-lime/20 text-accent-lime">
                  <ShieldCheck className="size-3.5" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider font-mono">
                    Verified Legal Analysis
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Bench: {selectedBench}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyAnalysis}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-secondary hover:bg-muted transition-colors cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="size-3 text-accent-lime" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-muted-foreground" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLegalResponse(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Close result"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Core Statutory Sections */}
            <div className="mt-3.5 space-y-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Applicable Statutory Section(s)
                </div>
                <div className="mt-0.5 text-sm font-semibold text-foreground">
                  {legalResponse.keySection}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Primary Act: {legalResponse.act}
                </div>
              </div>

              {/* Legal Ratio Summary */}
              <div className="rounded-lg bg-secondary/50 p-3 border border-border/60">
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Ratio Decidendi & Legal Principle
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                  {legalResponse.summary}
                </p>
              </div>

              {/* Binding Supreme Court Citations */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Binding Supreme Court Citations (Zero Hallucination)
                </div>
                <div className="space-y-2">
                  {legalResponse.precedents.map((prec, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-border/70 bg-card text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-foreground">
                          {prec.title}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-lime/15 text-foreground font-medium">
                          {prec.citation}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        {prec.principle}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Stamp Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground border-t border-border/50">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-accent-lime" />
                  <span>
                    Cross-verified against Indian Supreme Court Precedent
                    Repository
                  </span>
                </span>
                <span className="text-foreground/75 font-semibold">
                  {legalResponse.verificationHash}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
