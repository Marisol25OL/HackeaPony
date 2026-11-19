import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Check,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Zap,
  Volume2,
  VolumeX,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Info,
  ExternalLink,
  Loader2,
  Square
} from 'lucide-react';
import { db, type ProductItem, type InventoryItem } from '../../db/indexedDB';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTransactionSaved: () => void;
  initialTargetItem?: string; // Optional pre-selected product name
}

interface ParsedMovement {
  action: 'sale' | 'restock'; // 'sale' = vendí, 'restock' = puse / agregué
  itemType: 'product' | 'inventory';
  itemId: string;
  itemName: string;
  unitPriceOrCost: number;
  quantity: number;
  previousStock: number;
  newStock: number;
  totalAmount: number;
  unit: string;
}

export const VoiceAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTransactionSaved,
  initialTargetItem
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [speechErrorType, setSpeechErrorType] = useState<string | null>(null);

  // Audio level monitoring
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [showMicHelp, setShowMicHelp] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const [parsedMovement, setParsedMovement] = useState<ParsedMovement | null>(null);
  const [autoApplyCountdown, setAutoApplyCountdown] = useState<number | null>(null);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const processedRef = useRef<boolean>(false);
  const countdownTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<any>(null);

  // Load existing products and inventory on modal open
  useEffect(() => {
    if (isOpen) {
      loadData();
      checkSpeechSupport();
      setStatusMessage('Presiona el micrófono y di tu frase o pulsa un botón rápido.');
    } else {
      stopVoiceListening();
      clearCountdown();
      setParsedMovement(null);
      setInputText('');
      setLiveTranscript('');
      setFeedbackSuccess(null);
      setStatusMessage('');
      setSpeechErrorType(null);
    }
  }, [isOpen]);

  const checkSpeechSupport = () => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setSpeechSupported(hasSpeech || hasMedia);
    }
  };

  const clearCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoApplyCountdown(null);
  };

  const loadData = async () => {
    try {
      const prods = await db.products.toArray();
      const inv = await db.inventory.toArray();
      setProductsList(prods);
      setInventoryList(inv);
    } catch (e) {
      console.error('Error loading db items:', e);
    }
  };

  // Audio level meter setup using Web Audio API
  const startAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioVolume(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn('AudioContext volume meter could not start:', err);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioVolume(0);
  };

  // START LISTENING (DUAL ENGINE: MediaRecorder stream + WebSpeech progressive display)
  const startVoiceListening = async () => {
    clearCountdown();
    setSpeechErrorType(null);
    setLiveTranscript('');
    processedRef.current = false;
    audioChunksRef.current = [];

    // Step 1: Explicitly request microphone stream via getUserMedia
    let micStream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = micStream;
        setHasMicPermission(true);
        startAudioMeter(micStream);
      } else {
        throw new Error('getUserMedia not available');
      }
    } catch (mediaErr: any) {
      console.warn('Microphone permission or hardware error:', mediaErr);
      if (mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError') {
        setSpeechErrorType('permission_denied');
        setStatusMessage('⚠️ Permiso de micrófono no detectado. Si estás en una ventana integrada, abre la app en pestaña completa o usa los botones rápidos.');
        setShowMicHelp(true);
        return;
      } else if (mediaErr?.name === 'NotFoundError' || mediaErr?.name === 'DevicesNotFoundError') {
        setSpeechErrorType('no_device');
        setStatusMessage('⚠️ No se encontró ningún micrófono conectado en tu dispositivo.');
        return;
      }
    }

    if (!micStream) {
      setStatusMessage('No se pudo acceder al micrófono. Por favor usa los botones rápidos o escribe abajo.');
      return;
    }

    setIsListening(true);
    setStatusMessage('🎙️ ¡Te estoy escuchando! Di: "Vendí dos piezas de esto" o "Puse más piezas de esto"');

    // Step 2: Start MediaRecorder directly from the active microphone stream
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(micStream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0 && !processedRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm'
          });
          await sendAudioForAiTranscription(audioBlob);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
    } catch (recErr) {
      console.warn('MediaRecorder could not start, continuing with SpeechRecognition:', recErr);
    }

    // Step 3: Run client SpeechRecognition in parallel for real-time progressive typing (if supported)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        let recognizedFinalText = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const trans = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              recognizedFinalText += ' ' + trans;
            } else {
              interim += trans;
            }
          }

          const currentFull = (recognizedFinalText + ' ' + interim).trim();
          setLiveTranscript(currentFull);
          setInputText(currentFull);

          // Reset silence timer: when user pauses for 2 seconds after saying something, finalize
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentFull.length >= 3) {
              processedRef.current = true;
              stopVoiceListening();
              setStatusMessage(`Escuchado: "${currentFull}"`);
              processNaturalSpeech(currentFull);
            }
          }, 2000);
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition event (MediaRecorder continues):', e.error);
          // CRITICAL: Do NOT abort if error is 'not-allowed' or 'network'
          // In sandboxed iframes, SpeechRecognition often throws not-allowed
          // even when getUserMedia is active! MediaRecorder will record the audio successfully.
          if (e.error === 'not-allowed') {
            setStatusMessage('🎙️ Micrófono conectado. Grabando audio directamente... Di tu frase y pulsa "Terminar y Calcular".');
          } else if (e.error === 'no-speech') {
            setStatusMessage('👂 Esperando tu voz... Habla claro o di por ejemplo "Vendí 2 piezas"...');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.warn('SpeechRecognition start failed, relying on MediaRecorder audio:', err);
      }
    }
  };

  const stopVoiceListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    stopAudioMeter();
    setIsListening(false);
  };

  // SEND RECORDED AUDIO BLOB TO SERVER FOR GEMINI TRANSCRIPTION & EXTRACTION
  const sendAudioForAiTranscription = async (blob: Blob) => {
    if (blob.size < 1000) {
      // Audio chunk too small (< 1KB)
      return;
    }

    try {
      setIsTranscribing(true);
      setStatusMessage('🧠 Procesando audio con Inteligencia Artificial...');

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const dataUrl = await base64Promise;

      const res = await fetch('/api/v1/voice/transcribe-and-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: dataUrl,
          mimeType: blob.type
        })
      });

      if (!res.ok) throw new Error('Error al procesar audio en servidor');

      const data = await res.json();
      if (data.success) {
        const spoken = data.transcript || 'Audio procesado';
        setLiveTranscript(spoken);
        setInputText(spoken);

        if (data.action && data.quantity) {
          applyStructuredMovement(data.action, data.quantity, data.targetName || 'esto', spoken);
        } else {
          processNaturalSpeech(spoken);
        }
      } else {
        setStatusMessage('No se pudo interpretar el audio. Puedes escribir o pulsar una orden rápida.');
      }
    } catch (err: any) {
      console.warn('Error sending audio for transcription:', err);
      if (inputText.trim()) {
        processNaturalSpeech(inputText);
      } else {
        setStatusMessage('No se pudo procesar el audio automáticamente. Puedes usar el teclado o pulsar una orden rápida.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // APPLY STRUCTURED DATA DIRECTLY FROM GEMINI OR ADVANCED PARSER
  const applyStructuredMovement = (
    action: 'sale' | 'restock',
    quantity: number,
    targetName: string,
    transcript: string
  ) => {
    clearCountdown();
    const lower = (targetName + ' ' + transcript).toLowerCase();

    // Match product or inventory item
    let matchedProduct: ProductItem | null = null;
    let matchedInventory: InventoryItem | null = null;
    let highestScore = 0;

    if (initialTargetItem) {
      matchedProduct = productsList.find((p) => p.name.toLowerCase().includes(initialTargetItem.toLowerCase())) || null;
      if (!matchedProduct) {
        matchedInventory = inventoryList.find((i) => i.name.toLowerCase().includes(initialTargetItem.toLowerCase())) || null;
      }
    }

    if (!matchedProduct && !matchedInventory) {
      for (const prod of productsList) {
        const pName = prod.name.toLowerCase();
        let score = 0;
        if (lower.includes('maceta') && pName.includes('maceta')) score += 10;
        if (lower.includes('drag') && pName.includes('drag')) score += 10;
        if (lower.includes('llavero') && pName.includes('llavero')) score += 10;
        if (lower.includes('luna') && pName.includes('luna')) score += 10;
        if (lower.includes('cortador') && pName.includes('cortador')) score += 10;
        if (lower.includes('perchero') && pName.includes('perchero')) score += 10;
        if (lower.includes('vaso') && pName.includes('vaso')) score += 10;

        const words = pName.split(/\s+/);
        for (const w of words) {
          if (w.length > 3 && lower.includes(w)) score += 3;
        }

        if (score > highestScore) {
          highestScore = score;
          matchedProduct = prod;
        }
      }

      if (highestScore === 0) {
        for (const inv of inventoryList) {
          const iName = inv.name.toLowerCase();
          let score = 0;
          if (lower.includes('filamento') && iName.includes('filamento')) score += 10;
          if (lower.includes('resina') && iName.includes('resina')) score += 10;
          if (lower.includes('caja') && iName.includes('caja')) score += 10;

          const words = iName.split(/\s+/);
          for (const w of words) {
            if (w.length > 3 && lower.includes(w)) score += 3;
          }

          if (score > highestScore) {
            highestScore = score;
            matchedInventory = inv;
          }
        }
      }
    }

    if (!matchedProduct && !matchedInventory) {
      if (productsList.length > 0) matchedProduct = productsList[0];
      else if (inventoryList.length > 0) matchedInventory = inventoryList[0];
    }

    if (!matchedProduct && !matchedInventory) {
      setStatusMessage('No se encontraron artículos en el inventario.');
      return;
    }

    let movement: ParsedMovement;
    if (matchedProduct) {
      const prevStock = matchedProduct.stockUnits;
      const newStock = action === 'sale' ? Math.max(0, prevStock - quantity) : prevStock + quantity;
      const unitPriceOrCost = action === 'sale' ? matchedProduct.retailPrice : matchedProduct.directCost;
      const totalAmount = unitPriceOrCost * quantity;

      movement = {
        action,
        itemType: 'product',
        itemId: matchedProduct.id,
        itemName: matchedProduct.name,
        unitPriceOrCost,
        quantity,
        previousStock: prevStock,
        newStock,
        totalAmount,
        unit: 'pzs'
      };
    } else {
      const inv = matchedInventory!;
      const prevStock = inv.stockGramsOrUnits;
      const newStock = action === 'sale' ? Math.max(0, prevStock - quantity) : prevStock + quantity;
      const unitPriceOrCost = inv.unitCost;
      const totalAmount = unitPriceOrCost * quantity;

      movement = {
        action,
        itemType: 'inventory',
        itemId: inv.id,
        itemName: inv.name,
        unitPriceOrCost,
        quantity,
        previousStock: prevStock,
        newStock,
        totalAmount,
        unit: inv.unit
      };
    }

    setParsedMovement(movement);
    setStatusMessage(
      action === 'sale'
        ? `✅ Calculado: Vendiste ${quantity} ${movement.unit} de "${movement.itemName}". Stock: ${movement.previousStock} ➔ ${movement.newStock}`
        : `✅ Calculado: Pusiste ${quantity} ${movement.unit} de "${movement.itemName}". Stock: ${movement.previousStock} ➔ ${movement.newStock}`
    );

    if (autoApplyEnabled) {
      let count = 3;
      setAutoApplyCountdown(count);
      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearCountdown();
          executeMovement(movement);
        } else {
          setAutoApplyCountdown(count);
        }
      }, 1000);
    }
  };

  // PARSER UNIVERSAL DE VOZ Y LENGUAJE NATURAL
  const processNaturalSpeech = (text: string) => {
    clearCountdown();
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    // 1. Detect Action (Venta / Salida vs Entrada / Poner / Resurtido)
    let action: 'sale' | 'restock' = 'sale';
    const restockKeywords = [
      'puse', 'agregue', 'agregué', 'agrege', 'sume', 'sumé', 'anadi', 'añadí',
      'anade', 'añade', 'llegaron', 'llego', 'llegó', 'compre', 'compré',
      'resurti', 'resurtí', 'meti', 'metí', 'recibi', 'recibí', 'entró', 'entraron',
      'mas piezas', 'más piezas', 'poner', 'ingresar', 'subir'
    ];
    const isRestock = restockKeywords.some((kw) => lower.includes(kw));
    if (isRestock) {
      action = 'restock';
    }

    // 2. Extract Quantity
    let quantity = 1;
    const numberWords: Record<string, number> = {
      'un': 1, 'una': 1, 'uno': 1,
      'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
      'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
      'once': 11, 'doce': 12, 'quince': 15, 'veinte': 20,
      'veinticinco': 25, 'treinta': 30, 'cincuenta': 50, 'cien': 100
    };

    for (const [w, val] of Object.entries(numberWords)) {
      const reg = new RegExp(`\\b${w}\\b`, 'i');
      if (reg.test(lower)) {
        quantity = val;
        break;
      }
    }

    const digitMatch = lower.match(/(\d+)\s*(?:piezas?|productos?|unidades?|kg|kilos?|g|gramos?)?/);
    if (digitMatch && digitMatch[1]) {
      const parsedNum = parseInt(digitMatch[1], 10);
      if (parsedNum > 0 && parsedNum < 10000) {
        quantity = parsedNum;
      }
    }

    // 3. Find matching product or inventory item
    let matchedProduct: ProductItem | null = null;
    let matchedInventory: InventoryItem | null = null;
    let highestScore = 0;

    // Check pre-selected target item if provided
    if (initialTargetItem) {
      matchedProduct = productsList.find((p) => p.name.toLowerCase().includes(initialTargetItem.toLowerCase())) || null;
      if (!matchedProduct) {
        matchedInventory = inventoryList.find((i) => i.name.toLowerCase().includes(initialTargetItem.toLowerCase())) || null;
      }
    }

    // Match across Products List
    if (!matchedProduct && !matchedInventory) {
      for (const prod of productsList) {
        const pName = prod.name.toLowerCase();
        let score = 0;

        if (lower.includes('maceta') && pName.includes('maceta')) score += 10;
        if (lower.includes('drag') && pName.includes('drag')) score += 10;
        if (lower.includes('llavero') && pName.includes('llavero')) score += 10;
        if ((lower.includes('luna') || lower.includes('lámpara') || lower.includes('lampara')) && (pName.includes('luna') || pName.includes('lámpara'))) score += 10;
        if (lower.includes('cortador') && pName.includes('cortador')) score += 10;
        if (lower.includes('perchero') && pName.includes('perchero')) score += 10;
        if (lower.includes('vaso') && pName.includes('vaso')) score += 10;

        const words = pName.split(/\s+/);
        for (const w of words) {
          if (w.length > 3 && lower.includes(w)) {
            score += 3;
          }
        }

        if (score > highestScore) {
          highestScore = score;
          matchedProduct = prod;
        }
      }

      // Match across Inventory List if no product strongly matched
      if (highestScore === 0) {
        for (const inv of inventoryList) {
          const iName = inv.name.toLowerCase();
          let score = 0;

          if (lower.includes('filamento') && iName.includes('filamento')) score += 10;
          if (lower.includes('resina') && iName.includes('resina')) score += 10;
          if (lower.includes('caja') && iName.includes('caja')) score += 10;
          if (lower.includes('burbuja') && iName.includes('burbuja')) score += 10;
          if (lower.includes('cinta') && iName.includes('cinta')) score += 10;

          const words = iName.split(/\s+/);
          for (const w of words) {
            if (w.length > 3 && lower.includes(w)) {
              score += 3;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            matchedInventory = inv;
          }
        }
      }
    }

    // Default fallback to first product or inventory
    if (!matchedProduct && !matchedInventory) {
      if (productsList.length > 0) matchedProduct = productsList[0];
      else if (inventoryList.length > 0) matchedInventory = inventoryList[0];
    }

    if (!matchedProduct && !matchedInventory) {
      setStatusMessage('No se encontraron artículos en la base de datos.');
      return;
    }

    // 4. Calculate stock and amounts automatically without user math
    let movement: ParsedMovement;

    if (matchedProduct) {
      const prevStock = matchedProduct.stockUnits;
      const newStock = action === 'sale' ? Math.max(0, prevStock - quantity) : prevStock + quantity;
      const unitPriceOrCost = action === 'sale' ? matchedProduct.retailPrice : matchedProduct.directCost;
      const totalAmount = unitPriceOrCost * quantity;

      movement = {
        action,
        itemType: 'product',
        itemId: matchedProduct.id,
        itemName: matchedProduct.name,
        unitPriceOrCost,
        quantity,
        previousStock: prevStock,
        newStock,
        totalAmount,
        unit: 'pzs'
      };
    } else {
      const inv = matchedInventory!;
      const prevStock = inv.stockGramsOrUnits;
      const newStock = action === 'sale' ? Math.max(0, prevStock - quantity) : prevStock + quantity;
      const unitPriceOrCost = inv.unitCost;
      const totalAmount = unitPriceOrCost * quantity;

      movement = {
        action,
        itemType: 'inventory',
        itemId: inv.id,
        itemName: inv.name,
        unitPriceOrCost,
        quantity,
        previousStock: prevStock,
        newStock,
        totalAmount,
        unit: inv.unit
      };
    }

    setParsedMovement(movement);
    setStatusMessage(
      action === 'sale'
        ? `✅ Calculado: Vendiste ${quantity} ${movement.unit} de "${movement.itemName}". Stock: ${movement.previousStock} ➔ ${movement.newStock}`
        : `✅ Calculado: Pusiste ${quantity} ${movement.unit} de "${movement.itemName}". Stock: ${movement.previousStock} ➔ ${movement.newStock}`
    );

    // If auto-apply is enabled, initiate automatic commit countdown (3 seconds hands-free)
    if (autoApplyEnabled) {
      let count = 3;
      setAutoApplyCountdown(count);
      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearCountdown();
          executeMovement(movement);
        } else {
          setAutoApplyCountdown(count);
        }
      }, 1000);
    }
  };

  // EXECUTE MOVEMENT (Deduct or Add to stock + register transaction automatically)
  const executeMovement = async (movementToExecute?: ParsedMovement) => {
    clearCountdown();
    const movement = movementToExecute || parsedMovement;
    if (!movement) return;

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      if (movement.itemType === 'product') {
        // 1. Update product stock
        await db.products.update(movement.itemId, {
          stockUnits: movement.newStock
        });

        // 2. Also sync to inventory if linked
        const invItem = await db.inventory.get(`inv-${movement.itemId}`);
        if (invItem) {
          await db.inventory.update(invItem.id, {
            stockGramsOrUnits: movement.newStock,
            status: movement.newStock <= invItem.minStockAlert ? 'critical' : 'sufficient',
            lastUpdated: todayStr
          });
        }
      } else {
        // Update inventory item
        await db.inventory.update(movement.itemId, {
          stockGramsOrUnits: movement.newStock,
          lastUpdated: todayStr
        });
      }

      // 3. Register transaction automatically in Mis Cuentas
      if (movement.action === 'sale') {
        await db.transactions.add({
          type: 'sale',
          category: 'Venta Producto 3D',
          description: `Venta automática: ${movement.quantity} ${movement.unit} de ${movement.itemName}`,
          amount: movement.totalAmount,
          date: todayStr,
          synced: true,
          itemsCount: movement.quantity,
          paymentMethod: 'Efectivo / Contraentrega',
          notes: `Cálculo automático de stock: de ${movement.previousStock} a ${movement.newStock} ${movement.unit}.`
        });
      } else {
        await db.transactions.add({
          type: 'expense',
          category: 'Otros Insumos',
          description: `Entrada automática: ${movement.quantity} ${movement.unit} de ${movement.itemName}`,
          amount: movement.totalAmount,
          date: todayStr,
          synced: true,
          itemsCount: movement.quantity,
          paymentMethod: 'Transferencia SPEI',
          notes: `Cálculo automático de stock: aumentó de ${movement.previousStock} a ${movement.newStock} ${movement.unit}.`
        });
      }

      // Visual feedback
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D94680', '#582C7B', '#10B981']
      });

      const message =
        movement.action === 'sale'
          ? `¡Venta registrada automáticamente! +$${movement.totalAmount} MXN añadidos a Mis Cuentas. Stock actualizado: ${movement.newStock} ${movement.unit}.`
          : `¡Stock actualizado automáticamente! Se agregaron ${movement.quantity} ${movement.unit}. Nuevo stock: ${movement.newStock} ${movement.unit}.`;

      setFeedbackSuccess(message);
      onTransactionSaved();

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch {
      setStatusMessage('Ocurrió un error al actualizar el stock. Intenta de nuevo.');
    }
  };

  const handleManualQuantityChange = (delta: number) => {
    clearCountdown();
    if (!parsedMovement) return;
    const newQty = Math.max(1, parsedMovement.quantity + delta);
    const newStock =
      parsedMovement.action === 'sale'
        ? Math.max(0, parsedMovement.previousStock - newQty)
        : parsedMovement.previousStock + newQty;
    const newTotal = parsedMovement.unitPriceOrCost * newQty;

    setParsedMovement({
      ...parsedMovement,
      quantity: newQty,
      newStock,
      totalAmount: newTotal
    });
  };

  const handleSelectAlternativeItem = (item: ProductItem) => {
    clearCountdown();
    const prevStock = item.stockUnits;
    const qty = parsedMovement ? parsedMovement.quantity : 1;
    const act = parsedMovement ? parsedMovement.action : 'sale';
    const newStock = act === 'sale' ? Math.max(0, prevStock - qty) : prevStock + qty;
    const price = act === 'sale' ? item.retailPrice : item.directCost;

    setParsedMovement({
      action: act,
      itemType: 'product',
      itemId: item.id,
      itemName: item.name,
      unitPriceOrCost: price,
      quantity: qty,
      previousStock: prevStock,
      newStock,
      totalAmount: price * qty,
      unit: 'pzs'
    });
  };

  const executeSimulation = (phrase: string) => {
    stopVoiceListening();
    setInputText(phrase);
    setLiveTranscript(phrase);
    processNaturalSpeech(phrase);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 relative my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs transition-all ${
              isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-900 text-white'
            }`}>
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>Voz Inteligente y Stock Automático</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                  Sin cálculos a mano
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Dicta o pulsa una orden y el cálculo de inventario se hace solo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">

          {/* Direct tab helper if inside iframe */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>¿Navegador integrado? Para acceso directo al micrófono:</span>
            </span>
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 shrink-0 ml-2 hover:underline"
            >
              <span>Abrir en pestaña nueva</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          {/* Main Microphone Button & Live Audio Indicator */}
          <div className="flex flex-col items-center justify-center text-center py-2 relative">

            {/* Microphone permission and connection badge */}
            {(hasMicPermission || isListening) && (
              <div className="mb-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Micrófono conectado y listo</span>
              </div>
            )}
            
            {/* Visual sound ripples when speaking */}
            {isListening && audioVolume > 5 && (
              <div
                className="absolute w-24 h-24 rounded-full bg-rose-400/30 animate-ping pointer-events-none"
                style={{
                  transform: `scale(${1 + audioVolume / 100})`
                }}
              />
            )}

            <button
              onClick={isListening ? stopVoiceListening : startVoiceListening}
              disabled={isTranscribing}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg relative z-10 ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200 scale-105 shadow-rose-300'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white hover:scale-102'
              } ${isTranscribing ? 'opacity-60 cursor-not-allowed' : ''}`}
              title={isListening ? 'Toca para detener' : 'Toca para hablar'}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-7 h-7 mb-0.5 animate-spin" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Analizando</span>
                </>
              ) : isListening ? (
                <>
                  <Square className="w-6 h-6 mb-0.5 fill-white" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Listo</span>
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7 mb-0.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hablar</span>
                </>
              )}
            </button>

            {/* Audio volume visualizer meter */}
            {isListening && (
              <div className="mt-3 flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200">
                <Volume2 className={`w-3.5 h-3.5 ${audioVolume > 10 ? 'text-emerald-600 animate-bounce' : 'text-zinc-400'}`} />
                <span className="text-[11px] font-medium text-zinc-600">
                  {audioVolume > 10 ? `Detectando voz (${audioVolume}%)` : 'Esperando tu voz...'}
                </span>
                <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full transition-all duration-75 rounded-full ${
                      audioVolume > 10 ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`}
                    style={{ width: `${Math.min(100, audioVolume * 1.5)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Prominent finish and calculate button when listening */}
            {isListening && (
              <button
                onClick={stopVoiceListening}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition transform hover:scale-102"
              >
                <Check className="w-4 h-4" />
                <span>Terminar y Calcular Automáticamente</span>
              </button>
            )}

            <span className="text-xs font-bold text-zinc-800 mt-2 block">
              {isTranscribing
                ? '🧠 Analizando lo que dijiste con Inteligencia Artificial...'
                : isListening
                ? '🎙️ Escuchando... ¡habla ahora con naturalidad!'
                : 'Toca el micrófono para comenzar a dictar'}
            </span>

            {/* Real-time speech transcription display */}
            {isListening && liveTranscript ? (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-200 text-xs font-semibold text-pink-900 animate-pulse">
                🗣️ "{liveTranscript}"
              </div>
            ) : (
              <span className="text-[11px] text-zinc-500 mt-0.5 max-w-sm">
                {statusMessage || 'Di: "Vendí dos piezas de esto" o "Puse más piezas de esto"'}
              </span>
            )}
          </div>

          {/* Microphone Permission Diagnostic / Help Card */}
          {(speechErrorType === 'permission_denied' || showMicHelp) && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold">¿Por qué no me escucha o está bloqueado el micrófono?</h5>
                  <p className="text-[11px] leading-relaxed">
                    Tu navegador requiere que le otorgues permiso explícito para acceder al micrófono.
                  </p>
                  <ol className="list-decimal list-inside text-[11px] space-y-0.5 font-medium">
                    <li>Haz clic en el ícono de <strong>candado 🔒</strong> o <strong>cámara/micrófono</strong> en la barra de direcciones de tu navegador (arriba a la izquierda).</li>
                    <li>Activa la opción <strong>"Micrófono" ➔ "Permitir"</strong>.</li>
                    <li>Vuelve a pulsar el botón de micrófono para hablar.</li>
                  </ol>
                  <p className="text-[10px] text-amber-700 italic pt-0.5">
                    💡 Si estás en una ventana de previsualización o sin micrófono, puedes pulsar directamente las órdenes rápidas de abajo o escribir tu frase.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200">
                <button
                  onClick={() => setShowMicHelp(false)}
                  className="px-2.5 py-1 text-[11px] text-amber-800 hover:text-amber-950 font-semibold"
                >
                  Entendido
                </button>
                <button
                  onClick={startVoiceListening}
                  className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reintentar Micrófono</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick preset 1-click voice command simulation chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#582C7B]" />
                <span>O pulsa una orden rápida directa:</span>
              </span>
              <button
                onClick={() => setShowMicHelp(!showMicHelp)}
                className="text-[10px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 underline"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Ayuda con el micrófono</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Vendí 2 piezas de esto', phrase: 'vendí dos piezas de esto', icon: MinusCircle, color: 'text-rose-600', badge: '-2 pzs' },
                { label: 'Puse más piezas de esto', phrase: 'puse más piezas de esto', icon: PlusCircle, color: 'text-emerald-600', badge: '+1 pz' },
                { label: 'Vendí 3 Macetas', phrase: 'vendí 3 macetas geométricas', icon: MinusCircle, color: 'text-rose-600', badge: '-3 pzs' },
                { label: 'Puse 5 piezas más', phrase: 'puse 5 piezas más', icon: PlusCircle, color: 'text-emerald-600', badge: '+5 pzs' },
                { label: 'Vendí 1 Dragón Articulado', phrase: 'vendí un dragón articulado', icon: MinusCircle, color: 'text-rose-600', badge: '-1 pz' },
                { label: 'Llegaron 10 Cajas Kraft', phrase: 'llegaron 10 cajas kraft', icon: PlusCircle, color: 'text-emerald-600', badge: '+10 pzs' }
              ].map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={i}
                    onClick={() => executeSimulation(cmd.phrase)}
                    className="p-2 rounded-xl bg-zinc-50 hover:bg-purple-50 hover:border-purple-200 border border-zinc-200 text-[11px] font-medium text-zinc-800 transition cursor-pointer text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 ${cmd.color} shrink-0`} />
                      <span className="truncate group-hover:text-purple-900 font-semibold">{cmd.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-purple-700 shrink-0">
                      {cmd.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Input field */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-600 block">
              O escribe tu frase con tus propias palabras:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value.length >= 3) {
                    processNaturalSpeech(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') processNaturalSpeech(inputText);
                }}
                placeholder='Escribe o dicta: "vendí dos piezas de esto" o "puse más de esto"'
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 placeholder-zinc-400"
              />
              <button
                onClick={() => processNaturalSpeech(inputText)}
                disabled={!inputText.trim()}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shrink-0"
              >
                Calcular
              </button>
            </div>
          </div>

          {/* Automatic Calculation Result Card */}
          {parsedMovement && (
            <div className="p-4 rounded-xl bg-zinc-50 border-2 border-zinc-300 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                    parsedMovement.action === 'sale'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {parsedMovement.action === 'sale' ? 'Venta (Salida de Stock)' : 'Entrada (Pusiste al Stock)'}
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900 mt-1">
                    {parsedMovement.itemName}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">
                    {parsedMovement.action === 'sale' ? 'Ingreso Registrado:' : 'Costo de Entrada:'}
                  </span>
                  <span className={`text-base font-bold font-serif ${
                    parsedMovement.action === 'sale' ? 'text-emerald-700' : 'text-zinc-900'
                  }`}>
                    {parsedMovement.action === 'sale' ? '+' : ''}${parsedMovement.totalAmount.toLocaleString('es-MX')} MXN
                  </span>
                </div>
              </div>

              {/* Automatic Stock Math Display */}
              <div className="p-3 rounded-lg bg-white border border-zinc-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase tracking-wider">CÁLCULO AUTOMÁTICO DE STOCK</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-zinc-500 line-through">
                      Tenías: {parsedMovement.previousStock} {parsedMovement.unit}
                    </span>
                    <span className="text-zinc-400 font-bold">➔</span>
                    <span className={`font-black text-sm ${
                      parsedMovement.action === 'sale' ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      Nuevo Stock: {parsedMovement.newStock} {parsedMovement.unit}
                    </span>
                  </div>
                </div>

                {/* Stepper to adjust quantity without typing */}
                <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg">
                  <button
                    onClick={() => handleManualQuantityChange(-1)}
                    className="w-6 h-6 rounded bg-white text-zinc-700 hover:bg-zinc-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                    title="Restar 1 pieza"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-zinc-900 px-1">
                    {parsedMovement.quantity} {parsedMovement.unit}
                  </span>
                  <button
                    onClick={() => handleManualQuantityChange(1)}
                    className="w-6 h-6 rounded bg-white text-zinc-700 hover:bg-zinc-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                    title="Sumar 1 pieza"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Alternative Product Picker in case user said "esto" and wants another item */}
              {productsList.length > 1 && (
                <div className="pt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold block mb-1">
                    ¿Te referías a otra pieza? Selecciona con un toque:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {productsList.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectAlternativeItem(p)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition cursor-pointer ${
                          parsedMovement.itemId === p.id
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Countdown Bar & Auto Commit */}
              <div className="pt-2 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {autoApplyCountdown !== null ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                      <span>Guardando automáticamente en {autoApplyCountdown}s...</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-500">
                      Listo para aplicar al inventario
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {autoApplyCountdown !== null && (
                    <button
                      onClick={clearCountdown}
                      className="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer"
                    >
                      Pausar
                    </button>
                  )}
                  <button
                    onClick={() => executeMovement(parsedMovement)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar Inmediatamente</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {feedbackSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
