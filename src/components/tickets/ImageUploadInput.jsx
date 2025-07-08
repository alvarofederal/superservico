import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Image as ImageIconLucide, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const MAX_SIZE_MB = 1;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpeg', '.jpg'],
};

const ImageUploadInput = ({ onFilesChange, initialFiles = [] }) => {
  const [files, setFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);

  useEffect(() => {
    const formattedInitialFiles = initialFiles
      .filter(fileOrUrl => fileOrUrl != null)
      .map((fileOrUrl, index) => {
        const baseId = fileOrUrl.name || `initial-${index}-${Date.now()}`;
        if (typeof fileOrUrl === 'string') {
          return { preview: fileOrUrl, name: fileOrUrl.substring(fileOrUrl.lastIndexOf('/') + 1), isUploaded: true, file: null, id: `${baseId}-${fileOrUrl}` };
        } else if (fileOrUrl.preview && fileOrUrl.name && typeof fileOrUrl.isUploaded === 'boolean') {
          return { ...fileOrUrl, id: `${baseId}-${fileOrUrl.preview || Math.random()}` };
        } else if (fileOrUrl instanceof File) {
          const preview = URL.createObjectURL(fileOrUrl);
          return { preview, name: fileOrUrl.name, isUploaded: false, file: fileOrUrl, id: `${baseId}-${preview}` };
        }
        return null;
      }).filter(f => f !== null);
  
    setFiles(prevFiles => {
      const newInitialFiles = formattedInitialFiles.filter(
        initialFile => !prevFiles.some(existingFile => existingFile.id === initialFile.id)
      );
      return [...prevFiles, ...newInitialFiles];
    });

  }, [initialFiles]);


  const onDropAccepted = useCallback((acceptedFiles) => {
    setFileErrors([]);
    setFiles(prevFiles => {
      const newLocalFiles = acceptedFiles.map(file => {
        const preview = URL.createObjectURL(file);
        return Object.assign(file, {
          preview: preview,
          isUploaded: false,
          file: file,
          id: `${file.name}-${preview}-${Date.now()}-${Math.random()}`
        });
      });

      const currentNonUploaded = prevFiles.filter(f => !f.isUploaded);
      const availableSlots = MAX_FILES - currentNonUploaded.length;
      
      let filesToActuallyAdd = newLocalFiles;
      if (newLocalFiles.length > availableSlots) {
        filesToActuallyAdd = newLocalFiles.slice(0, availableSlots);
        const excessCount = newLocalFiles.length - availableSlots;
        const newError = `Limite de ${MAX_FILES} novas imagens excedido. ${excessCount} arquivo(s) não foram adicionados.`;
        setFileErrors(prev => [...prev, newError]);
        toast({ title: "Erro no Upload", description: newError, variant: "destructive"});
      }
      
      const updatedFiles = [...prevFiles, ...filesToActuallyAdd];
      onFilesChange(updatedFiles.filter(f => !f.isUploaded && f.file).map(f => f.file));
      return updatedFiles;
    });
  }, [onFilesChange]);

  const onDropRejected = useCallback((rejectedFiles) => {
    const newErrors = rejectedFiles.map(rejectedFile => {
      const error = rejectedFile.errors[0];
      let message = `Arquivo "${rejectedFile.file.name}" rejeitado: `;
      if (error.code === 'file-too-large') message += `Tamanho excede ${MAX_SIZE_MB}MB.`;
      else if (error.code === 'file-invalid-type') message += `Formato inválido. Aceitos: PNG, JPEG, JPG.`;
      else if (error.code === 'too-many-files') message = `Limite de ${MAX_FILES} arquivos excedido.`;
      else message += error.message;
      return message;
    });
    setFileErrors(prev => [...prev, ...newErrors]);
    newErrors.forEach(err => toast({ title: "Erro no Upload", description: err, variant: "destructive"}));
  }, []);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_SIZE_BYTES,
    multiple: true, 
    validator: (file) => {
      const currentNonUploadedCount = files.filter(f => !f.isUploaded).length;
      if (currentNonUploadedCount >= MAX_FILES) {
        return {
          code: "too-many-files-at-validator",
          message: `Você já atingiu o limite de ${MAX_FILES} novas imagens.`
        };
      }
      return null;
    }
  });


  const removeFile = (fileId, e) => {
    e.stopPropagation();
    const fileToRemove = files.find(file => file.id === fileId);
    
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.id !== fileId);
      if (fileToRemove && fileToRemove.preview && !fileToRemove.isUploaded) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      onFilesChange(updatedFiles.filter(f => !f.isUploaded && f.file).map(f => f.file));
      return updatedFiles;
    });
  };

  const thumbs = files.map(file => (
    <div key={file.id} className="relative w-24 h-24 border border-border rounded-md overflow-hidden shadow-sm group">
      <img-replace
        alt={`Pré-visualização de ${file.name}`}
        className="w-full h-full object-cover"
        src={file.preview} />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive-foreground hover:bg-destructive/80"
          onClick={(e) => removeFile(file.id, e)}
          title="Remover imagem"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      {file.isUploaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-xs text-center py-0.5">
          Salva
        </div>
      )}
    </div>
  ));

  const nonUploadedFilesCount = files.filter(f => !f.isUploaded).length;
  const canAddNewFiles = nonUploadedFilesCount < MAX_FILES;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps({
          onClick: e => {
            if (!canAddNewFiles) {
              e.preventDefault();
              toast({ title: "Limite Atingido", description: `Você já selecionou o máximo de ${MAX_FILES} imagens. Remova alguma para adicionar novas.`, variant: "default"});
            }
          }
        })}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/70",
          fileErrors.length > 0 ? "border-destructive" : "",
          !canAddNewFiles ? "cursor-not-allowed opacity-70 hover:border-border" : ""
        )}
      >
        <input {...getInputProps({disabled: !canAddNewFiles})} />
        <UploadCloud className={cn("h-12 w-12 mb-3", isDragActive ? "text-primary" : "text-muted-foreground", !canAddNewFiles ? "text-muted-foreground/50" : "")} />
        {isDragActive && canAddNewFiles ? (
          <p className="text-primary font-semibold">Solte as imagens aqui...</p>
        ) : (
          <>
            <p className="text-center text-muted-foreground">
              {canAddNewFiles ? `Arraste e solte até ${MAX_FILES - nonUploadedFilesCount} imagens aqui, ou clique.` : `Limite de ${MAX_FILES} imagens atingido.`}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              PNG, JPG, JPEG - Máx {MAX_SIZE_MB}MB por imagem.
            </p>
          </>
        )}
      </div>

      {fileErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md space-y-1">
          {fileErrors.map((error, i) => (
            <div key={i} className="flex items-center text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {thumbs}
          {canAddNewFiles && (
             <div 
                {...getRootProps({
                  onClick: e => {
                     if (!canAddNewFiles) {
                       e.preventDefault();
                     }
                  }
                })}
                className={cn(
                    "w-24 h-24 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary/70 text-muted-foreground hover:text-primary",
                    "transition-all",
                    !canAddNewFiles ? "cursor-not-allowed opacity-60 hover:border-border" : ""
                )}
                title={canAddNewFiles ? `Adicionar mais imagens (${MAX_FILES - nonUploadedFilesCount} restantes)` : "Limite de imagens atingido"}
            >
                <input {...getInputProps({disabled: !canAddNewFiles})} /> 
                <ImageIconLucide className="h-8 w-8 mb-1" />
                <span className="text-xs text-center">Adicionar</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadInput;