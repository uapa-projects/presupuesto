import React from 'react';
import { useNavigate } from 'react-router-dom';
import CertificateTemplate from './CertificateTemplate';

const CertificatePreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="cep-lectura">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <button type="button" onClick={() => navigate('/')} className="btn btn-outline-suite d-inline-flex align-items-center gap-2">
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
          Volver
        </button>
        <span className="page-sub small">Vista previa del template (datos de ejemplo)</span>
      </div>
      <CertificateTemplate />
    </div>
  );
};

export default CertificatePreview;
