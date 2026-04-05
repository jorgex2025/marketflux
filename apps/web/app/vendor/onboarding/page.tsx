'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Configuración inicial — Vendedor | MarketFlux',
  description: 'Completa los pasos para empezar a vender.',
};

const STEPS = [
  { key: 'store', label: 'Tienda' },
  { key: 'products', label: 'Productos' },
  { key: 'shipping', label: 'Envíos' },
  { key: 'payments', label: 'Pagos' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', description: '', slug: '' });
  const [productForm, setProductForm] = useState({ name: '', price: '', description: '', stock: '' });
  const [shippingForm, setShippingForm] = useState({ method: 'standard', cost: '', freeThreshold: '' });
  const [paymentForm, setPaymentForm] = useState({ bankName: '', accountNumber: '', accountType: 'checking' });
  const router = useRouter();
  const { toast } = useToast();

  const handleNext = async () => {
    if (currentStep === STEPS.length - 1) {
      await submitAll();
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const submitAll = async () => {
    setSubmitting(true);
    try {
      await fetch(`${API}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(storeForm),
      });
      await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) }),
      });
      await fetch(`${API}/shipping/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...shippingForm, cost: Number(shippingForm.cost), freeThreshold: Number(shippingForm.freeThreshold) || null }),
      });
      await fetch(`${API}/payouts/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(paymentForm),
      });
      toast('¡Configuración completada!', 'success');
      router.push('/vendor/dashboard');
    } catch {
      toast('Error al completar la configuración', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Información de la tienda</h2>
            <div>
              <label className="text-sm font-medium text-zinc-700">Nombre *</label>
              <input value={storeForm.name} onChange={(e) => setStoreForm((s) => ({ ...s, name: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mi Tienda" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Slug</label>
              <input value={storeForm.slug} onChange={(e) => setStoreForm((s) => ({ ...s, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="mi-tienda" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Descripción</label>
              <textarea value={storeForm.description} onChange={(e) => setStoreForm((s) => ({ ...s, description: e.target.value }))} rows={3} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe tu tienda..." />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Agrega tu primer producto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Nombre *</label>
                <input value={productForm.name} onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Producto" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Precio *</label>
                <input type="number" value={productForm.price} onChange={(e) => setProductForm((s) => ({ ...s, price: e.target.value }))} required min="0" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Stock</label>
                <input type="number" value={productForm.stock} onChange={(e) => setProductForm((s) => ({ ...s, stock: e.target.value }))} min="0" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Descripción</label>
              <textarea value={productForm.description} onChange={(e) => setProductForm((s) => ({ ...s, description: e.target.value }))} rows={3} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Configuración de envíos</h2>
            <div>
              <label className="text-sm font-medium text-zinc-700">Método</label>
              <select value={shippingForm.method} onChange={(e) => setShippingForm((s) => ({ ...s, method: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="standard">Estándar</option>
                <option value="express">Express</option>
                <option value="pickup">Retiro en tienda</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Costo de envío</label>
                <input type="number" value={shippingForm.cost} onChange={(e) => setShippingForm((s) => ({ ...s, cost: e.target.value }))} min="0" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Envío gratis desde</label>
                <input type="number" value={shippingForm.freeThreshold} onChange={(e) => setShippingForm((s) => ({ ...s, freeThreshold: e.target.value }))} min="0" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Opcional" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Datos de pago</h2>
            <div>
              <label className="text-sm font-medium text-zinc-700">Banco</label>
              <input value={paymentForm.bankName} onChange={(e) => setPaymentForm((s) => ({ ...s, bankName: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre del banco" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Número de cuenta</label>
                <input value={paymentForm.accountNumber} onChange={(e) => setPaymentForm((s) => ({ ...s, accountNumber: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Tipo de cuenta</label>
                <select value={paymentForm.accountType} onChange={(e) => setPaymentForm((s) => ({ ...s, accountType: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="checking">Corriente</option>
                  <option value="savings">Ahorros</option>
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración inicial</h1>
        <p className="text-sm text-zinc-500 mt-1">Completa estos pasos para empezar a vender.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <button onClick={() => setCurrentStep(i)} className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition ${i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
              {i < currentStep ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </button>
            <span className={`text-sm font-medium hidden sm:inline ${i === currentStep ? 'text-indigo-600' : 'text-zinc-400'}`}>{step.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-green-500' : 'bg-zinc-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        {renderStep()}
        <div className="flex justify-between mt-6 pt-4 border-t border-zinc-100">
          <button onClick={handleBack} disabled={currentStep === 0} className="px-5 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40">Anterior</button>
          <button onClick={handleNext} disabled={submitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {submitting ? 'Guardando...' : currentStep === STEPS.length - 1 ? 'Completar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
