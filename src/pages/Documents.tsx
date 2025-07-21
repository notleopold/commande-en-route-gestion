import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Eye, 
  Search,
  Grid,
  List,
  Filter,
  Trash2,
  Edit2,
  FileIcon,
  Calendar,
  User,
  HardDrive,
  Maximize2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FileItem {
  id: string;
  name: string;
  size: number;
  created_at: string;
  updated_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl?: string;
  };
  owner?: string;
}

interface UploadProgress {
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const MIME_TYPE_CATEGORIES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

export default function Documents() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 1000,
          offset: 0,
        });

      if (error) throw error;

      const filesWithDetails: FileItem[] = data?.map(file => ({
        id: file.id || file.name,
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString(),
        metadata: {
          size: file.metadata?.size || 0,
          mimetype: file.metadata?.mimetype || 'application/octet-stream',
          cacheControl: file.metadata?.cacheControl
        },
        owner: file.owner
      })) || [];

      setFiles(filesWithDetails);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fichiers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    let filtered = [...files];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(file => {
        const mimetype = file.metadata.mimetype;
        const category = Object.keys(MIME_TYPE_CATEGORIES).find(cat =>
          MIME_TYPE_CATEGORIES[cat as keyof typeof MIME_TYPE_CATEGORIES].includes(mimetype)
        );
        return category === filterType;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFiles(filtered);
  }, [files, searchTerm, filterType, sortBy, sortOrder]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    const newUploads: UploadProgress[] = uploadedFiles.map(file => ({
      name: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploading(prev => [...prev, ...newUploads]);
    setUploadDialogOpen(true);

    for (const file of uploadedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        setUploading(prev => prev.map(upload => 
          upload.name === file.name 
            ? { ...upload, progress: 100, status: 'completed' as const }
            : upload
        ));

        toast({
          title: "Succès",
          description: `${file.name} uploadé avec succès`,
        });

      } catch (error) {
        console.error('Upload error:', error);
        setUploading(prev => prev.map(upload => 
          upload.name === file.name 
            ? { ...upload, status: 'error' as const }
            : upload
        ));
        
        toast({
          title: "Erreur",
          description: `Erreur lors de l'upload de ${file.name}`,
          variant: "destructive",
        });
      }
    }

    // Refresh file list
    await fetchFiles();
    
    // Clear uploads after 3 seconds
    setTimeout(() => {
      setUploading([]);
      setUploadDialogOpen(false);
    }, 3000);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(file.name);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([file.name]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Fichier supprimé avec succès",
      });
      
      await fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimetype.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimetype === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileCategory = (mimetype: string) => {
    const category = Object.keys(MIME_TYPE_CATEGORIES).find(cat =>
      MIME_TYPE_CATEGORIES[cat as keyof typeof MIME_TYPE_CATEGORIES].includes(mimetype)
    );
    return category || 'other';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canPreview = (mimetype: string) => {
    return mimetype.startsWith('image/') || 
           mimetype === 'application/pdf' || 
           mimetype.startsWith('video/') ||
           mimetype.startsWith('text/');
  };

  const renderPreview = (file: FileItem) => {
    const mimetype = file.metadata.mimetype;
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(file.name);
    const publicUrl = urlData.publicUrl;

    if (mimetype.startsWith('image/')) {
      return <img src={publicUrl} alt={file.name} className="max-w-full max-h-96 object-contain" />;
    }
    
    if (mimetype === 'application/pdf') {
      return <iframe src={publicUrl} className="w-full h-96" title={file.name} />;
    }
    
    if (mimetype.startsWith('video/')) {
      return <video src={publicUrl} controls className="max-w-full max-h-96" />;
    }
    
    if (mimetype.startsWith('text/')) {
      return (
        <div className="w-full h-96 p-4 bg-muted rounded border">
          <p className="text-sm text-muted-foreground">Aperçu textuel non disponible - Téléchargez le fichier pour le voir</p>
        </div>
      );
    }

    return (
      <div className="w-full h-96 flex items-center justify-center bg-muted rounded">
        <p className="text-muted-foreground">Aperçu non disponible pour ce type de fichier</p>
      </div>
    );
  };

  return (
    <Layout title="Documents">
      <div className="space-y-6">
        {/* Header with Upload */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gestionnaire de Documents</h1>
            <p className="text-muted-foreground">Gérez vos fichiers et documents</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Uploader des fichiers
              </label>
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des fichiers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="spreadsheet">Tableurs</SelectItem>
                <SelectItem value="video">Vidéos</SelectItem>
                <SelectItem value="archive">Archives</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="size">Taille</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Upload Progress Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload en cours</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {uploading.map((upload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{upload.name}</span>
                    <span className={
                      upload.status === 'completed' ? 'text-green-600' :
                      upload.status === 'error' ? 'text-red-600' : 'text-blue-600'
                    }>
                      {upload.status === 'completed' ? 'Terminé' :
                       upload.status === 'error' ? 'Erreur' : `${upload.progress}%`}
                    </span>
                  </div>
                  <Progress value={upload.status === 'completed' ? 100 : upload.progress} />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* File Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="truncate">{selectedFile?.name}</DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedFile && handleDownload(selectedFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Taille: {formatFileSize(selectedFile.size)}</span>
                  <span>Type: {selectedFile.metadata.mimetype}</span>
                  <span>Créé: {formatDate(selectedFile.created_at)}</span>
                </div>
                {renderPreview(selectedFile)}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Files Content */}
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card className="p-8 text-center">
            <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun fichier trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'Aucun fichier ne correspond à vos critères de recherche.'
                : 'Commencez par uploader des fichiers.'}
            </p>
          </Card>
        ) : viewMode === 'list' ? (
          <Card>
            <div className="divide-y">
              {filteredFiles.map((file) => (
                <div key={file.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.metadata.mimetype)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.created_at)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getFileCategory(file.metadata.mimetype)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canPreview(file.metadata.mimetype) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(file);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getFileIcon(file.metadata.mimetype)}
                    <Badge variant="secondary" className="text-xs">
                      {getFileCategory(file.metadata.mimetype)}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="font-medium truncate text-sm" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(file.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {canPreview(file.metadata.mimetype) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedFile(file);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(file)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}