-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2),
  client_id UUID REFERENCES public.clients(id),
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),
  dependencies UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_notes table
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'decision', 'issue', 'milestone')),
  created_by UUID REFERENCES auth.users(id),
  is_private BOOLEAN DEFAULT false,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table for team assignments
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects they are assigned to or created" 
ON public.projects FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR 
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Project creators and managers can update projects" 
ON public.projects FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE POLICY "Project creators and managers can delete projects" 
ON public.projects FOR DELETE 
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
);

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks from accessible projects" 
ON public.tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = tasks.project_id AND (
      auth.uid() = p.created_by OR 
      auth.uid() = p.assigned_to OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can create tasks in accessible projects" 
ON public.tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = tasks.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid() AND role IN ('owner', 'manager', 'member'))
    )
  )
);

CREATE POLICY "Users can update tasks they created or are assigned to" 
ON public.tasks FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = tasks.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
    )
  )
);

CREATE POLICY "Users can delete tasks they created or in managed projects" 
ON public.tasks FOR DELETE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = tasks.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
    )
  )
);

-- RLS Policies for project_notes
CREATE POLICY "Users can view notes from accessible projects (excluding private notes from others)" 
ON public.project_notes FOR SELECT 
USING (
  (is_private = false OR auth.uid() = created_by) AND
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_notes.project_id AND (
      auth.uid() = p.created_by OR 
      auth.uid() = p.assigned_to OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can create notes in accessible projects" 
ON public.project_notes FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_notes.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can update their own notes" 
ON public.project_notes FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own notes" 
ON public.project_notes FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for project_members
CREATE POLICY "Users can view members of projects they have access to" 
ON public.project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_members.project_id AND (
      auth.uid() = p.created_by OR 
      auth.uid() = p.assigned_to OR 
      EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Project owners and managers can add members" 
ON public.project_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_members.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'manager'))
    )
  )
);

CREATE POLICY "Project owners and managers can update member roles" 
ON public.project_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_members.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'manager'))
    )
  )
);

CREATE POLICY "Project owners and managers can remove members" 
ON public.project_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_members.project_id AND (
      auth.uid() = p.created_by OR 
      EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'manager'))
    )
  )
);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_notes_updated_at
    BEFORE UPDATE ON public.project_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX idx_project_notes_project_id ON public.project_notes(project_id);
CREATE INDEX idx_project_notes_task_id ON public.project_notes(task_id);
CREATE INDEX idx_project_notes_created_by ON public.project_notes(created_by);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);