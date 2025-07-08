import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Plus, Edit, Trash2, Copy } from "lucide-react";
import { MaterialCost, LaborCost, OutsourcingCost } from "./types";
import { toast } from "@/hooks/use-toast";

interface ProductTemplate {
  id: string;
  name: string;
  type: 'ring' | 'gift';
  category: string;
  materials: MaterialCost[];
  outsourcing: OutsourcingCost[];
  labor: LaborCost[];
  packaging: number;
  description: string;
  createdAt: string;
}

interface ProductTemplatesProps {
  onTemplateSelect: (template: ProductTemplate) => void;
}

export const ProductTemplates = ({ onTemplateSelect }: ProductTemplatesProps) => {
  const [templates, setTemplates] = useState<ProductTemplate[]>(() => {
    const saved = localStorage.getItem('productTemplates');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'ring' as 'ring' | 'gift',
    category: '',
    description: ''
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'anilhas-pequenas', 'anilhas-grandes', 'brindes-metal', 'brindes-plastico', 'personalizado'];

  const saveTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Erro",
        description: "Informe o nome do template",
        variant: "destructive"
      });
      return;
    }

    const template: ProductTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
      materials: [],
      outsourcing: [],
      labor: [],
      packaging: 0,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem('productTemplates', JSON.stringify(updatedTemplates));
    
    setNewTemplate({ name: '', type: 'ring', category: '', description: '' });
    setIsDialogOpen(false);
    
    toast({
      title: "Template salvo",
      description: "Template criado com sucesso!"
    });
  };

  const deleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('productTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template removido",
      description: "Template excluído com sucesso!"
    });
  };

  const duplicateTemplate = (template: ProductTemplate) => {
    const duplicated = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Cópia)`,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, duplicated];
    setTemplates(updatedTemplates);
    localStorage.setItem('productTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template duplicado",
      description: "Template copiado com sucesso!"
    });
  };

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Templates de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="category-filter">Filtrar por categoria:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="anilhas-pequenas">Anilhas Pequenas</SelectItem>
                  <SelectItem value="anilhas-grandes">Anilhas Grandes</SelectItem>
                  <SelectItem value="brindes-metal">Brindes Metal</SelectItem>
                  <SelectItem value="brindes-plastico">Brindes Plástico</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Nome do Template</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="ex: Anilha Alumínio Padrão"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Tipo</Label>
                    <Select value={newTemplate.type} onValueChange={(value: 'ring' | 'gift') => setNewTemplate({ ...newTemplate, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ring">Anilha</SelectItem>
                        <SelectItem value="gift">Brinde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-category">Categoria</Label>
                    <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anilhas-pequenas">Anilhas Pequenas</SelectItem>
                        <SelectItem value="anilhas-grandes">Anilhas Grandes</SelectItem>
                        <SelectItem value="brindes-metal">Brindes Metal</SelectItem>
                        <SelectItem value="brindes-plastico">Brindes Plástico</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-description">Descrição</Label>
                    <Input
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Descrição do template"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={saveTemplate}>
                      Salvar Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template encontrado</p>
                <p className="text-sm">Crie um template para reutilizar configurações de produtos</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge variant="secondary">
                          {template.type === 'ring' ? 'Anilha' : 'Brinde'}
                        </Badge>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTemplateSelect(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};