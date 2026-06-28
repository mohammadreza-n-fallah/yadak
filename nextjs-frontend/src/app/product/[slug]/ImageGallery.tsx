'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types';
import { mediaUrl } from '@/lib/api';

export default function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Reset zoom + pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [active]);

  // Keyboard navigation inside lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') prev();
      if (e.key === 'ArrowLeft') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, active, images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  const openLightbox = () => setLightbox(true);
  const closeLightbox = () => { setLightbox(false); setZoom(1); setPan({ x: 0, y: 0 }); };

  const prev = useCallback(() => {
    setActive(a => Math.max(0, a - 1));
  }, []);

  const next = useCallback(() => {
    setActive(a => Math.min(images.length - 1, a + 1));
  }, [images.length]);

  // Mouse-wheel zoom inside lightbox
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => {
      const next = Math.max(1, Math.min(5, z - e.deltaY * 0.007));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Pan when zoomed
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };
  const onMouseUp = () => { dragging.current = false; };

  // Touch zoom (pinch) + pan
  const lastDist = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.hypot(dx, dy);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist - lastDist.current;
      setZoom(z => Math.max(1, Math.min(5, z + delta * 0.01)));
      lastDist.current = dist;
    }
  };

  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-6xl">
        🔧
      </div>
    );
  }

  return (
    <>
      {/* ── Gallery ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-border-color cursor-zoom-in group"
          onClick={openLightbox}
          role="button"
          aria-label="بزرگ‌نمایی تصویر"
        >
          <Image
            src={mediaUrl(images[active].image)}
            alt={`${name} — تصویر ${active + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4 transition-transform duration-200 group-hover:scale-105"
            priority
          />

          {/* Zoom hint icon */}
          <div className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>

          {/* Image counter badge */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
              {active + 1} / {images.length}
            </div>
          )}

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                disabled={active === 0}
                aria-label="تصویر قبلی"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white disabled:opacity-25 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                disabled={active === images.length - 1}
                aria-label="تصویر بعدی"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white disabled:opacity-25 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`تصویر ${i + 1}`}
                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  i === active ? 'border-primary shadow-sm scale-105' : 'border-border-color hover:border-gray-400'
                }`}
              >
                <Image
                  src={mediaUrl(img.image)}
                  alt={`${name} — ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-contain p-1 bg-gray-50"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none">
            <span className="text-white/70 text-sm select-none">
              {active + 1} / {images.length}
            </span>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur rounded-full px-3 py-1.5 pointer-events-auto">
              <button
                aria-label="کوچک‌تر"
                onClick={e => { e.stopPropagation(); setZoom(z => { const n = Math.max(1, +(z - 0.5).toFixed(1)); if (n <= 1) setPan({ x: 0, y: 0 }); return n; }); }}
                className="text-white w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full text-lg leading-none"
              >−</button>
              <span className="text-white text-xs min-w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                aria-label="بزرگ‌تر"
                onClick={e => { e.stopPropagation(); setZoom(z => Math.min(5, +(z + 0.5).toFixed(1))); }}
                className="text-white w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full text-lg leading-none"
              >+</button>
              {zoom > 1 && (
                <button
                  aria-label="بازنشانی زوم"
                  onClick={e => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
                  className="text-white/70 text-xs hover:text-white mr-1"
                >بازنشانی</button>
              )}
            </div>

            {/* Close */}
            <button
              aria-label="بستن"
              onClick={closeLightbox}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors pointer-events-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image viewport */}
          <div
            className="w-full h-full overflow-hidden flex items-center justify-center"
            onClick={e => e.stopPropagation()}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            style={{ cursor: zoom > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'zoom-out' }}
          >
            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
                transition: dragging.current ? 'none' : 'transform 0.15s ease-out',
                willChange: 'transform',
              }}
              onClick={() => zoom > 1 && (setZoom(1), setPan({ x: 0, y: 0 }))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(images[active].image)}
                alt={`${name} — ${active + 1}`}
                draggable={false}
                style={{
                  maxWidth: '88vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  display: 'block',
                  userSelect: 'none',
                }}
              />
            </div>
          </div>

          {/* Prev / Next in lightbox */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                disabled={active === 0}
                aria-label="تصویر قبلی"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white disabled:opacity-20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                disabled={active === images.length - 1}
                aria-label="تصویر بعدی"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white disabled:opacity-20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/40 backdrop-blur rounded-xl"
              onClick={e => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                  aria-label={`تصویر ${i + 1}`}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                    i === active ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(img.image)}
                    alt=""
                    className="w-full h-full object-contain bg-white/10"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
