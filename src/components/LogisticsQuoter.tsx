import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Printer, 
  FileCheck, 
  Search, 
  Boxes, 
  DollarSign, 
  Percent, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { LogisticsItem, QuoteLineItem } from '../types';
import { BrandLogo } from './BrandLogo';

// Catálogo base de insumos y equipos Synapsis
const INVENTORY_CATALOG: LogisticsItem[] = [
  { id: 'inv_1', sku: 'SYN-BIO-01', name: 'Malla Quirúrgica de Polipropileno 15x15cm', category: 'Biomateriales', stock: 24, unitPriceUsd: 85.00 },
  { id: 'inv_2', sku: 'SYN-BIO-02', name: 'Sutura Monofilamento Polidioxanona 3-0 (Caja x 12)', category: 'Biomateriales', stock: 40, unitPriceUsd: 48.50 },
  { id: 'inv_3', sku: 'SYN-EQU-01', name: 'Kit Descartable Laparoscópico Trocar 5mm/10mm', category: 'Instrumental Quirúrgico', stock: 15, unitPriceUsd: 140.00 },
  { id: 'inv_4', sku: 'SYN-EQU-02', name: 'Pinza Bipolar Electrobisturí Reusable CcMi', category: 'Instrumental Quirúrgico', stock: 8, unitPriceUsd: 290.00 },
  { id: 'inv_5', sku: 'SYN-FAR-01', name: 'Anestésico Bupivacaína 0.5% Pesada (Ampollas x 5)', category: 'Fármacos', stock: 60, unitPriceUsd: 32.00 },
  { id: 'inv_6', sku: 'SYN-FAR-02', name: 'Ceftriaxona 1g Frasco Ampolla IV', category: 'Fármacos', stock: 120, unitPriceUsd: 12.00 },
  { id: 'inv_7', sku: 'SYN-DES-01', name: 'Bata Quirúrgica Impermeable Nivel 3 (Pack x 10)', category: 'Descartables', stock: 85, unitPriceUsd: 22.00 },
  { id: 'inv_8', sku: 'SYN-DES-02', name: 'Guantes Estériles Quirúrgicos Sin Látex 7.5 (Caja)', category: 'Descartables', stock: 110, unitPriceUsd: 18.00 },
];

export const LogisticsQuoter: React.FC = () => {
  const [recipient, setRecipient] = useState({
    name: 'Clínica Santa Sofía / Depto. Compras Médicas',
    rif: 'J-30491820-1',
    attentionTo: 'Dr. Samir Moucharrafie (Referencia de Cirugía)',
    validDays: '15 días hábiles',
  });

  const [selectedItems, setSelectedItems] = useState<QuoteLineItem[]>([
    { id: 'line_1', item: INVENTORY_CATALOG[0], quantity: 2, discountPct: 0 },
    { id: 'line_2', item: INVENTORY_CATALOG[2], quantity: 1, discountPct: 5 },
    { id: 'line_3', item: INVENTORY_CATALOG[4], quantity: 3, discountPct: 0 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [taxRate, setTaxRate] = useState<number>(16); // IVA 16%
  const [showQuotePdfPreview, setShowQuotePdfPreview] = useState(false);

  // Cálculos de Cotización
  const subtotal = selectedItems.reduce((acc, curr) => {
    const itemTotal = curr.item.unitPriceUsd * curr.quantity;
    const discount = (itemTotal * curr.discountPct) / 100;
    return acc + (itemTotal - discount);
  }, 0);

  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const addItemToQuote = (item: LogisticsItem) => {
    const existingIndex = selectedItems.findIndex((l) => l.item.id === item.id);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: `line_${Date.now()}`,
          item,
          quantity: 1,
          discountPct: 0,
        },
      ]);
    }
  };

  const removeLineItem = (id: string) => {
    setSelectedItems(selectedItems.filter((l) => l.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    setSelectedItems(
      selectedItems.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  };

  const filteredCatalog = INVENTORY_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="synapsis-quoter-module" className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Banner Stitch */}
      <div className="bg-[#0d152a] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#070d1e] border border-slate-800 p-1 flex items-center justify-center shrink-0 shadow-sm">
            <BrandLogo size={38} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Cotizador Quirúrgico & Presupuestos CCMI
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/30 font-mono">
                Módulo Logístico
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cruza requerimientos de cirugías e implantes con la base de precios para emitir presupuestos institucionales.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQuotePdfPreview(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer font-mono"
        >
          <Printer className="w-4 h-4" />
          <span>Ver Presupuesto PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Target Client & Active Line Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Client Details Box Stitch */}
          <div className="bg-[#0d152a] border border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              1. Datos del Cliente / Centro Quirúrgico
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400">Razón Social o Institución</label>
                <input
                  type="text"
                  value={recipient.name}
                  onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400">RIF / Identificación Fiscal</label>
                <input
                  type="text"
                  value={recipient.rif}
                  onChange={(e) => setRecipient({ ...recipient, rif: e.target.value })}
                  className="w-full px-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400">Atención a / Médico Solicitante</label>
                <input
                  type="text"
                  value={recipient.attentionTo}
                  onChange={(e) => setRecipient({ ...recipient, attentionTo: e.target.value })}
                  className="w-full px-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400">Validez de la Oferta</label>
                <input
                  type="text"
                  value={recipient.validDays}
                  onChange={(e) => setRecipient({ ...recipient, validDays: e.target.value })}
                  className="w-full px-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Active Items Table Stitch */}
          <div className="bg-[#0d152a] border border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                2. Partidas del Presupuesto ({selectedItems.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">Moneda: USD (Tasa Oficial BCV)</span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-[#070d1e]">
                <p className="text-xs text-slate-400 font-mono">No hay insumos añadidos. Seleccione ítems del catálogo lateral.</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#070d1e] text-slate-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Descripción / SKU</th>
                      <th className="py-2.5 px-3 w-20 text-center">Cant.</th>
                      <th className="py-2.5 px-3 w-24 text-right">P. Unit.</th>
                      <th className="py-2.5 px-3 w-24 text-right">Total</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {selectedItems.map((line) => {
                      const lineTotal = line.item.unitPriceUsd * line.quantity;
                      return (
                        <tr key={line.id} className="hover:bg-[#070d1e]/50">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">{line.item.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {line.item.sku} • {line.item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updateQuantity(line.id, parseInt(e.target.value) || 1)}
                              aria-label={`Cantidad para ${line.item.name}`}
                              className="w-14 text-center px-1.5 py-1 bg-[#070d1e] border border-slate-800 rounded-lg text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            ${line.item.unitPriceUsd.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-400">
                            ${lineTotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(line.id)}
                              aria-label={`Eliminar ${line.item.name} del presupuesto`}
                              className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Calculations Summary Stitch */}
            <div className="bg-[#070d1e] rounded-2xl p-4 border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Partidas:</span>
                <span className="font-semibold text-slate-200">${subtotal.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  Impuesto (IVA):
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    aria-label="Porcentaje de IVA"
                    className="w-12 text-center py-0.5 px-1 bg-[#0d152a] border border-slate-800 rounded text-xs font-bold text-cyan-300"
                  />
                  %
                </span>
                <span className="font-semibold text-slate-200">${taxAmount.toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                <span className="text-white">Total Presupuesto CCMI:</span>
                <span className="text-cyan-400 text-base">${grandTotal.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Catalog & Quick Add Stitch */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0d152a] border border-slate-800/90 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              Catálogo de Inventario
            </h3>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar insumo o código SKU..."
                className="w-full pl-9 pr-3 py-2 bg-[#070d1e] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Catalog List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#070d1e] hover:bg-[#070d1e]/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white leading-snug">{item.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{item.sku}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{item.stock} en stock</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 font-mono block">
                      ${item.unitPriceUsd.toFixed(2)} USD
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addItemToQuote(item)}
                    className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl transition cursor-pointer"
                    title="Añadir a la cotización"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quote PDF Modal Simulator */}
      {showQuotePdfPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Presupuesto Comercial Synapsis / CcMi</h3>
              </div>
              <button
                onClick={() => setShowQuotePdfPreview(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="p-8 space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-1 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0">
                    <BrandLogo size={46} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">SYNAPSIS LOGÍSTICA C.A.</h2>
                    <p className="text-slate-600 font-medium">División de Equipos y Biomateriales Quirúrgicos • CcMi</p>
                    <p className="font-mono text-[11px] text-slate-400">RIF: J-40892102-9 • Caracas, Venezuela</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-blue-700 block">COTIZACIÓN #SYN-2026-089</span>
                  <span className="text-slate-500">Fecha: {new Date().toLocaleDateString('es-VE')}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border">
                <span className="block font-bold text-slate-900">Cliente: {recipient.name}</span>
                <span className="block text-slate-600">RIF: {recipient.rif}</span>
                <span className="block text-slate-600">Atención: {recipient.attentionTo}</span>
              </div>

              <table className="w-full border text-left">
                <thead className="bg-slate-100 font-bold border-b">
                  <tr>
                    <th className="p-2">Ítem</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-right">Unitario</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedItems.map((l, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{l.item.name}</td>
                      <td className="p-2 text-center">{l.quantity}</td>
                      <td className="p-2 text-right font-mono">${l.item.unitPriceUsd.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono font-bold">${(l.item.unitPriceUsd * l.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-right">
                  <div>Subtotal: <strong className="font-mono">${subtotal.toFixed(2)} USD</strong></div>
                  <div>IVA ({taxRate}%): <strong className="font-mono">${taxAmount.toFixed(2)} USD</strong></div>
                  <div className="text-base font-bold text-blue-800 border-t pt-1">
                    Total: <span className="font-mono">${grandTotal.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Documento con validez de {recipient.validDays}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuotePdfPreview(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Volver
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
