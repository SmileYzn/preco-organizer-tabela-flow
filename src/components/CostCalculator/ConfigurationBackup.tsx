import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Save, Trash2, Settings, FileText, AlertCircle } from "lucide-react";
import { GlobalSettings } from "./types";
import { toast } from "@/hooks/use-toast";

interface ConfigurationBackupProps {
  globalSettings: GlobalSettings;
  onSettingsRestore: (settings: GlobalSettings) => void;
}

interface BackupData {
  globalSettings: GlobalSettings;
  productTemplates: any[];
  savedProducts: any[];
  priceHistory: any[];
  smartAlerts: any[];
  alertSettings: any;
  timestamp: string;
  version: string;
}

interface SavedBackup {
  id: string;
  name: string;
  description: string;
  data: BackupData;
  createdAt: string;
}

export const ConfigurationBackup = ({ globalSettings, onSettingsRestore }: ConfigurationBackupProps) => {
  const [savedBackups, setSavedBackups] = useState<SavedBackup[]>(() => {
    const saved = localStorage.getItem('configurationBackups');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [importData, setImportData] = useState('');

  const createBackup = () => {
    if (!backupName.trim()) {
      toast({
        title: "Erro",
        description: "Informe o nome do backup",
        variant: "destructive"
      });
      return;
    }

    const backupData: BackupData = {
      globalSettings,
      productTemplates: JSON.parse(localStorage.getItem('productTemplates') || '[]'),
      savedProducts: JSON.parse(localStorage.getItem('savedProducts') || '[]'),
      priceHistory: JSON.parse(localStorage.getItem('priceHistory') || '[]'),
      smartAlerts: JSON.parse(localStorage.getItem('smartAlerts') || '[]'),
      alertSettings: JSON.parse(localStorage.getItem('smartAlertSettings') || '{}'),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const newBackup: SavedBackup = {
      id: Date.now().toString(),
      name: backupName,
      description: backupDescription,
      data: backupData,
      createdAt: new Date().toISOString()
    };

    const updatedBackups = [...savedBackups, newBackup];
    setSavedBackups(updatedBackups);
    localStorage.setItem('configurationBackups', JSON.stringify(updatedBackups));
    
    setBackupName('');
    setBackupDescription('');
    
    toast({
      title: "Backup criado",
      description: "Configuração salva com sucesso!"
    });
  };

  const restoreBackup = (backup: SavedBackup) => {
    try {
      const { data } = backup;
      
      // Restaurar configurações globais
      onSettingsRestore(data.globalSettings);
      
      // Restaurar dados do localStorage
      localStorage.setItem('productTemplates', JSON.stringify(data.productTemplates));
      localStorage.setItem('savedProducts', JSON.stringify(data.savedProducts));
      localStorage.setItem('priceHistory', JSON.stringify(data.priceHistory));
      localStorage.setItem('smartAlerts', JSON.stringify(data.smartAlerts));
      localStorage.setItem('smartAlertSettings', JSON.stringify(data.alertSettings));
      
      toast({
        title: "Backup restaurado",
        description: "Configurações restauradas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao restaurar backup",
        variant: "destructive"
      });
    }
  };

  const deleteBackup = (backupId: string) => {
    const updatedBackups = savedBackups.filter(b => b.id !== backupId);
    setSavedBackups(updatedBackups);
    localStorage.setItem('configurationBackups', JSON.stringify(updatedBackups));
    
    toast({
      title: "Backup removido",
      description: "Backup excluído com sucesso!"
    });
  };

  const exportBackup = (backup: SavedBackup) => {
    const jsonData = JSON.stringify(backup.data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${backup.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAllData = () => {
    const allData = {
      globalSettings,
      productTemplates: JSON.parse(localStorage.getItem('productTemplates') || '[]'),
      savedProducts: JSON.parse(localStorage.getItem('savedProducts') || '[]'),
      priceHistory: JSON.parse(localStorage.getItem('priceHistory') || '[]'),
      smartAlerts: JSON.parse(localStorage.getItem('smartAlerts') || '[]'),
      alertSettings: JSON.parse(localStorage.getItem('smartAlertSettings') || '{}'),
      backups: savedBackups,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const jsonData = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculadora_custos_completo_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = () => {
    if (!importData.trim()) {
      toast({
        title: "Erro",
        description: "Cole os dados do backup",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsedData = JSON.parse(importData);
      
      // Validar estrutura do backup
      if (!parsedData.globalSettings || !parsedData.timestamp) {
        throw new Error('Formato de backup inválido');
      }

      // Criar backup com dados importados
      const newBackup: SavedBackup = {
        id: Date.now().toString(),
        name: `Backup Importado ${new Date().toLocaleDateString('pt-BR')}`,
        description: 'Backup importado de arquivo externo',
        data: parsedData,
        createdAt: new Date().toISOString()
      };

      const updatedBackups = [...savedBackups, newBackup];
      setSavedBackups(updatedBackups);
      localStorage.setItem('configurationBackups', JSON.stringify(updatedBackups));
      
      setImportData('');
      
      toast({
        title: "Backup importado",
        description: "Backup importado com sucesso! Você pode restaurá-lo quando quiser."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Formato de backup inválido",
        variant: "destructive"
      });
    }
  };

  const getBackupSize = (backup: SavedBackup) => {
    const size = JSON.stringify(backup.data).length;
    return size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} bytes`;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Backup e Restauração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Criar Novo Backup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Criar Novo Backup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup-name">Nome do Backup</Label>
                <Input
                  id="backup-name"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="ex: Configuração Janeiro 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-description">Descrição</Label>
                <Input
                  id="backup-description"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>
            <Button onClick={createBackup} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Criar Backup
            </Button>
          </div>

          <Separator />

          {/* Importar/Exportar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Importar/Exportar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Button onClick={exportAllData} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Todos os Dados
                </Button>
                <p className="text-sm text-muted-foreground">
                  Exporta todas as configurações, produtos e histórico
                </p>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Cole aqui os dados do backup em JSON..."
                  rows={3}
                />
                <Button onClick={importBackup} variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Backup
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Backups Salvos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Backups Salvos</h3>
            
            {savedBackups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum backup salvo</p>
                <p className="text-sm">Crie um backup para proteger suas configurações</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedBackups.map((backup) => (
                  <Card key={backup.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{backup.name}</h4>
                            <Badge variant="outline">{getBackupSize(backup)}</Badge>
                          </div>
                          {backup.description && (
                            <p className="text-sm text-muted-foreground">{backup.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Criado em: {new Date(backup.createdAt).toLocaleString('pt-BR')}</span>
                            <span>Versão: {backup.data.version}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreBackup(backup)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportBackup(backup)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBackup(backup.id)}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Avisos Importantes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Os backups são salvos localmente no seu navegador. 
              Para maior segurança, exporte regularmente seus dados para um arquivo externo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};