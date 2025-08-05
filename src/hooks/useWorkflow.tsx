
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
      const { data: workflowData, error: workflowError } = await supabase
        .from('order_workflows')
        .select('*')
        .eq('order_id', orderIdParam)
        .single();

      if (workflowError && workflowError.code !== 'PGRST116') throw workflowError;

      if (workflowData) {
        setWorkflow(workflowData);

        // Récupérer l'historique des approbations
        const { data: approvalsData, error: approvalsError } = await supabase
          .from('workflow_approvals')
          .select('*')
          .eq('workflow_id', workflowData.id)
          .order('approved_at', { ascending: true });

        if (approvalsError) throw approvalsError;
        setApprovals(approvalsData || []);
      }
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

      const { data, error } = await supabase.rpc('advance_workflow', {
        workflow_id_param: workflowId,
        new_status: newStatus,
        approver_id: user.id,
        comments_param: comments
      });

      if (error) throw error;

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
