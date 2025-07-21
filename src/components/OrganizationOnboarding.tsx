import React, { useState } from "react";
import { CreateOrganization, OrganizationList } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Plus } from "lucide-react";

interface OrganizationOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function OrganizationOnboarding({ open, onComplete }: OrganizationOnboardingProps) {
  const [view, setView] = useState<"choice" | "create" | "join">("choice");

  const handleComplete = () => {
    onComplete();
    setView("choice");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Bienvenue ! Configurons votre organisation
          </DialogTitle>
        </DialogHeader>

        {view === "choice" && (
          <div className="space-y-6 py-4">
            <p className="text-center text-muted-foreground">
              Pour commencer, vous devez créer une organisation ou rejoindre une organisation existante.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setView("create")}>
                <CardHeader className="text-center">
                  <Building2 className="h-12 w-12 mx-auto text-primary" />
                  <CardTitle className="text-lg">Créer une Organisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Créez votre propre organisation et invitez votre équipe
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setView("join")}>
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 mx-auto text-primary" />
                  <CardTitle className="text-lg">Rejoindre une Organisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Rejoignez une organisation existante avec une invitation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {view === "create" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView("choice")}>
                ← Retour
              </Button>
              <h3 className="text-lg font-semibold">Créer une Organisation</h3>
            </div>
            
            <CreateOrganization 
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "border-0 shadow-none bg-transparent",
                  navbar: "hidden",
                  pageScrollBox: "p-0"
                }
              }}
            />
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleComplete}>
                Ignorer pour le moment
              </Button>
            </div>
          </div>
        )}

        {view === "join" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView("choice")}>
                ← Retour
              </Button>
              <h3 className="text-lg font-semibold">Rejoindre une Organisation</h3>
            </div>
            
            <OrganizationList 
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "border-0 shadow-none bg-transparent",
                  navbar: "hidden",
                  pageScrollBox: "p-0"
                }
              }}
            />
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleComplete}>
                Ignorer pour le moment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}