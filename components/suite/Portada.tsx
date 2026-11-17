import React from 'react';

/** Portada sin sesión, como la de Tu Espacio GTH: banner con el nombre del sistema y, debajo, los pasos. */
const PASOS = [
  { icono: 'bi-pencil-square', titulo: 'Solicita',
    texto: 'Registra el monto, la cuenta analítica, la sede y adjunta los documentos de soporte.' },
  { icono: 'bi-clipboard-check', titulo: 'Da seguimiento',
    texto: 'Consulta en todo momento si tu solicitud está pendiente, aprobada o rechazada.' },
  { icono: 'bi-award', titulo: 'Recibe el certificado',
    texto: 'Al aprobarse, el certificado queda disponible en la solicitud.' },
];

const Portada: React.FC<{ stat: string }> = ({ stat }) => (
  <div className="cep-home">
    <section className="cep-hero" aria-labelledby="cep-hero-titulo">
      <div className="cep-hero-texto cep-aparece">
        <img src={`${stat}/img/cep.png`} alt="" className="cep-hero-logo" width={64} height={64} />
        <h1 className="cep-home-titulo" id="cep-hero-titulo">
          <span>Sistema de Gestión<br />Presupuestaria</span><br />CEP
        </h1>
        <p>Centraliza las solicitudes de presupuesto de UAPA: desde que el colaborador la envía hasta la revisión
          del supervisor y la emisión del certificado, con el estado de cada solicitud siempre a la vista.</p>
        {/* Para entrar: «Iniciar sesión» de la barra superior (SuiteLayout) */}
      </div>
      <div className="cep-hero-arte" aria-hidden="true">
        <div className="cep-hero-ficha"><i className="bi bi-file-earmark-plus"></i><span>Solicitud enviada</span></div>
        <div className="cep-hero-ficha"><i className="bi bi-hourglass-split"></i><span>En revisión</span></div>
        <div className="cep-hero-ficha cep-hero-ficha-ok"><i className="bi bi-patch-check"></i><span>Certificado emitido</span></div>
      </div>
    </section>

    <section className="cep-pasos" aria-label="Cómo funciona">
      {PASOS.map((p) => (
        <div key={p.titulo} className="suite-card panel cep-aparece">
          <i className={`bi ${p.icono}`} aria-hidden="true"></i>
          <h2>{p.titulo}</h2>
          <p className="page-sub mb-0">{p.texto}</p>
        </div>
      ))}
    </section>
  </div>
);

export default Portada;
