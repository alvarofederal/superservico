import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Não usado aqui diretamente
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, XCircle } from 'lucide-react'; // Settings removido pois não usado
import { Switch } from '@/components/ui/switch';

// Definindo PARAM_CATEGORIES aqui, pois estava faltando
const PARAM_CATEGORIES = ['Geral', 'Licenciamento', 'Funcionalidades', 'Limites', 'Preços', 'Planos'];

const UserParametersEditor = ({ userId, userFullName, onCancel }) => {
  const [definitions, setDefinitions] = useState([]);
  const [userParameters, setUserParameters] = useState({}); // { definition_id: value }
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchParametersData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: defData, error: defError } = await supabase
        .from('system_parameters_definitions')
        .select('*')
        .order('category')
        .order('parameter_key');
      if (defError) throw defError;
      setDefinitions(defData || []);

      const { data: userParamData, error: userParamError } = await supabase
        .from('user_parameters')
        .select('parameter_definition_id, parameter_value')
        .eq('user_id', userId);
      if (userParamError) throw userParamError;
      
      const paramsMap = (userParamData || []).reduce((acc, param) => {
        acc[param.parameter_definition_id] = param.parameter_value;
        return acc;
      }, {});
      setUserParameters(paramsMap);

    } catch (error) {
      toast({ title: "Erro ao carregar parâmetros", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchParametersData();
    }
  }, [userId, fetchParametersData]);

  const handleValueChange = (definitionId, value) => {
    setUserParameters(prev => ({ ...prev, [definitionId]: value }));
  };

  const handleSaveParameters = async () => {
    setIsSaving(true);
    try {
      const upsertPromises = definitions.map(def => {
        const value = userParameters[def.id];
        
        if (value !== undefined && value !== null && String(value).trim() !== '') { // Salva se houver valor e não for só espaço
            return supabase.from('user_parameters').upsert(
            {
              user_id: userId,
              parameter_definition_id: def.id,
              parameter_value: String(value), 
            },
            { onConflict: 'user_id,parameter_definition_id' }
          );
        } else {
            // Se o valor for removido (undefined/null/string vazia) e existe um registro, deleta.
            return supabase.from('user_parameters')
                .delete()
                .match({ user_id: userId, parameter_definition_id: def.id });
        }
      });

      const results = await Promise.all(upsertPromises.filter(p => p)); 
      results.forEach(res => {
        if (res.error) throw res.error;
      });

      toast({ title: "Sucesso!", description: `Parâmetros para ${userFullName} salvos.` });
      if (onCancel) onCancel(); 
    } catch (error) {
      toast({ title: "Erro ao salvar parâmetros", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputForType = (definition) => {
    const value = userParameters[definition.id] ?? definition.default_value ?? '';
    
    switch (definition.value_type) {
      case 'string':
        return <Input type="text" value={value} onChange={(e) => handleValueChange(definition.id, e.target.value)} placeholder={definition.default_value || "Texto"} />;
      case 'number':
        return <Input type="number" value={value} onChange={(e) => handleValueChange(definition.id, e.target.value)} placeholder={definition.default_value || "Número"} />;
      case 'date':
        return <Input type="date" value={value} onChange={(e) => handleValueChange(definition.id, e.target.value)} placeholder={definition.default_value || ""}/>;
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={`param-${definition.id}`}
              checked={String(value).toLowerCase() === 'true'}
              onCheckedChange={(checked) => handleValueChange(definition.id, String(checked))}
            />
            <Label htmlFor={`param-${definition.id}`}>{String(value).toLowerCase() === 'true' ? "Verdadeiro" : "Falso"}</Label>
          </div>
        );
      default:
        return <Input type="text" value={value} onChange={(e) => handleValueChange(definition.id, e.target.value)} placeholder="Valor" />;
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      <h3 className="text-xl font-semibold text-foreground">Editando Parâmetros para: <span className="text-primary">{userFullName}</span></h3>
      {definitions.length === 0 && <p className="text-muted-foreground">Nenhuma definição de parâmetro do sistema encontrada.</p>}
      
      {PARAM_CATEGORIES.map(category => {
        const paramsInCategory = definitions.filter(def => def.category === category);
        if (paramsInCategory.length === 0) return null;
        return (
          <div key={category} className="space-y-3 p-3 border rounded-md bg-card/50">
            <h4 className="text-md font-medium text-primary border-b pb-1">{category}</h4>
            {paramsInCategory.map(def => (
              <div key={def.id} className="space-y-1">
                <Label htmlFor={`param-def-${def.id}`} className="text-sm font-medium">
                  {def.description || def.parameter_key}
                  <span className="text-xs text-muted-foreground ml-1">({def.parameter_key} - {def.value_type})</span>
                </Label>
                {renderInputForType(def)}
                {def.default_value && <p className="text-xs text-muted-foreground">Padrão: {def.default_value}</p>}
              </div>
            ))}
          </div>
        );
      })}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <XCircle className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={handleSaveParameters} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Parâmetros
        </Button>
      </div>
    </div>
  );
};

export default UserParametersEditor;