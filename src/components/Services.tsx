import React, { useState, useEffect } from "react";
import { Phone, ChevronRight, Check, X, Clock, Play, Image as ImageIcon, Video, Maximize2 } from "lucide-react";
import { SERVICES } from "../data";
import { Service, MediaItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ServicesProps {
  onOpenLeadModal: (serviceName?: string) => void;
  services?: Service[];
}

export default function Services({ onOpenLeadModal, services }: ServicesProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'video' | 'image'>('all');
  const [activeVideoItem, setActiveVideoItem] = useState<MediaItem | null>(null);
  const [activeImageItem, setActiveImageItem] = useState<MediaItem | null>(null);

  const displayServices = services || SERVICES;

  // Prevent background page scroll when any modal is open
  useEffect(() => {
    if (selectedService || activeVideoItem || activeImageItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedService, activeVideoItem, activeImageItem]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeVideoItem) {
          setActiveVideoItem(null);
        } else if (activeImageItem) {
          setActiveImageItem(null);
        } else if (selectedService) {
          handleCloseDetails();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeVideoItem, activeImageItem, selectedService]);

  const handleOpenDetails = (service: Service) => {
    setSelectedService(service);
    setActiveMediaFilter('all');
    setActiveVideoItem(null);
    setActiveImageItem(null);
  };

  const handleCloseDetails = () => {
    setSelectedService(null);
    setActiveVideoItem(null);
    setActiveImageItem(null);
  };

  // Helper for pluralization in Russian
  const formatCount = (count: number, single: string, few: string, many: string) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) return `${count} ${many}`;
    if (mod10 === 1) return `${count} ${single}`;
    if (mod10 >= 2 && mod10 <= 4) return `${count} ${few}`;
    return `${count} ${many}`;
  };

  return (
    <>
      <section id="services" className="py-20 bg-[#f6f6f4] min-h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Banner Header with Background Image */}
          <div className="relative overflow-hidden bg-neutral-950 py-20 sm:py-28 md:py-36 min-h-[260px] sm:min-h-[340px] flex items-center justify-center mb-10 rounded-3xl shadow-xl border border-neutral-800">
            <img
              src="/images/services/shitok.jpg"
              alt="Услуги ООО БелТехКомпания"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-35 scale-105"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/75" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,144,30,0.3)_0%,transparent_70%)]" />

            <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
              <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-widest uppercase drop-shadow-[0_0_30px_rgba(245,144,30,0.9)]">
                УСЛУГИ
              </h1>
            </div>
          </div>

          {/* 2x2 Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayServices.map((service) => {
              const videoCount = service.media?.filter(m => m.type === 'video').length || 0;
              const imageCount = service.media?.filter(m => m.type === 'image').length || 0;

              return (
                <motion.div
                  key={service.id}
                  id={`service-card-${service.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-neutral-200/80 hover:border-[#f5901e] hover:ring-2 hover:ring-[#f5901e]/20 rounded-2xl p-5 sm:p-6 hover:shadow-[0_12px_30px_-5px_rgba(245,144,30,0.35)] transition-colors duration-300 flex flex-col sm:flex-row gap-5 group cursor-pointer"
                  onClick={() => handleOpenDetails(service)}
                >
                  {/* Photo Left */}
                  <div className="relative w-full sm:w-[140px] h-[140px] shrink-0 rounded-xl overflow-hidden bg-neutral-200 border border-neutral-200">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Right content: Heading, Description, Button */}
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h3 className="font-heading font-bold text-base sm:text-lg text-[#262626] tracking-tight group-hover:text-[#f5901e] transition-colors leading-snug">
                          {service.title}
                        </h3>
                      </div>
                      <p className="font-sans text-xs sm:text-sm text-neutral-600 leading-relaxed mb-3">
                        {service.description}
                      </p>
                    </div>

                    {/* Media Badges Bar */}
                    {(videoCount > 0 || imageCount > 0) && (
                      <div className="flex items-center gap-2 mb-3 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100 w-fit">
                        {videoCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f5901e]">
                            <Video className="w-3.5 h-3.5" />
                            {formatCount(videoCount, "видео", "видео", "видео")}
                          </span>
                        )}
                        {videoCount > 0 && imageCount > 0 && <span className="text-neutral-300">•</span>}
                        {imageCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700">
                            <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
                            {formatCount(imageCount, "фото", "фото", "фото")}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 mt-auto border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        {service.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-sans font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#f5901e] shrink-0" />
                            <span className="text-[#262626] font-semibold">{service.phone}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-sans font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>По договору</span>
                          </div>
                        )}
                      </div>

                      <button
                        id={`service-more-btn-${service.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(service);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-heading font-extrabold uppercase tracking-wider text-white bg-[#f5901e] hover:bg-[#e07f15] py-2 px-4 rounded-[10px] transition-all active:scale-95 shadow-[0_0_15px_rgba(245,144,30,0.4)] hover:shadow-[0_0_25px_rgba(245,144,30,0.7)] cursor-pointer"
                      >
                        <span>Подробнее</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <div
            id="service-detail-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/75 backdrop-blur-md overflow-y-auto overscroll-contain"
            onClick={handleCloseDetails}
          >
            <motion.div
              id="service-detail-modal"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto my-auto border border-neutral-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 sm:h-80 md:h-[380px] w-full bg-neutral-900">
                <img
                  src={selectedService.image}
                  alt={selectedService.title}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                <button
                  id="modal-close-btn"
                  onClick={handleCloseDetails}
                  aria-label="Закрыть модальное окно"
                  className="absolute top-5 right-5 z-20 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition-colors border border-white/20 shadow-lg cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
                  <span className="inline-block bg-[#f5901e] text-white font-heading font-bold text-xs tracking-widest uppercase px-3 py-1 rounded-md mb-3 shadow-md">
                    ООО «БелТехКомпания»
                  </span>
                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-tight drop-shadow-md">
                    {selectedService.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <p className="font-sans text-[#262626] text-base sm:text-lg leading-relaxed mb-8 font-normal">
                  {selectedService.detailedDescription}
                </p>

                {selectedService.features && selectedService.features.length > 0 && (
                  <div className="mb-10">
                    <h4 className="font-heading font-bold text-sm sm:text-base tracking-widest text-[#262626] uppercase mb-5 border-l-4 border-[#f5901e] pl-3.5">
                      Что входит в услугу / особенности:
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedService.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-neutral-800 bg-neutral-50 p-3.5 rounded-xl border border-neutral-100">
                          <Check className="w-5 h-5 text-[#f5901e] shrink-0 mt-0.5 bg-[#f5901e]/15 p-1 rounded-full" />
                          <span className="font-sans leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.media && selectedService.media.length > 0 && (
                  <div className="mb-10 bg-neutral-50/80 rounded-2xl p-6 border border-neutral-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h4 className="font-heading font-bold text-sm sm:text-base tracking-widest text-[#262626] uppercase border-l-4 border-[#f5901e] pl-3.5">
                        Видео и фото выполненных работ:
                      </h4>
                      <div className="flex items-center gap-1.5 bg-neutral-200/70 p-1.5 rounded-xl self-start sm:self-auto">
                        <button
                          onClick={() => setActiveMediaFilter('all')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeMediaFilter === 'all' ? 'bg-white text-[#262626] shadow-xs' : 'text-neutral-600'
                          }`}
                        >
                          Все
                        </button>
                        <button
                          onClick={() => setActiveMediaFilter('video')}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeMediaFilter === 'video' ? 'bg-white text-[#f5901e] shadow-xs' : 'text-neutral-600'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          Видео
                        </button>
                        <button
                          onClick={() => setActiveMediaFilter('image')}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeMediaFilter === 'image' ? 'bg-white text-[#262626] shadow-xs' : 'text-neutral-600'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4" />
                          Фото
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {selectedService.media
                        .filter(item => activeMediaFilter === 'all' || item.type === activeMediaFilter)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="group relative bg-black rounded-xl overflow-hidden border border-neutral-200 aspect-video flex items-center justify-center cursor-pointer shadow-xs hover:shadow-lg transition-all"
                            onClick={() => item.type === 'video' ? setActiveVideoItem(item) : setActiveImageItem(item)}
                          >
                            <img
                              src={item.type === 'video' ? (item.poster || selectedService.image) : item.url}
                              alt={selectedService.title}
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              {item.type === 'video' ? (
                                <div className="w-12 h-12 rounded-full bg-[#f5901e] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play className="w-6 h-6 fill-current ml-0.5" />
                                </div>
                              ) : (
                                <Maximize2 className="w-7 h-7 text-white drop-shadow-md" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 pt-8 border-t border-neutral-200">
                  {selectedService.phone ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-neutral-500 font-sans">Прямой номер телефона:</span>
                      <a
                        href={`tel:${selectedService.phone.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-2 font-heading font-bold text-xl text-[#f5901e] hover:underline mt-0.5"
                      >
                        <Phone className="w-5 h-5 shrink-0" />
                        <span>{selectedService.phone}</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-neutral-600 font-sans max-w-sm">
                      <Clock className="w-5 h-5 text-[#f5901e] shrink-0" />
                      <span>г. Ивацевичи, ул. Свердлова, 5 • Работаем по договору</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleCloseDetails}
                      className="hidden sm:inline-block font-heading font-bold text-xs uppercase tracking-wider text-neutral-600 hover:text-neutral-900 py-3.5 px-6 border border-neutral-300 rounded-xl transition-all cursor-pointer"
                    >
                      Закрыть
                    </button>
                    <button
                      onClick={() => {
                        handleCloseDetails();
                        onOpenLeadModal(selectedService.title);
                      }}
                      className="font-heading font-extrabold text-xs uppercase tracking-wider text-white bg-[#f5901e] hover:bg-[#e07f15] py-4 px-8 rounded-xl shadow-lg active:scale-95 transition-all text-center flex-grow sm:flex-grow-0 cursor-pointer"
                    >
                      Оставить запрос
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Lightbox Modal */}
      <AnimatePresence>
        {activeVideoItem && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setActiveVideoItem(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveVideoItem(null)}
                aria-label="Закрыть видео"
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="aspect-video w-full">
                <video
                  src={activeVideoItem.url}
                  poster={activeVideoItem.poster}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {activeImageItem && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setActiveImageItem(null)}
          >
            <div
              className="relative max-w-5xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveImageItem(null)}
                aria-label="Закрыть изображение"
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="max-h-[80vh] w-full p-2 flex items-center justify-center">
                <img
                  src={activeImageItem.url}
                  alt="Фото выполненных работ"
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}