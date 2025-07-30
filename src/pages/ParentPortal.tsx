import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';

const ParentPortal = () => {
  // Mock data - à remplacer par de vraies données
  const reports = [
    {
      id: '1',
      patientName: 'Emma Martin',
      date: '2024-01-15',
      practitioner: 'Dr. Sophie Dubois',
      status: 'SHARED',
      downloadCount: 2,
    },
    {
      id: '2',
      patientName: 'Emma Martin',
      date: '2023-12-10',
      practitioner: 'Dr. Sophie Dubois',
      status: 'SHARED',
      downloadCount: 1,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portail Parents</h1>
        <p className="text-muted-foreground">
          Consultez les comptes-rendus de bilans psychomoteurs de votre enfant
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Comptes-rendus disponibles</span>
            </CardTitle>
            <CardDescription>
              Les bilans validés et partagés par les professionnels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucun compte-rendu disponible pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{report.patientName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Bilan du {new Date(report.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Praticien: {report.practitioner}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="default">Disponible</Badge>
                            <span className="text-xs text-muted-foreground">
                              Téléchargé {report.downloadCount} fois
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Consulter
                          </Button>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consentements</CardTitle>
            <CardDescription>
              Gérer vos autorisations de partage et de traitement des données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Partage des comptes-rendus</h4>
                  <p className="text-sm text-muted-foreground">
                    Autorisation de recevoir les bilans par email
                  </p>
                </div>
                <Badge variant="default">Actif</Badge>
              </div>
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Traitement des données</h4>
                  <p className="text-sm text-muted-foreground">
                    Consentement pour le traitement des données de santé
                  </p>
                </div>
                <Badge variant="default">Actif</Badge>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline">
                Gérer les consentements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentPortal;