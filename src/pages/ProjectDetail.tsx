import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Target, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Edit
} from "lucide-react";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { CreateNoteForm } from "@/components/CreateNoteForm";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  progress: number;
  budget: number;
  client_id: string;
  clients?: { name: string };
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  assigned_to: string;
  profiles?: { full_name: string } | null;
}

interface Note {
  id: string;
  content: string;
  note_type: string;
  created_at: string;
  is_private: boolean;
  profiles?: { full_name: string } | null;
  task_id?: string;
  tasks?: { title: string } | null;
}

const statusColors = {
  planning: "bg-gray-500",
  active: "bg-green-500", 
  on_hold: "bg-yellow-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500"
};

const taskStatusColors = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800", 
  urgent: "bg-red-100 text-red-800"
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients (name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Project;
    },
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          profiles (full_name)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ["project-notes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_notes")
        .select(`
          *,
          profiles (full_name),
          tasks (title)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (newProgress: number) => {
      const { error } = await supabase
        .from("projects")
        .update({ progress: newProgress })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast({
        title: "Succès",
        description: "Progression mise à jour",
      });
    },
  });

  if (isLoadingProject) {
    return (
      <Layout title="Chargement...">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout title="Projet introuvable">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projet introuvable</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/projects")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
        </div>
      </Layout>
    );
  }

  const completedTasks = tasks?.filter(task => task.status === 'done').length || 0;
  const totalTasks = tasks?.length || 0;
  const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Layout title={project.title}>
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <Badge 
                variant="secondary" 
                className={priorityColors[project.priority as keyof typeof priorityColors]}
              >
                {project.priority}
              </Badge>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${statusColors[project.status as keyof typeof statusColors]}`}
                />
                <span className="capitalize">{project.status.replace('_', ' ')}</span>
              </div>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{project.progress}%</div>
              <Progress value={project.progress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                Calculé: {calculatedProgress}% ({completedTasks}/{totalTasks} tâches)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="text-2xl font-bold">
                  {project.budget ? `${project.budget.toLocaleString()}€` : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-lg font-medium">
                  {project.clients?.name || 'Aucun client'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Début: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Fin: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tâches ({totalTasks})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tâches du projet</h2>
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                  </DialogHeader>
                  <CreateTaskForm 
                    projectId={id!} 
                    onSuccess={() => setIsCreateTaskOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {tasks?.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          {task.profiles && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.profiles.full_name}
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                          {task.estimated_hours && (
                            <span>{task.estimated_hours}h estimées</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="secondary"
                          className={priorityColors[task.priority as keyof typeof priorityColors]}
                        >
                          {task.priority}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={taskStatusColors[task.status as keyof typeof taskStatusColors]}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalTasks === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune tâche pour ce projet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Notes du projet</h2>
              <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle note</DialogTitle>
                  </DialogHeader>
                  <CreateNoteForm 
                    projectId={id!} 
                    onSuccess={() => setIsCreateNoteOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {notes?.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{note.note_type}</Badge>
                        {note.is_private && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Privée
                          </Badge>
                        )}
                        {note.task_id && note.tasks && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Tâche: {note.tasks.title}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {note.profiles?.full_name} • {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {notes?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune note pour ce projet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}