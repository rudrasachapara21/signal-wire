import { useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, RefreshCw, Sparkles, Mic, MicOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useReport } from "@/context/ReportContext";
import { Button } from "@/components/ui/button";
import { analyzeBrand, ClarificationError } from "@/lib/api";
import { defaultBrandProfile } from "@/lib/mock-data";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "http://localhost:5001";

// ─── Speech input hook ────────────────────────────────────────────────────────

type SpeechState = "idle" | "recording" | "processing" | "error";

function useSpeechInput(onText: (text: string) => void) {
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    setSpeechError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best available mimetype
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "",
      ].find((t) => !t || MediaRecorder.isTypeSupported(t)) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach((t) => t.stop());

        setSpeechState("processing");
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        try {
          const res = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
          if (!data.text) throw new Error("Empty transcription returned.");

          onText(data.text);
          setSpeechState("idle");
        } catch (err: any) {
          setSpeechError(err.message || "Transcription failed.");
          setSpeechState("error");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setSpeechState("recording");
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setSpeechError(
          "Microphone access denied. Please allow mic access in your browser settings and try again."
        );
      } else {
        setSpeechError(err.message || "Could not access microphone.");
      }
      setSpeechState("error");
    }
  }, [onText]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { speechState, speechError, startRecording, stopRecording, setSpeechError };
}

// ─── Mic button component ──────────────────────────────────────────────────────

function MicButton({
  speechState,
  speechError,
  startRecording,
  stopRecording,
  setSpeechError,
}: {
  speechState: SpeechState;
  speechError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  setSpeechError: (e: string | null) => void;
}) {
  const isRecording = speechState === "recording";
  const isProcessing = speechState === "processing";
  const isDisabled = isProcessing;

  function handleClick() {
    if (isRecording) {
      stopRecording();
    } else if (!isDisabled) {
      setSpeechError(null);
      void startRecording();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        id="mic-button"
        onClick={handleClick}
        disabled={isDisabled}
        title={
          isRecording
            ? "Stop recording"
            : isProcessing
              ? "Transcribing…"
              : "Record voice input"
        }
        className={[
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all",
          isRecording
            ? "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : isProcessing
              ? "cursor-not-allowed border-muted-foreground/30 bg-muted text-muted-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
        ].join(" ")}
      >
        {/* Pulsing ring while recording */}
        {isRecording && (
          <span className="absolute inset-0 animate-ping rounded-lg bg-red-500/30" />
        )}

        {isProcessing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} />
        )}
      </button>

      {/* Status label below button */}
      <span className="text-[10px] leading-none text-muted-foreground">
        {isRecording ? (
          <span className="text-red-500">● REC</span>
        ) : isProcessing ? (
          "transcribing…"
        ) : (
          "voice"
        )}
      </span>

      {/* Error tooltip */}
      {speechError && (
        <p className="absolute right-0 top-full z-10 mt-1 w-64 rounded-md border border-destructive/30 bg-card p-2 text-xs text-destructive shadow-md">
          {speechError}
        </p>
      )}
    </div>
  );
}

// ─── Validation schema ────────────────────────────────────────────────────────

const brandProfileSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  productType: z.string().min(1, "Product type is required"),
  description: z
    .string()
    .min(20, "Please describe your brand in at least 20 characters"),
  idealCustomer: z.string().min(1, "Ideal customer is required"),
  monthlyBudget: z.string().min(1, "Monthly budget is required"),
});

export type BrandProfileFormValues = z.infer<typeof brandProfileSchema>;

const PRODUCT_TYPES = [
  "Physical products",
  "Services",
  "Digital products",
  "SaaS / Software",
  "Mobile app",
  "Other",
];

// ─── Analyzing state ──────────────────────────────────────────────────────────

function AnalyzingState() {
  return (
    <section className="mx-auto grid min-h-[65vh] max-w-xl place-items-center text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-xl bg-accent text-primary shadow-sm">
          <Sparkles size={28} />
        </span>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="signal-dot size-2.5 rounded-full bg-primary"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <h1 className="mt-5 text-2xl font-bold">Building your advertising plan</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Analyzing audience behavior, platform strengths, content formats, and
          relevant creator categories using AI.
        </p>
      </div>
    </section>
  );
}

// ─── Brand Profile form ───────────────────────────────────────────────────────

export function BrandProfile() {
  const { user, requireAuth } = useAuth();
  const { setReport } = useReport();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clarification, setClarification] = useState<{
    issue: string;
    suggestion: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<BrandProfileFormValues>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      brandName: defaultBrandProfile.brandName,
      productType: defaultBrandProfile.productType,
      description: defaultBrandProfile.description,
      idealCustomer: defaultBrandProfile.idealCustomer,
      monthlyBudget: defaultBrandProfile.monthlyBudget,
    },
  });

  // ── Voice input ─────────────────────────────────────────────────────────────
  const handleSpeechText = useCallback(
    (text: string) => {
      const current = getValues("description");
      const joined = current ? `${current.trimEnd()} ${text}` : text;
      setValue("description", joined, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue]
  );

  const { speechState, speechError, startRecording, stopRecording, setSpeechError } =
    useSpeechInput(handleSpeechText);

  async function executeAnalysis(values: BrandProfileFormValues) {
    setAnalyzing(true);
    setErrorMessage(null);
    setClarification(null);

    try {
      const generatedReport = await analyzeBrand(values);
      const brandProfile = {
        brand_name: values.brandName,
        sell_type: values.productType,
        description: values.description,
        ideal_customer: values.idealCustomer,
        monthly_budget: values.monthlyBudget,
      };
      setReport(generatedReport, user?.id, brandProfile);
      setAnalyzing(false);
      void navigate({ to: "/strategy-report" });
    } catch (err: any) {
      setAnalyzing(false);
      if (err instanceof ClarificationError) {
        setClarification({
          issue: err.issue,
          suggestion: err.suggestion,
        });
      } else {
        const msg = err?.message || "";
        if (msg.includes("too often") || msg.includes("rate_limited") || msg.includes("wait a few minutes")) {
          setErrorMessage("You've hit the limit for now — please wait a few minutes and try again.");
        } else {
          setErrorMessage(
            err.message || "Failed to connect to backend server. Please check that the server is running."
          );
        }
      }
    }
  }

  function onValidSubmit(values: BrandProfileFormValues) {
    if (user) {
      void executeAnalysis(values);
    } else {
      requireAuth(
        () => void executeAnalysis(values),
        () => void navigate({ to: "/login" })
      );
    }
  }

  if (analyzing) {
    return <AnalyzingState />;
  }

  return (
    <>
      <p className="text-sm font-medium text-primary">Brand analysis</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Tell us what you sell.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Plain language is perfect. Signal Wire uses these details to find the
        right advertising channels, content formats, and creator types.
      </p>

      {clarification && (
        <div
          id="input-clarification-banner"
          className="mt-6 max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-100"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Before we generate your strategy, quick check:
              </p>
              <p className="leading-relaxed opacity-90">{clarification.issue}</p>
              {clarification.suggestion && (
                <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                  💡 Suggestion: {clarification.suggestion}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 max-w-3xl rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Analysis failed</p>
              <p className="mt-1 text-sm opacity-90">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void executeAnalysis(getValues())}
              className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Try again
            </Button>
          </div>
        </div>
      )}

      <section className="mt-6 max-w-3xl rounded-lg border border-border bg-card p-4 shadow-sm sm:mt-8 sm:p-6">
        <form
          id="brand-profile-form"
          onSubmit={handleSubmit(onValidSubmit)}
          noValidate
        >
          {/* Row 1: Brand name + Product type */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="brandName"
                className="block text-sm font-medium text-foreground"
              >
                Brand name
              </label>
              <input
                id="brandName"
                {...register("brandName")}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
              {errors.brandName && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.brandName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="productType"
                className="block text-sm font-medium text-foreground"
              >
                What do you sell?
              </label>
              <select
                id="productType"
                {...register("productType")}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.productType && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.productType.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-foreground"
              >
                Describe your brand and product
              </label>
              <div className="relative">
                <MicButton
                  speechState={speechState}
                  speechError={speechError}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  setSpeechError={setSpeechError}
                />
              </div>
            </div>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="mt-2 min-h-32 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm font-normal leading-6 text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Row 2: Ideal customer + Budget */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="idealCustomer"
                className="block text-sm font-medium text-foreground"
              >
                Ideal customer
              </label>
              <input
                id="idealCustomer"
                {...register("idealCustomer")}
                placeholder="e.g. Women, 22–38, urban, fashion-conscious"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
              {errors.idealCustomer && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.idealCustomer.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="monthlyBudget"
                className="block text-sm font-medium text-foreground"
              >
                Monthly ad budget
              </label>
              <input
                id="monthlyBudget"
                {...register("monthlyBudget")}
                placeholder="e.g. ₹50,000 or $500"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
              {errors.monthlyBudget && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.monthlyBudget.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              size="lg"
              id="generate-strategy-button"
              className="h-12 w-full sm:h-11 sm:w-auto"
            >
              <Sparkles size={17} />
              Generate my strategy
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
