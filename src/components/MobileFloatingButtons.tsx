export function MobileFloatingButtons({ setWaModalPhone, setWaModalMode, setShowWaModal, isMobile, role }: any) {
    return (
        <div className="fixed items-end z-20 bottom-4 right-4 flex flex-col gap-2">
            <button
                onClick={() => {
                    setWaModalMode('new');
                    setWaModalPhone('');
                    setShowWaModal(true);
                }}
                type="button"
                className="social-btn bg-green-600 shadow-xl hover:bg-green-700 active:scale-105 transition-transform"
                title="Agenda una visita"
                aria-label="Agenda una visita"
            >
                <i className="fab fa-whatsapp text-white" />
            </button>
            <button
                onClick={() => {
                    setWaModalMode('contact');
                    setWaModalPhone('');
                    setShowWaModal(true);
                }}
                type="button"
                className="social-btn bg-green-600 shadow-xl hover:bg-green-700 active:scale-105 transition-transform"
                title="Contactar por WhatsApp"
                aria-label="Contactar por WhatsApp"
            >
                <i className="fab fa-whatsapp text-white" />
            </button>
        </div>)
}