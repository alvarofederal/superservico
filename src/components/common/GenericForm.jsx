import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const GenericForm = ({ initialData, onSubmit, onCancel, isSubmitting, formFields, isEditing }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: initialData || formFields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {})
  });

  useEffect(() => {
    reset(initialData || formFields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}));
  }, [initialData, reset, formFields]);

  const renderField = (field) => {
    const { name, label, type, placeholder, options, validation, disabled } = field;
    const isFieldDisabled = typeof disabled === 'function' ? disabled(isEditing) : (disabled || false);

    const ErrorMessage = () => errors[name] ? <p className="text-red-500 text-xs mt-1">{errors[name].message}</p> : null;

    switch (type) {
      case 'textarea':
        return (
          <div key={name}>
            <Label htmlFor={name}>{label}</Label>
            <Textarea id={name} {...register(name, validation)} placeholder={placeholder} disabled={isFieldDisabled} />
            <ErrorMessage />
          </div>
        );
      case 'select':
        return (
          <div key={name}>
            <Label htmlFor={name}>{label}</Label>
            <Controller
              name={name}
              control={control}
              rules={validation}
              render={({ field: controllerField }) => (
                <Select onValueChange={controllerField.onChange} value={controllerField.value} disabled={isFieldDisabled}>
                  <SelectTrigger id={name}><SelectValue placeholder={placeholder} /></SelectTrigger>
                  <SelectContent>
                    {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            <ErrorMessage />
          </div>
        );
      case 'text':
      case 'number':
      case 'date':
      default:
        return (
          <div key={name}>
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} type={type} {...register(name, validation)} placeholder={placeholder} disabled={isFieldDisabled} />
            <ErrorMessage />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formFields.map(field => (
          <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
            {renderField(field)}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

export default GenericForm;