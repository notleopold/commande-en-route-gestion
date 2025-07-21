import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { OrganizationOnboarding } from "@/components/OrganizationOnboarding";
import { useOrganizationOnboarding } from "@/hooks/useOrganizationOnboarding";

const Index = () => {
  const { showOnboarding, completeOnboarding } = useOrganizationOnboarding();

  return (
    <>
      <Layout title="Tableau de Bord">
        <Dashboard />
      </Layout>
      
      <OrganizationOnboarding 
        open={showOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  );
};

export default Index;
