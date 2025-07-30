import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, FileText, BarChart3, Settings } from 'lucide-react';

const Index = () => {
  const { userRole } = useAuth();

  const isPsy = userRole === 'PSY' || userRole === 'ADMIN_PSY';
  const isAdmin = userRole === 'ADMIN_PSY';
  const isParent = userRole === 'PARENT';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace Psychobrio Connect
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isPsy && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Patients</span>
                </CardTitle>
                <CardDescription>
                  Gérer les dossiers patients et représentants légaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/patients">Accéder aux patients</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Bilans</span>
                </CardTitle>
                <CardDescription>
                  Créer et gérer les bilans psychomoteurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/assessments">Accéder aux bilans</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Statistiques</span>
                </CardTitle>
                <CardDescription>
                  Visualiser les données et rapports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Voir les statistiques
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Administration</span>
              </CardTitle>
              <CardDescription>
                Gérer les utilisateurs, catalogues et normes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin">Accéder à l'administration</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isParent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Comptes-rendus</span>
              </CardTitle>
              <CardDescription>
                Consulter les bilans de votre enfant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/parent-portal">Voir les comptes-rendus</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
