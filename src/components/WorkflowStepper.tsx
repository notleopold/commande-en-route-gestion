
import { CheckCircle, Circle, Clock, Package, ShoppingCart, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type WorkflowStatus = 'request' | 'approve' | 'procure' | 'receive';

interface WorkflowStepperProps {
  currentStatus: WorkflowStatus;
  className?: string;
}

const steps = [
  { 
    status: 'request' as WorkflowStatus, 
    label: 'Demande', 
    icon: ShoppingCart,
    description: 'Demande créée'
  },
  { 
    status: 'approve' as WorkflowStatus, 
    label: 'Approbation', 
    icon: CheckCircle,
    description: 'En attente d\'approbation'
  },
  { 
    status: 'procure' as WorkflowStatus, 
    label: 'Commande', 
    icon: Package,
    description: 'Bon de commande envoyé'
  },
  { 
    status: 'receive' as WorkflowStatus, 
    label: 'Réception', 
    icon: Truck,
    description: 'Marchandise reçue'
  }
];

export function WorkflowStepper({ currentStatus, className = "" }: WorkflowStepperProps) {
  const currentIndex = steps.findIndex(step => step.status === currentStatus);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 border-green-600 bg-green-50';
      case 'current':
        return 'text-blue-600 border-blue-600 bg-blue-50';
      default:
        return 'text-gray-400 border-gray-300 bg-gray-50';
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'request':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">En attente</Badge>;
      case 'approve':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">À approuver</Badge>;
      case 'procure':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">En commande</Badge>;
      case 'receive':
        return <Badge variant="outline" className="text-green-600 border-green-300">Reçu</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Badge de statut global */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">Statut de la commande</h3>
        {getStatusBadge()}
      </div>

      {/* Stepper */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <div key={step.status} className="flex flex-col items-center relative">
                {/* Ligne de connexion */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-4 left-8 w-full h-0.5 ${
                      stepStatus === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                    style={{ width: 'calc(100% + 2rem)' }}
                  />
                )}
                
                {/* Icône */}
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10 ${
                    getStatusColor(stepStatus)
                  }`}
                >
                  {stepStatus === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : stepStatus === 'current' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                
                {/* Label */}
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    stepStatus === 'completed' ? 'text-green-600' :
                    stepStatus === 'current' ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
