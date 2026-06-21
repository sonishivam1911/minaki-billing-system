import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

export const CsvUploadZone = ({ file, onFileSelect, disabled }) => {
  const inputRef = useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFileSelect(f);
  };

  return (
    <div
      className={`agents-dropzone ${disabled ? 'disabled' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
      />
      <Upload size={32} />
      <p>{file ? file.name : 'Drop CSV here or click to browse'}</p>
    </div>
  );
};
