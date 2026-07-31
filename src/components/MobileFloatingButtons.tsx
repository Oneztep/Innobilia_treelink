import React from 'react';
import { Calendar, MessageCircle } from 'lucide-react';

export function MobileFloatingButtons({ setWaModalPhone, setWaModalMode, setShowWaModal }: any) {
    return (
        <div className="fixed items-end z-40 bottom-4 right-4 flex flex-col gap-2">
            {/* Botón 1: Agenda una visita */}
            <button
                onClick={() => {
                    setWaModalMode('new');
                    setWaModalPhone('');
                    setShowWaModal(true);
                }}
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#0f172b] shadow-xl hover:bg-[#0c245f] active:scale-105 transition-all duration-300 ease-in-out"
                title="Agenda una visita"
                aria-label="Agenda una visita"
            >
                <Calendar className="w-6 h-6" />
            </button>

            {/* Botón 2: Contactar por WhatsApp */}
            <button
                onClick={() => {
                    setWaModalMode('contact');
                    setWaModalPhone('');
                    setShowWaModal(true);
                }}
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-green-600 shadow-xl hover:bg-green-700 active:scale-105 transition-all duration-300 ease-in-out"
                title="Contactar por WhatsApp"
                aria-label="Contactar por WhatsApp"
            >
                <MessageCircle className="w-6 h-6" />
            </button>
        </div>
    );
}
