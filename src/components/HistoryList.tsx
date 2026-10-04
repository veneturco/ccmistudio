import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  ExternalLink, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2,
  FileCheck2,
  Filter
} from 'lucide-react';
import { ProcessedDocumentResult, DocumentType } from '../types';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { BrandLogo } from './BrandLogo';

interface Props {
  documents: ProcessedDocumentResult[];
}

export const HistoryList: React.FC<Props> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocumentResult | null>(null);

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'recipe':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">Récipe Médico</span>;
      case 'report':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">Informe Médico</span>;
      case 'lab_order':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">Orden Lab / Rx</span>;
      case 'certificate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">Constancia</span>;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient.nationalId.includes(searchTerm) ||
      doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.structuredData.diagnosisPrincipal.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || doc.documentType === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div id="history-list-module" className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Banner Stitch */}
      <div className="bg-[#0d152a] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#070d1e] border border-slate-800 p-1 flex items-center justify-center shrink-0 shadow-xs">
            <BrandLogo size={40} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Historial de Emisiones Clínicas CCMI
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/30 font-mono">
                {documents.length} registros
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Registro cronológico de papelería médica generada e inyectada en Google Docs para el Dr. Samir Moucharrafie.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar paciente, cédula o diagnóstico..."
              className="w-full pl-9 pr-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filtrar por tipo de documento"
            className="px-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">Todos los Tipos</option>
            <option value="recipe">Récipes</option>
            <option value="report">Informes</option>
            <option value="lab_order">Órdenes Lab</option>
            <option value="certificate">Constancias</option>
          </select>
        </div>
      </div>

      {/* Document Records */}
      {filteredDocs.length === 0 ? (
        <div className="bg-[#0d152a] border border-slate-800 rounded-3xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No se encontraron documentos</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Los documentos generados desde la pestaña "Nueva Emisión" aparecerán archivados aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc, index) => (
            <div
              key={doc.id}
              className="animate-fade-in-up rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card-2026 text-slate-800 dark:text-slate-100 dark:hover:border-cyan-500/50 dark:hover:-translate-y-1 dark:hover:scale-[1.01]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getDocTypeBadge(doc.documentType)}
                  <span className="font-mono text-xs font-bold text-cyan-400">{doc.docNumber}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    {doc.generatedAt}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm font-bold text-white">{doc.patient.fullName}</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({doc.patient.idType}-{doc.patient.nationalId})
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1 font-mono">
                  <strong className="text-cyan-400">Dx:</strong> {doc.structuredData.diagnosisPrincipal}
                  {doc.structuredData.medications.length > 0 && (
                    <span className="text-slate-400 font-mono text-[11px] ml-2">
                      ({doc.structuredData.medications.length} fármacos indicados)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Ver Papelería</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Reimprimir directo"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Paper Preview Modal */}
      <DocumentPreviewModal
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
};
