import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, XCircle, FileImage } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const ImageUploader = ({ initialFiles = [], onFilesChange, required }) => {
  const [existingImages, setExistingImages] = useState(initialFiles);
  const [newFiles, setNewFiles] = useState([]);

  const onDrop = useCallback(acceptedFiles => {
    const validatedFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    const updatedNewFiles = [...newFiles, ...validatedFiles];
    setNewFiles(updatedNewFiles);
    onFilesChange({ new: updatedNewFiles, existing: existingImages });
  }, [newFiles, existingImages, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(err => {
          if (err.code === 'file-too-large') {
            toast({ title: 'Arquivo muito grande', description: `O arquivo ${file.name} excede o limite de 5MB.`, variant: 'destructive' });
          } else if (err.code === 'file-invalid-type') {
            toast({ title: 'Tipo de arquivo inválido', description: `O arquivo ${file.name} não é uma imagem válida.`, variant: 'destructive' });
          }
        });
      });
    }
  });

  const removeNewFile = (index) => {
    const updatedNewFiles = newFiles.filter((_, i) => i !== index);
    setNewFiles(updatedNewFiles);
    onFilesChange({ new: updatedNewFiles, existing: existingImages });
  };
  
  const removeExistingImage = (index) => {
    const updatedExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedExistingImages);
    onFilesChange({ new: newFiles, existing: updatedExistingImages });
  };

  const Thumb = ({ file, onRemove, isExisting }) => (
    <div className="relative group border border-border rounded-lg p-2 flex flex-col items-center justify-center h-32 w-32 overflow-hidden">
      <img src={isExisting ? file : file.preview} alt={isExisting ? 'Imagem existente' : file.name} className="object-contain h-full w-full" onLoad={!isExisting ? () => URL.revokeObjectURL(file.preview) : undefined} />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
       <Label>Fotos ou Diagramas {required && '*'}</Label>
      <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <UploadCloud className="h-10 w-10"/>
          {isDragActive ? (
            <p>Solte as imagens aqui...</p>
          ) : (
            <p>Arraste e solte imagens aqui, ou clique para selecionar</p>
          )}
          <p className="text-xs">PNG, JPG, GIF até 5MB</p>
        </div>
      </div>
      {(existingImages.length > 0 || newFiles.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
          {existingImages.map((url, index) => (
            <Thumb key={`existing-${index}`} file={url} onRemove={() => removeExistingImage(index)} isExisting />
          ))}
          {newFiles.map((file, index) => (
            <Thumb key={`new-${index}`} file={file} onRemove={() => removeNewFile(index)} isExisting={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;