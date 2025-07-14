import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "ATTENTION CETTE ACTION EST IRRÉVERSIBLE",
  description,
  itemName,
  confirmText = "Oui, supprimer définitivement",
  cancelText = "Annuler"
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border-destructive border-2">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle className="text-destructive">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-lg">
            {description}
            {itemName && (
              <>
                {" "}
                <span className="font-bold text-destructive">
                  {itemName}
                </span>
              </>
            )}
            ?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">
              Cette action ne peut pas être annulée. Toutes les données liées seront définitivement perdues.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}