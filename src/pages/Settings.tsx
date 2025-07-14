import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail,
  Globe,
  Palette,
  Save,
  RefreshCw
} from "lucide-react";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    orders: true,
    logistics: false,
    security: true
  });

  const [profile, setProfile] = useState({
    name: "Jean Dupont",
    email: "jean.dupont@entreprise.fr",
    company: "Procurement Solutions",
    phone: "+33 1 23 45 67 89"
  });

  return (
    <Layout title="Paramètres">
      <div className="space-y-6">
        <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Système
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations du Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input 
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({...profile, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea 
                  id="bio"
                  placeholder="Parlez-nous de vous..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications importantes par email
                  </p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes commandes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les nouvelles commandes et changements de statut
                  </p>
                </div>
                <Switch 
                  checked={notifications.orders}
                  onCheckedChange={(checked) => setNotifications({...notifications, orders: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mises à jour logistiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les expéditions et livraisons
                  </p>
                </div>
                <Switch 
                  checked={notifications.logistics}
                  onCheckedChange={(checked) => setNotifications({...notifications, logistics: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de sécurité</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications importantes concernant la sécurité de votre compte
                  </p>
                </div>
                <Switch 
                  checked={notifications.security}
                  onCheckedChange={(checked) => setNotifications({...notifications, security: checked})}
                />
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité et Authentification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Changer le mot de passe</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button className="w-fit">
                    Changer le mot de passe
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sessions actives</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Session actuelle</p>
                      <p className="text-sm text-muted-foreground">Paris, France • Chrome sur Windows</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actuelle</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Mobile</p>
                      <p className="text-sm text-muted-foreground">Lyon, France • Safari sur iPhone</p>
                    </div>
                    <Button variant="outline" size="sm">Déconnecter</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Paramètres généraux</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Synchronisation automatique</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Sauvegarde automatique</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Mode maintenance</Label>
                      <Switch />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Actions système</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Synchroniser les données
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="mr-2 h-4 w-4" />
                      Exporter les données
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-800">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Réinitialiser les paramètres
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Apparence et Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Thème</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 cursor-pointer hover:border-primary">
                    <div className="space-y-2">
                      <div className="h-2 bg-background border rounded"></div>
                      <div className="h-1 bg-muted rounded w-3/4"></div>
                      <div className="h-1 bg-muted rounded w-1/2"></div>
                    </div>
                    <p className="text-sm font-medium mt-2">Clair</p>
                  </div>
                  <div className="border rounded-lg p-3 cursor-pointer hover:border-primary border-primary">
                    <div className="space-y-2 bg-slate-900 p-2 rounded">
                      <div className="h-2 bg-slate-700 rounded"></div>
                      <div className="h-1 bg-slate-600 rounded w-3/4"></div>
                      <div className="h-1 bg-slate-600 rounded w-1/2"></div>
                    </div>
                    <p className="text-sm font-medium mt-2">Sombre</p>
                  </div>
                  <div className="border rounded-lg p-3 cursor-pointer hover:border-primary">
                    <div className="space-y-2">
                      <div className="h-2 bg-gradient-to-r from-background to-slate-900 rounded"></div>
                      <div className="h-1 bg-muted rounded w-3/4"></div>
                      <div className="h-1 bg-muted rounded w-1/2"></div>
                    </div>
                    <p className="text-sm font-medium mt-2">Auto</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Langue et région</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Français (France)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <span className="text-sm">Europe/Paris (UTC+1)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;