"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCards } from "@/components/studio/plan-cards";
import {
  useClaimUsername,
  useSaveOnboarding,
  useUser,
  useUsernameSuggest,
  type OnboardingAnswers,
} from "@/hooks/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Quiz definition                                                     */
/* ------------------------------------------------------------------ */

interface QuizOption {
  label: string;
  description?: string;
}

interface QuizStepDef {
  question: string;
  multi: boolean;
  answerKey: "goal" | "skill" | "interests" | "discovery" | "blockers";
  options: QuizOption[];
}

const QUIZ_STEPS: QuizStepDef[] = [
  {
    question: "What do you want to achieve with HF Studio?",
    multi: true,
    answerKey: "goal",
    options: [
      { label: "Viral content & UGC videos" },
      { label: "High-converting marketing" },
      { label: "Automate workflows with Supercomputer & MCP/CLI" },
      { label: "Cinematic visuals & AI films" },
      { label: "Create avatars & product visuals" },
      { label: "Just exploring" },
    ],
  },
  {
    question: "What's your skill level with AI tools?",
    multi: false,
    answerKey: "skill",
    options: [
      {
        label: "Beginner",
        description: "Simple, guided, one-click flows",
      },
      {
        label: "Intermediate",
        description: "Balanced control and automation",
      },
      {
        label: "Advanced",
        description: "Full manual control, pro tools",
      },
    ],
  },
  {
    question: "Which capabilities interest you most?",
    multi: true,
    answerKey: "interests",
    options: [
      { label: "Image generation" },
      { label: "Video generation" },
      { label: "Ads Studio" },
      { label: "AI Influencer" },
      { label: "Effects & styles" },
      { label: "Canvas editing" },
    ],
  },
  {
    question: "How did you hear about us?",
    multi: false,
    answerKey: "discovery",
    options: [
      { label: "Search engine" },
      { label: "Social media" },
      { label: "Friend or colleague" },
      { label: "Article or blog" },
      { label: "Advertisement" },
    ],
  },
  {
    question: "What are your biggest creative blockers?",
    multi: true,
    answerKey: "blockers",
    options: [
      { label: "Time" },
      { label: "Budget" },
      { label: "Quality" },
      { label: "Skills" },
      { label: "Scaling content" },
    ],
  },
];

const INITIAL_ANSWERS: OnboardingAnswers = {
  goal: [],
  skill: "",
  interests: [],
  discovery: "",
  blockers: [],
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

/* ------------------------------------------------------------------ */
/* Option card                                                         */
/* ------------------------------------------------------------------ */

function OptionCard({
  option,
  selected,
  multi,
  onSelect,
}: {
  option: QuizOption;
  selected: boolean;
  multi: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600",
        selected
          ? "border-zinc-600 bg-zinc-900"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center border",
          multi ? "rounded-sm" : "rounded-full",
          selected
            ? "border-zinc-200 bg-zinc-100"
            : "border-zinc-600 bg-transparent",
        )}
      >
        {selected ? (
          <Check className="size-3 text-zinc-900" />
        ) : null}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-100">
          {option.label}
        </span>
        {option.description ? (
          <span className="text-xs text-zinc-500">{option.description}</span>
        ) : null}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function QuizPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: suggest } = useUsernameSuggest();
  const claimUsername = useClaimUsername();
  const saveOnboarding = useSaveOnboarding();

  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<OnboardingAnswers>(INITIAL_ANSWERS);

  // Step 6 state
  const [editingUsername, setEditingUsername] = React.useState(false);
  const [usernameInput, setUsernameInput] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);

  // Already onboarded users go straight to the studio — but never redirect
  // someone who just finished onboarding in THIS session (they should see
  // the special-offer screen first).
  const completedLocallyRef = React.useRef(false);

  React.useEffect(() => {
    if (user?.onboarding_completed && !completedLocallyRef.current) {
      router.replace("/generate");
    }
  }, [user?.onboarding_completed, router]);

  const currentStep = QUIZ_STEPS[step - 1];
  const isOfferStep = step === 7;

  const toggleMulti = (key: QuizStepDef["answerKey"], label: string) => {
    setAnswers((prev) => {
      const current = prev[key] as string[];
      return {
        ...prev,
        [key]: current.includes(label)
          ? current.filter((item) => item !== label)
          : [...current, label],
      };
    });
  };

  const setSingle = (key: QuizStepDef["answerKey"], label: string) => {
    setAnswers((prev) => ({ ...prev, [key]: label }));
  };

  const suggested = suggest?.suggested_username ?? "";
  const effectiveUsername = editingUsername ? usernameInput : suggested;
  const usernameValid = USERNAME_PATTERN.test(effectiveUsername);

  const currentSelection = currentStep
    ? (answers[currentStep.answerKey] as string[] | string)
    : null;
  const hasSelection = Array.isArray(currentSelection)
    ? currentSelection.length > 0
    : typeof currentSelection === "string" && currentSelection.length > 0;

  const claiming =
    claimUsername.isPending || saveOnboarding.isPending;

  const handleContinue = () => {
    if (step < 6) {
      setStep((prev) => Math.min(prev + 1, 7));
      return;
    }
    if (step === 6) {
      void handleClaim();
    }
  };

  const handleClaim = async () => {
    if (!usernameValid || !agreed || claiming) return;
    // Suppress the "already onboarded" redirect BEFORE the claim mutation:
    // the backend flips onboarding_completed as soon as the username is
    // claimed, and the mutation's onSuccess invalidation refetches /api/user
    // — that refetch would race setStep(7) and bounce us to /generate.
    completedLocallyRef.current = true;
    try {
      await claimUsername.mutateAsync({ username: effectiveUsername });
    } catch {
      // 409 / validation errors surface as toasts from the mutation hook —
      // stay on this step so the user can pick another username.
      completedLocallyRef.current = false;
      return;
    }
    try {
      await saveOnboarding.mutateAsync({ answers });
    } catch {
      return;
    }
    setStep(7);
  };

  const cardWidthClass = isOfferStep
    ? "max-w-2xl"
    : step === 6
      ? "max-w-md"
      : "max-w-xl";

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
        <div className="w-full max-w-xl space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <Skeleton className="h-4 w-32 bg-zinc-800/70" />
          <Skeleton className="h-1 w-full bg-zinc-800/70" />
          <Skeleton className="h-7 w-3/4 bg-zinc-800/70" />
          <Skeleton className="h-16 w-full bg-zinc-800/70" />
          <Skeleton className="h-16 w-full bg-zinc-800/70" />
          <Skeleton className="h-16 w-3/4 bg-zinc-800/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div
        className={cn(
          "w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8",
          cardWidthClass,
        )}
      >
        {!isOfferStep ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                Step {step} of 6
              </span>
              <span className="text-xs text-zinc-600">HF Studio</span>
            </div>
            <Progress
              value={(step / 6) * 100}
              className="h-1 bg-zinc-800"
              aria-label={`Quiz progress: step ${step} of 6`}
            />
          </div>
        ) : null}

        {/* Steps 1–5: question cards */}
        {currentStep ? (
          <div className="mt-8 flex flex-col gap-6">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
              {currentStep.question}
            </h1>
            <div
              role={currentStep.multi ? "group" : "radiogroup"}
              aria-label={currentStep.question}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {currentStep.options.map((option) => {
                const list = answers[currentStep.answerKey] as string[];
                const selected = list.includes(option.label);
                return (
                  <OptionCard
                    key={option.label}
                    option={option}
                    selected={selected}
                    multi={currentStep.multi}
                    onSelect={() =>
                      currentStep.multi
                        ? toggleMulti(currentStep.answerKey, option.label)
                        : setSingle(currentStep.answerKey, option.label)
                    }
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Step 6: claim username */}
        {step === 6 ? (
          <div className="mt-8 flex flex-col gap-6">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
              Claim your username
            </h1>

            <div className="flex flex-col gap-3">
              {editingUsername ? (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="username-input"
                    className="text-sm text-zinc-300"
                  >
                    Username
                  </label>
                  <Input
                    id="username-input"
                    value={usernameInput}
                    onChange={(event) =>
                      setUsernameInput(event.target.value.toLowerCase())
                    }
                    placeholder="lowercase_letters_and_underscores"
                    autoFocus
                    aria-invalid={usernameInput && !usernameValid ? true : undefined}
                    aria-describedby="username-hint"
                    className="h-11 border-zinc-800 bg-zinc-900 font-mono text-base text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                  />
                  <p
                    id="username-hint"
                    className={cn(
                      "text-xs",
                      usernameInput && !usernameValid
                        ? "text-red-400"
                        : "text-zinc-500",
                    )}
                  >
                    3–30 characters — lowercase letters, numbers and
                    underscores.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-zinc-300">Your username</span>
                  <div className="flex items-center gap-3">
                    {suggest ? (
                      <code className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-lg tracking-wide text-zinc-100">
                        {suggested}
                      </code>
                    ) : (
                      <Skeleton className="h-12 w-56 rounded-lg bg-zinc-800/70" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-zinc-400 hover:text-zinc-100"
                      onClick={() => {
                        setUsernameInput(suggested);
                        setEditingUsername(true);
                      }}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5 border-zinc-600 data-[state=checked]:border-zinc-100 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-900"
                aria-label="Agree to the Terms of Service and Privacy Policy"
              />
              <label htmlFor="terms" className="text-sm text-zinc-300">
                I agree to the{" "}
                <span className="cursor-pointer text-zinc-100 underline underline-offset-4">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="cursor-pointer text-zinc-100 underline underline-offset-4">
                  Privacy Policy
                </span>
              </label>
            </div>
          </div>
        ) : null}

        {/* Step 7: special offer */}
        {isOfferStep ? (
          <div className="mt-2 flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
                Special offer
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Thanks for setting up your account — claim your discount before
                it expires.
              </p>
            </div>
            <PlanCards />
            <Button
              type="button"
              variant="ghost"
              className="mx-auto text-sm text-zinc-400 hover:text-zinc-200"
              onClick={() => router.push("/generate")}
            >
              Skip this offer
            </Button>
          </div>
        ) : null}

        {/* Footer controls */}
        {!isOfferStep ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-zinc-400 hover:text-zinc-200"
              disabled={step === 1}
              onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            >
              Back
            </Button>
            <Button
              type="button"
              className="h-11 gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-40"
              disabled={
                step < 6
                  ? !hasSelection
                  : !usernameValid || !agreed || claiming
              }
              onClick={handleContinue}
            >
              {claiming ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Continue
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
