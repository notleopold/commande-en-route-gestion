import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkflowStatus = 'request' | 'approve' | 'procure' | 'receive';

export type WorkflowData = {
  id: string;
  order_id: string;
  current_status: WorkflowStatus;
  created_at: string;
  updated_at: string;
};

export type WorkflowApproval = {
  id: string;
  workflow_id: string;
  status: WorkflowStatus;
  approved_by: string;
  approved_at: string;
  comments?: string;
};

export function useWorkflow(orderId?: string) {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchWorkflow(orderId);
    }
  }, [orderId]);

  const fetchWorkflow = async (orderIdParam: string) => {
    setLoading(true);
    try {
      // Pour l'instant, simuler un workflow par défaut
      setWorkflow({
        id: 'temp-workflow-id',
        order_id: orderIdParam,
        current_status: 'request',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setApprovals([]);
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const advanceWorkflow = async (workflowId: string, newStatus: WorkflowStatus, comments?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Pour l'instant, simuler le succès
      console.log('Advancing workflow:', { workflowId, newStatus, comments });
      
      // Rafraîchir les données
      if (orderId) {
        await fetchWorkflow(orderId);
      }

      return true;
    } catch (error) {
      console.error('Error advancing workflow:', error);
      return false;
    }
  };

  return {
    workflow,
    approvals,
    loading,
    advanceWorkflow,
    refetch: () => orderId ? fetchWorkflow(orderId) : Promise.resolve()
  };
}