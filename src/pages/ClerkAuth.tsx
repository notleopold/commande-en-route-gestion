import React from 'react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ClerkAuth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bienvenue</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte ou créez-en un nouveau
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignedOut>
            <div className="flex flex-col gap-4">
              <SignInButton mode="modal" fallbackRedirectUrl="/" forceRedirectUrl="/">
                <Button className="w-full">Se connecter</Button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/" forceRedirectUrl="/">
                <Button variant="outline" className="w-full">S'inscrire</Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="text-center">
              <p className="mb-4">Vous êtes connecté !</p>
              <UserButton />
            </div>
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  )
}