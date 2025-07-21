import React from "react";
import { UserProfile } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";

const Profile = () => {
  return (
    <Layout title="Mon Profil">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profil Utilisateur</h1>
          <p className="text-muted-foreground">
            Gérez votre profil, sécurité et préférences
          </p>
        </div>
        
        <div className="bg-background rounded-lg border">
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "border-0 shadow-none bg-transparent",
                navbar: "hidden",
                pageScrollBox: "p-0"
              }
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Profile;