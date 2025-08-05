
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkflow, WorkflowStatus } from "@/hooks/useWorkflow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Package, Truck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WorkflowActionsProps {
  orderId: string;
  currentStatus: WorkflowStatus;
  workflowId: string;
  onStatusChange?: () => void;
}

export function WorkflowActions({ orderId, currentStatus, workflowId, onStatusChange }: WorkflowActionsProps) {
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { advanceWorkflow } = useWorkflow();

  const getNextAction = (): { status: WorkflowStatus; label: string; icon: any; description: string } | null => {
    switch (currentStatus) {
      case 'request':
        if (hasPermission('orders', 'approve')) {
          return {
            status: 'approve',
            label: 'Approuver',
            icon: CheckCircle,
            description: 'Approuver cette demande d\'achat'
          };
        }
        break;
      case 'approve':
        if (hasPermission('orders', 'procure')) {
          return {
            status: 'procure',
            label: 'Passer commande',
            icon: Package,
            description: 'Envoyer le bon de commande au fournisseur'
          };
        }
        break;
      case 'procure':
        if (hasPermission('orders', 'receive')) {
          return {
            status: 'receive',
            label: 'Marquer comme reçu',
            icon: Truck,
            description: 'Confirmer la réception des marchandises'
          };
        }
        break;
    }
    return null;
  };

  const handleAdvance = async (newStatus: WorkflowStatus) => {
    setIsProcessing(true);
    try {
      const success = await advanceWorkflow(workflowId, newStatus, comments.trim() || undefined);
      if (success) {
        toast.success('Statut mis à jour avec succès');
        setComments("");
        setDialogOpen(false);
        onStatusChange?.();
      } else {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextAction = getNextAction();

  if (!nextAction) {
    return null;
  }

  const Icon = nextAction.icon;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Icon className="w-4 h-4" />
          {nextAction.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {nextAction.label}
          </DialogTitle>
          <DialogDescription>
            {nextAction.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Confirmation requise
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Cette action fera passer la commande à l'étape suivante du workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires (optionnel)</Label>
            <Textarea
              id="comments"
              placeholder="Ajoutez un commentaire sur cette action..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={() => handleAdvance(nextAction.status)}
            disabled={isProcessing}
          >
            {isProcessing ? "En cours..." : nextAction.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
