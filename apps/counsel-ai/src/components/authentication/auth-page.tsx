"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/authentication/icons/google-icon";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthDivider } from "@/components/authentication/ui/auth-divider";
import { FullWidthDivider } from "@/components/authentication/ui/full-width-divider";
import {
  AtSignIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MailIcon,
} from "lucide-react";
import { GithubIcon } from "./icons/github-icon";

type AuthMode = "sign-in" | "sign-up";

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationError = searchParams.get("error") === "verification_failed";

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    verificationError
      ? "Email verification failed. Please try again or request a new link."
      : null,
  );
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  const validateForm = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "sign-up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // Show "check your email" state
        setEmailSent(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message === "Email not confirmed") {
            setError(
              "Please verify your email before signing in. Check your inbox for a verification link.",
            );
          } else if (signInError.message === "Invalid login credentials") {
            setError(
              "Invalid email or password. Please check your credentials and try again.",
            );
          } else {
            setError(signInError.message);
          }
          return;
        }

        // Successful sign-in — redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // After sign-up success: show "check your email" screen
  if (emailSent) {
    return (
      <div className="relative w-full overflow-hidden px-4 md:h-screen">
        <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent-lime/15">
              <MailIcon className="size-7 text-accent-lime" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-wide">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We&apos;ve sent a verification link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                <br />
                Click the link to verify your account and start using Counsel
                AI.
              </p>
            </div>
            <div className="pt-2 space-y-3 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  setMode("sign-in");
                  setPassword("");
                }}
              >
                Back to sign in
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                  onClick={async () => {
                    setIsLoading(true);
                    await supabase.auth.resend({
                      type: "signup",
                      email: email.trim(),
                      options: {
                        emailRedirectTo: `${window.location.origin}/auth/confirm`,
                      },
                    });
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "resend the link"}
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden px-4 md:h-screen">
      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
        <div className="flex flex-col space-y-6">
          <a aria-label="Home" className="" href="/">
            {/* <Logo className="h-4.5" /> */}
          </a>
          <div className="space-y-1">
            <h1 className="font-semibold text-xl tracking-wide">
              {mode === "sign-in" ? "Welcome back!" : "Create your account"}
            </h1>
            <p className="text-base text-muted-foreground">
              {mode === "sign-in"
                ? "Sign in to continue to Counsel AI."
                : "Sign up to get started. We'll send you a verification email."}
            </p>
          </div>
        </div>

        <div className="relative my-6 flex size-full flex-col gap-4 py-8">
          <FullWidthDivider position="top" />

          <Button className="w-full" type="button" variant="outline">
            <GoogleIcon data-icon="inline-start" />
            Continue with Google
          </Button>

          <Button className="w-full" type="button" variant="outline">
            <GithubIcon data-icon="inline-start" />
            Continue with Github
          </Button>

          <AuthDivider>
            {mode === "sign-in"
              ? "OR SIGN IN WITH EMAIL"
              : "OR SIGN UP WITH EMAIL"}
          </AuthDivider>

          {/* Error / Status Messages */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputGroup>
              <InputGroupInput
                aria-label="Email address"
                placeholder="your.email@example.com"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                autoComplete={mode === "sign-up" ? "email" : "username"}
                required
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon />
              </InputGroupAddon>
            </InputGroup>

            <div className="space-y-1.5">
              <InputGroup>
                <InputGroupInput
                  aria-label="Password"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete={
                    mode === "sign-up" ? "new-password" : "current-password"
                  }
                  minLength={8}
                  required
                />
                <InputGroupAddon align="inline-start">
                  <LockIcon />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-3.5 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="size-3.5 text-muted-foreground" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {mode === "sign-up" && (
                <div className="flex items-center gap-1.5 px-1">
                  <CheckCircle2
                    className={`size-3 ${
                      password.length >= 8
                        ? "text-accent-lime"
                        : "text-muted-foreground/40"
                    }`}
                  />
                  <span
                    className={`text-[11px] ${
                      password.length >= 8
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    At least 8 characters
                  </span>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="default"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "sign-in" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "sign-in" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <FullWidthDivider position="bottom" />
        </div>

        {/* Toggle between modes */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          {mode === "sign-in" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent-lime cursor-pointer"
                onClick={() => {
                  setMode("sign-up");
                  setError(null);
                }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent-lime cursor-pointer"
                onClick={() => {
                  setMode("sign-in");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-muted-foreground text-sm pb-6">
          This site is protected by reCAPTCHA and the Google{" "}
          <a
            className="underline underline-offset-4 hover:text-accent-foreground"
            href="#"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            className="underline underline-offset-4 hover:text-accent-foreground"
            href="#"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </div>
    </div>
  );
}
