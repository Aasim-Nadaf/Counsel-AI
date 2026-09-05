import { Suspense } from "react";
import { AuthPage } from "@/components/authentication/auth-page";

export default function Auth() {
  return <AuthPage />;
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
