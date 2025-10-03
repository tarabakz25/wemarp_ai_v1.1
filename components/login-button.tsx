"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { auth, signIn, signOut } from "@/lib/auth";

export default async function LoginButton() {
  const session = await auth();

  return (
    <>
      {!session && (
        <form
          action={async () => {
            "use server";
            await signIn("GitHub");
          }}
          >
          <Button className="my-5 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
            Sign in with GitHub
          </Button>
        </form>
      )}
      {session && (
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
          >
          <Button className="my-5 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
            Sign out
          </Button>
      </form>
      )}
    </>
  )
}
