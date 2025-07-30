import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Database, 
  Settings, 
  BarChart3, 
  Shield,
  BookOpen,
  Clipboard
} from 'lucide-react';
import CreateUserDialog from '@/components/admin/CreateUserDialog';
import CatalogManager from '@/components/admin/catalog/CatalogManager';

const Admin = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">
          Gérer les utilisateurs, catalogues, normes et paramètres système
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="norms">Normes</TabsTrigger>
          <TabsTrigger value="templates">Gabarits</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Gestion des utilisateurs</span>
              </CardTitle>
              <CardDescription>
                Créer, modifier et gérer les comptes utilisateurs et leurs rôles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">3</p>
                        <p className="text-sm text-muted-foreground">Rôles configurés</p>
                      </div>
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 space-x-2">
                <CreateUserDialog />
                <Button variant="outline">Gérer les rôles</Button>
                <Button variant="outline">Configuration 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <CatalogManager />
        </TabsContent>

        <TabsContent value="norms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Normes et référentiels</span>
              </CardTitle>
              <CardDescription>
                Importer et gérer les normes de référence pour le calcul des percentiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">89</p>
                        <p className="text-sm text-muted-foreground">Normes configurées</p>
                      </div>
                      <Database className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">3</p>
                        <p className="text-sm text-muted-foreground">Versions actives</p>
                      </div>
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 space-x-2">
                <Button>Importer normes CSV</Button>
                <Button variant="outline">Importer normes JSON</Button>
                <Button variant="outline">Historique des versions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center space-x-2">
                <Clipboard className="h-5 w-5" />
                <span>Gabarits de bilans</span>
              </CardTitle>
              <CardDescription>
                Créer et gérer les modèles de bilans avec sélections d'items prédéfinies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">5</p>
                        <p className="text-sm text-muted-foreground">Gabarits actifs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">1</p>
                        <p className="text-sm text-muted-foreground">Gabarit par défaut</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 space-x-2">
                <Button>Nouveau gabarit</Button>
                <Button variant="outline">Dupliquer gabarit</Button>
                <Button variant="outline">Gérer les versions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Paramètres système</span>
              </CardTitle>
              <CardDescription>
                Configuration générale, seuils, identité visuelle et intégrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="h-20 flex-col">
                    <Settings className="h-8 w-8 mb-2" />
                    Seuils percentiles
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <FileText className="h-8 w-8 mb-2" />
                    Modèles de prompts LLM
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Database className="h-8 w-8 mb-2" />
                    Configuration stockage
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Shield className="h-8 w-8 mb-2" />
                    Textes de consentement
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Journal d'audit</span>
              </CardTitle>
              <CardDescription>
                Traçabilité des actions utilisateurs et téléchargements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Journal d'audit à implémenter
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;