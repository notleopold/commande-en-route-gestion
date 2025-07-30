import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const noteSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
  note_type: z.enum(["general", "meeting", "decision", "issue", "milestone"]),
  task_id: z.string().optional(),
  is_private: z.boolean().default(false),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface CreateNoteFormProps {
  projectId: string;
  onSuccess: () => void;
}

export function CreateNoteForm({ projectId, onSuccess }: CreateNoteFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: "",
      note_type: "general",
      is_private: false,
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("project_id", projectId)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Non authentifié");

      const { error } = await supabase.from("project_notes").insert({
        project_id: projectId,
        content: data.content,
        note_type: data.note_type,
        task_id: data.task_id || null,
        is_private: data.is_private,
        created_by: user.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notes", projectId] });
      toast({
        title: "Succès",
        description: "Note créée avec succès",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Erreur lors de la création:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la note",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu de la note</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Écrivez votre note ici..." 
                  rows={6}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="note_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de note</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="meeting">Réunion</SelectItem>
                    <SelectItem value="decision">Décision</SelectItem>
                    <SelectItem value="issue">Problème</SelectItem>
                    <SelectItem value="milestone">Jalon</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="task_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tâche associée (optionnel)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une tâche" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Aucune tâche</SelectItem>
                    {tasks?.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_private"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Note privée</FormLabel>
                <FormDescription>
                  Seuls vous et les gestionnaires du projet pourront voir cette note
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button type="submit" disabled={createNoteMutation.isPending}>
            {createNoteMutation.isPending ? "Création..." : "Créer la note"}
          </Button>
        </div>
      </form>
    </Form>
  );
}