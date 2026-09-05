"use client";

import { useState } from "react";
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
import { AtSignIcon, EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { GithubIcon } from "./icons/github-icon";

export function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full overflow-hidden px-4 md:h-screen">
      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
        <div className="flex flex-col space-y-6">
          <a aria-label="Home" className="" href="#">
            {/* <Logo className="h-4.5" /> */}
          </a>
          <div className="space-y-1">
            <h1 className="font-semibold text-xl tracking-wide">
              Hey, welcome!
            </h1>
            <p className="text-base text-muted-foreground">
              Log in or sign up. It only takes a moment.
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
          <AuthDivider>OR CONTINUE WITH EMAIL</AuthDivider>
          <form className="space-y-4">
            <InputGroup>
              <InputGroupInput
                aria-label="Email address"
                placeholder="your.email@example.com"
                type="email"
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon />
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupInput
                aria-label="Password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
              />
              <InputGroupAddon align="inline-start">
                <LockIcon />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-3.5 text-muted-foreground" />
                  ) : (
                    <EyeIcon className="size-3.5 text-muted-foreground" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            <Button className="w-full" size="default" type="submit">
              Continue With Email
            </Button>
          </form>
          <FullWidthDivider position="bottom" />
        </div>

        <p className="text-center text-muted-foreground text-sm">
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
