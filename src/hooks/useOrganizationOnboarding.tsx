import { useState, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/clerk-react";

export function useOrganizationOnboarding() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && !organization) {
      // Check if user has seen onboarding before
      const hasSeenOnboarding = localStorage.getItem(`clerk-org-onboarding-${user.id}`);
      
      if (!hasSeenOnboarding) {
        // Small delay to let the app load properly
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, organization]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`clerk-org-onboarding-${user.id}`, "completed");
    }
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    completeOnboarding
  };
}