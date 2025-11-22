import { HiChat } from 'react-icons/hi';

export const Footer = () => {
  const handleChatClick = () => {
    // Aqui você pode integrar com um serviço de chat real
    alert('Funcionalidade de chat em desenvolvimento!');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-center py-3">
        <button
          onClick={handleChatClick}
          className="flex items-center gap-2 px-6 py-2 bg-cake-pink hover:bg-cake-dark-pink rounded-full transition-colors shadow-md"
          aria-label="Chat"
        >
          <HiChat size={20} />
          <span className="font-medium">Chat</span>
        </button>
      </div>
    </footer>
  );
};

