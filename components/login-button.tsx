import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignInWithGithubButton, SignOutButton } from "@/components/login-button.client";

export default async function LoginButton() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <SignInWithGithubButton />;
  }
  return <SignOutButton />;
}
