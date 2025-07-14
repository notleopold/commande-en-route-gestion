import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Eye, FileText, Calendar, User, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface DailyReport {
  id: string;
  date: string;
  user: string;
  team: string;
  tasksCompleted: string[];
  blockers: string[];
  nextTasks: string[];
  notes?: string;
  status: "submitted" | "reviewed" | "approved";
}

const mockReports: DailyReport[] = [
  {
    id: "RPT-001",
    date: "2024-01-19",
    user: "Jean Dupont",
    team: "Procurement",
    tasksCompleted: ["Traitement CMD-001", "Négociation avec fournisseur A", "Validation des prix"],
    blockers: ["Attente cotation fournisseur B", "Problème de stock chez fournisseur C"],
    nextTasks: ["Finaliser CMD-002", "Planifier expédition"],
    notes: "Journée productive avec quelques difficultés sur les négociations",
    status: "submitted"
  },
  {
    id: "RPT-002",
    date: "2024-01-19",
    user: "Marie Martin",
    team: "Logistics",
    tasksCompleted: ["Préparation conteneur CNT-001", "Coordination avec transitaire"],
    blockers: ["Retard douanes sur SHP-001"],
    nextTasks: ["Suivi livraison", "Préparation prochaine expédition"],
    status: "reviewed"
  },
];

const teams = ["Procurement", "Logistics", "Quality", "Finance"];
const users = ["Jean Dupont", "Marie Martin", "Pierre Durand", "Sophie Leroy"];

const statusMap = {
  submitted: { label: "Soumis", variant: "secondary" as const },
  reviewed: { label: "Révisé", variant: "default" as const },
  approved: { label: "Approuvé", variant: "default" as const },
};

export default function Reports() {
  const [reports, setReports] = useState<DailyReport[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  const form = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      user: "",
      team: "",
      tasksCompleted: "",
      blockers: "",
      nextTasks: "",
      notes: "",
    },
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === "all" || report.team === selectedTeam;
    const matchesDate = !selectedDate || report.date === selectedDate;
    
    return matchesSearch && matchesTeam && matchesDate;
  });

  const handleAddReport = () => {
    form.reset({
      date: new Date().toISOString().split('T')[0],
      user: "",
      team: "",
      tasksCompleted: "",
      blockers: "",
      nextTasks: "",
      notes: "",
    });
    setEditingReport(null);
    setDialogOpen(true);
  };

  const handleEditReport = (report: DailyReport) => {
    form.reset({
      date: report.date,
      user: report.user,
      team: report.team,
      tasksCompleted: report.tasksCompleted.join("\n"),
      blockers: report.blockers.join("\n"),
      nextTasks: report.nextTasks.join("\n"),
      notes: report.notes || "",
    });
    setEditingReport(report);
    setDialogOpen(true);
  };

  const handleViewReport = (report: DailyReport) => {
    setViewingReport(report);
    setViewDialogOpen(true);
  };

  const handleApproveReport = (reportId: string) => {
    setReports(prev => prev.map(r => 
      r.id === reportId 
        ? { ...r, status: "approved" as const }
        : r
    ));
    toast.success("Rapport approuvé");
  };

  const onSubmit = (data: any) => {
    const reportData = {
      ...data,
      tasksCompleted: data.tasksCompleted.split("\n").filter((t: string) => t.trim()),
      blockers: data.blockers.split("\n").filter((b: string) => b.trim()),
      nextTasks: data.nextTasks.split("\n").filter((n: string) => n.trim()),
      id: editingReport?.id || `RPT-${Date.now()}`,
      status: editingReport?.status || "submitted",
    };

    if (editingReport) {
      setReports(prev => prev.map(r => r.id === editingReport.id ? reportData : r));
      toast.success("Rapport modifié avec succès");
    } else {
      setReports(prev => [...prev, reportData]);
      toast.success("Rapport soumis avec succès");
    }
    
    setDialogOpen(false);
    form.reset();
  };

  const totalBlockers = reports.reduce((sum, r) => sum + r.blockers.length, 0);

  return (
    <Layout title="Rapports Quotidiens">
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rapports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.filter(r => r.status === "submitted").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocages Actifs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBlockers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipes Actives</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(reports.map(r => r.team)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rapport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les équipes</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddReport}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingReport ? "Modifier le rapport quotidien" : "Nouveau rapport quotidien"}
                </DialogTitle>
                <DialogDescription>
                  {editingReport ? "Modifiez votre rapport quotidien" : "Saisissez votre rapport d'activité quotidien"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilisateur</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map(user => (
                                <SelectItem key={user} value={user}>{user}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="team"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Équipe</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map(team => (
                                <SelectItem key={team} value={team}>{team}</SelectItem>
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
                    name="tasksCompleted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tâches accomplies (une par ligne)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="- Traitement de la commande CMD-001&#10;- Négociation avec le fournisseur&#10;- Validation des prix"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="blockers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blocages rencontrés (une par ligne)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="- Attente de cotation du fournisseur B&#10;- Problème de stock chez le fournisseur C"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nextTasks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prochaines tâches (une par ligne)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="- Finaliser la commande CMD-002&#10;- Planifier l'expédition&#10;- Contacter le transitaire"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes supplémentaires</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Commentaires, observations, points d'attention..."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingReport ? "Modifier" : "Soumettre"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table des rapports */}
        <Card>
          <CardHeader>
            <CardTitle>Rapports quotidiens</CardTitle>
            <CardDescription>
              Suivi des activités quotidiennes des équipes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead>Tâches</TableHead>
                  <TableHead>Blocages</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {new Date(report.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{report.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.team}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {report.tasksCompleted.length} tâche(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {report.blockers.length > 0 && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {report.blockers.length} blocage(s)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[report.status].variant}>
                        {statusMap[report.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReport(report)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {report.status === "submitted" && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveReport(report.id)}
                          >
                            Approuver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de visualisation */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rapport du {viewingReport && new Date(viewingReport.date).toLocaleDateString()}</DialogTitle>
              <DialogDescription>Par {viewingReport?.user} - {viewingReport?.team}</DialogDescription>
            </DialogHeader>
            {viewingReport && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Tâches accomplies</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {viewingReport.tasksCompleted.map((task, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{task}</li>
                    ))}
                  </ul>
                </div>
                
                {viewingReport.blockers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Blocages rencontrés
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {viewingReport.blockers.map((blocker, index) => (
                        <li key={index} className="text-sm text-muted-foreground">{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Prochaines tâches</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {viewingReport.nextTasks.map((task, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{task}</li>
                    ))}
                  </ul>
                </div>
                
                {viewingReport.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{viewingReport.notes}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Statut</h4>
                      <Badge variant={statusMap[viewingReport.status].variant}>
                        {statusMap[viewingReport.status].label}
                      </Badge>
                    </div>
                    {viewingReport.status === "submitted" && (
                      <Button onClick={() => {
                        handleApproveReport(viewingReport.id);
                        setViewDialogOpen(false);
                      }}>
                        Approuver ce rapport
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}