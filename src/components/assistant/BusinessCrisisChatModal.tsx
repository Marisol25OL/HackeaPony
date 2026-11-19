import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  X,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Wrench,
  DollarSign
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessCrisisChatModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `🛡️ **¡Hola, soy tu Bot Guardián de Apoyo para tu Negocio!**
Estoy aquí para orientarte y darte soluciones prácticas y rápidas si tu negocio o taller enfrenta alguna complicación económica, de ventas o de trabajo.

¿Qué situación estás enfrentando hoy? Puedes elegir una de las opciones de abajo o escribirme con tus propias palabras:`,
      timestamp: 'Ahora'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickScenarios = [
    {
      label: 'Sin dinero en caja / Falta para insumos',
      icon: DollarSign,
      prompt: 'Me quedé sin efectivo en caja, tengo que pagar gastos urgentes y comprar materiales para trabajar. ¿Qué hago hoy mismo para conseguir dinero?'
    },
    {
      label: 'Caída de ventas y pocos pedidos',
      icon: TrendingDown,
      prompt: 'Mis ventas bajaron mucho esta semana y no me han caído pedidos. ¿Cómo reactivo clientes y genero ventas rápidas en 24 horas?'
    },
    {
      label: 'Herramienta o equipo descompuesto',
      icon: Wrench,
      prompt: 'Se me descompuso mi máquina o herramienta principal de trabajo y tengo pedidos pendientes pero poco presupuesto para reparaciones.'
    },
    {
      label: 'Inventario agotado con pedidos prometidos',
      icon: Flame,
      prompt: 'Se me agotó el material o producto prometido a mis clientes y la entrega es urgente. ¿Cómo lo resuelvo sin quedar mal?'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/business-crisis-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4),
          businessContext: {
            currency: 'MXN',
            hub: 'Morelia, Michoacán',
            platform: 'MiFyMEs E-Business Inteligencia Operativa'
          }
        })
      });

      const data = await res.json();
      const botReply = data.reply || 'No pude procesar la solicitud en este momento. Revisa tu conexión local.';

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `🚨 **PLAN DE AUXILIO INMEDIATO (SIN INTERNET):**
1. **Protege tu dinero en caja:** No compres materiales adicionales ni hagas gastos que no sean urgentes hasta cobrar al menos el 50% de anticipo de tu siguiente pedido.
2. **Venta relámpago en 24h:** Publica en tus estados de WhatsApp o redes sociales los artículos que ya tengas listos para entrega con un 15% o 20% de descuento si pagan de contado o por transferencia.
3. **Pide prórroga tranquila:** Habla con tus proveedores y diles con calma cuándo entra tu siguiente venta para acordar un pago parcial sin intereses.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-[90vh] max-h-[700px] rounded-sm border-2 border-[#582C7B] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#582C7B] text-white p-4 flex items-center justify-between border-b border-[#472264] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#D94680] text-white flex items-center justify-center border border-pink-300 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-impact uppercase tracking-wider text-white">
                  Bot Guardián MiFyMEs: Auxilio y Rescate de Negocio
                </h3>
              </div>
              <p className="text-xs text-pink-200 font-sans">
                Motor de Inteligencia Operativa y Triage Financiero para Talleres 3D
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm bg-[#472264] hover:bg-[#D94680] text-white transition cursor-pointer"
            title="Cerrar Bot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div className="bg-[#FFF1F2] border-b border-[#FECDD3] px-4 py-2 flex items-center justify-between text-xs text-[#9F1239] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-[#D94680] animate-ping" />
            <span className="font-bold">Monitoreo de Salud de Negocio Activo</span>
          </div>
          <span className="font-impact uppercase tracking-wider text-[11px] text-[#582C7B]">
            E-Business & Rescate 24/7
          </span>
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7FC]">
          
          {/* Quick scenario buttons */}
          <div className="bg-white p-3.5 rounded-sm border border-purple-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-impact uppercase tracking-wider text-[#582C7B] block">
              Selecciona una situación de riesgo frecuente:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickScenarios.map((sc, idx) => {
                const Icon = sc.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sc.prompt)}
                    disabled={isLoading}
                    className="p-2.5 rounded-sm border border-purple-200 bg-purple-50 hover:bg-[#582C7B] hover:text-white text-left transition text-xs font-semibold flex items-center gap-2 cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 text-[#D94680] group-hover:text-white shrink-0" />
                    <span className="line-clamp-2 leading-tight">{sc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] p-3.5 rounded-sm text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#582C7B] text-white border border-[#472264]'
                    : 'bg-white text-stone-800 border-2 border-purple-100'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 px-1">
                {msg.sender === 'user' ? 'Tú' : 'Bot Guardián MiFyMEs'} • {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white border border-purple-200 rounded-sm text-xs text-[#582C7B] w-fit">
              <Sparkles className="w-4 h-4 text-[#D94680] animate-spin" />
              <span className="font-semibold">Analizando causas operativas y formulando plan de rescate...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <div className="p-3 bg-white border-t border-purple-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe la emergencia o riesgo de tu taller 3D..."
              className="flex-1 px-3.5 py-2.5 rounded-sm bg-stone-50 border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#582C7B] focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2.5 rounded-sm bg-[#D94680] hover:bg-[#c23670] disabled:bg-stone-300 text-white font-impact uppercase tracking-wider text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span>Pedir Auxilio</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-500">
            <span>Orientación inmediata basada en el ecosistema 3D de Michoacán y México</span>
            <span className="text-[#582C7B] font-bold">100% Confidencial y Gratuito</span>
          </div>
        </div>

      </div>
    </div>
  );
};
