import React from 'react';

export interface FileAttachment {
  id?: number | string;
  nombre?: string;
  name?: string;
  url_view?: string;
  es_certificado?: boolean;
}

interface AttachmentListProps {
  files: FileAttachment[];
  onDeleteAttachment?: (id: number | string) => void;
  emptyMessage?: string;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
  files,
  onDeleteAttachment,
  emptyMessage = 'No se adjuntaron archivos al presupuesto.'
}) => {
  const regularFiles = files?.filter(f => !f.es_certificado) || [];

  if (regularFiles.length === 0) {
    return <p className="empty py-0 mb-0 fst-italic">{emptyMessage}</p>;
  }

  return (
    <div className="cep-archivos">
      {regularFiles.map((archivo, idx) => {
        const fileId = archivo.id ?? idx;
        const fileName = archivo.nombre ?? archivo.name ?? 'Archivo';

        return (
          <div key={fileId} className="cep-archivo">
            <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
            <span className="cep-archivo-nombre" title={fileName}>{fileName}</span>
            {archivo.url_view && (
              <a href={archivo.url_view} target="_blank" rel="noopener noreferrer" className="icon-btn"
                 aria-label={`Ver ${fileName}`} title="Ver archivo">
                <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
              </a>
            )}
            {onDeleteAttachment && (
              <button
                type="button"
                onClick={() => onDeleteAttachment(fileId as number | string)}
                className="icon-btn cep-peligro"
                aria-label={`Eliminar ${fileName}`}
                title="Eliminar adjunto"
              >
                <i className="bi bi-trash" aria-hidden="true"></i>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentList;
