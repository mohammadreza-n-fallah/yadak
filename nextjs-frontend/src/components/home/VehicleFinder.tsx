'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vehiclesApi } from '@/lib/api';
import { VehicleBrand, VehicleModel, VehicleTrim } from '@/types';

export default function VehicleFinder() {
  const router = useRouter();
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [trims, setTrims] = useState<VehicleTrim[]>([]);
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [trimId, setTrimId] = useState('');

  useEffect(() => { vehiclesApi.brands().then(r => setBrands(r.data)); }, []);

  const onBrand = async (id: string) => {
    setBrandId(id); setModelId(''); setTrimId('');
    setModels([]); setTrims([]);
    if (id) {
      const { data } = await vehiclesApi.models(+id);
      setModels(data);
    }
  };

  const onModel = async (id: string) => {
    setModelId(id); setTrimId('');
    setTrims([]);
    if (id) {
      const { data } = await vehiclesApi.trims(+id);
      setTrims(data);
    }
  };

  const handleSearch = () => {
    if (trimId) router.push(`/shop?trim=${trimId}`);
    else if (modelId) router.push(`/shop?trim_model=${modelId}`);
    else if (brandId) router.push(`/shop?brand_id=${brandId}`);
  };

  const selectClass = `
    flex-1 bg-white border-0 rounded-xl px-4 py-3 text-sm text-dark-2
    focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200
    cursor-pointer shadow-sm disabled:bg-gray-100 disabled:text-gray-400
    appearance-none
  `;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-green-950" />

      {/* Decorative glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-xs px-4 py-2 rounded-full border border-white/15 mb-6">
          <span className="w-1.5 h-1.5 bg-primary-light rounded-full animate-pulse" />
          بیش از ۵۰۰۰۰ قطعه یدکی اصل در انبار
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
          قطعه خودروت رو
          <span className="block text-transparent bg-clip-text bg-gradient-to-l from-green-300 to-emerald-400 mt-1">
            سریع پیدا کن!
          </span>
        </h1>
        <p className="text-gray-400 mb-10 text-sm md:text-base max-w-sm mx-auto">
           قطعه هر خودرویی — جستجوی هوشمند بر اساس مدل خودرو
        </p>

        {/* Form panel */}
        <div className="glass rounded-2xl p-5 md:p-6 max-w-3xl mx-auto">
          <p className="text-white/60 text-xs mb-3 text-right">مدل خودرو خود را انتخاب کنید:</p>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <select value={brandId} onChange={e => onBrand(e.target.value)} className={selectClass}>
                <option value="">برند خودرو</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="flex-1 relative">
              <select value={modelId} onChange={e => onModel(e.target.value)} disabled={!brandId} className={selectClass}>
                <option value="">مدل خودرو</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="flex-1 relative">
              <select value={trimId} onChange={e => setTrimId(e.target.value)} disabled={!modelId} className={selectClass}>
                <option value="">تیپ خودرو</option>
                {trims.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.year_from ? ` (${t.year_from}${t.year_to ? `–${t.year_to}` : '+'})` : ''}
                  </option>
                ))}
              </select>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <button
              onClick={handleSearch}
              disabled={!brandId}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              جستجو
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-10">
          {[
            { label: 'برند', value: '۱۰۰+' },
            { label: 'قطعه', value: '۵۰۰۰۰+' },
            { label: 'مشتری', value: '۲۰۰۰۰+' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-xl md:text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
