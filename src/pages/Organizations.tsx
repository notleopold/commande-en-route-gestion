import React from "react";
import { OrganizationProfile, CreateOrganization, OrganizationSwitcher } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@clerk/clerk-react";

const Organizations = () => {
  const { organization } = useOrganization();

  return (
    <Layout title="Organisations">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Organisations</h1>
            <p className="text-muted-foreground">
              Créez, rejoignez et gérez vos organisations
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <OrganizationSwitcher 
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                }
              }}
            />
          </div>
        </div>

        {organization ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profil Organisation</TabsTrigger>
              <TabsTrigger value="create">Créer Organisation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profil de l'Organisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrganizationProfile 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "border-0 shadow-none bg-transparent",
                        navbar: "hidden",
                        pageScrollBox: "p-0"
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Créer une Nouvelle Organisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreateOrganization 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "border-0 shadow-none bg-transparent",
                        navbar: "hidden",
                        pageScrollBox: "p-0"
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aucune Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                Vous n'appartenez à aucune organisation. Créez-en une nouvelle ou rejoignez une organisation existante.
              </p>
              
              <CreateOrganization 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "border-0 shadow-none bg-transparent",
                    navbar: "hidden",
                    pageScrollBox: "p-0"
                  }
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Organizations;