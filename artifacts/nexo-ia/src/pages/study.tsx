import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { useSendStudyMessage, useSendStudyVoiceMessage, useGetStudyStatus } from '@workspace/api-client-react';
import type { StudyChatInput, StudyMessage, StudyVoiceInput } from '@workspace/api-client-react';
import { ArrowUp, BookOpen, Check, ChevronDown, CircleHelp, ImagePlus, LoaderCircle, Mic, MicOff, PanelLeftClose, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { getGetStudyStatusQueryKey } from '@workspace/api-client-react';

type StudyMode = StudyChatInput['mode'];
type UiMessage = StudyMessage & { id: string; audio?: string; transcript?: string };
const MODES: { id: StudyMode; title: string; intro: string; placeholder: string }[] = [
  { id: 'tutor', title: 'Tutoría', intro: 'Vamos a entenderlo juntos.', placeholder: '¿Qué te gustaría comprender hoy?' },
  { id: 'quiz', title: 'Practicar', intro: 'Practiquemos con preguntas.', placeholder: '¿Sobre qué tema quieres practicar?' },
  { id: 'study_plan', title: 'Plan de estudio', intro: 'Organicemos tus próximos pasos.', placeholder: '¿Qué quieres aprender y para cuándo?' },
  { id: 'flashcards', title: 'Tarjetas', intro: 'Convirtamos el tema en tarjetas.', placeholder: '¿De qué tema hacemos tarjetas?' },
  { id: 'summarize', title: 'Resumir', intro: 'Vamos a encontrar las ideas clave.', placeholder: 'Pega un texto o cuéntame qué resumir…' },
];
const STORE_KEY = 'nexo-ia-conversation-v1';

function readHistory(key: string): UiMessage[] {
  try { const parsed = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}
function LogoMark() { return <span className="grid size-9 place-items-center rounded-xl bg-[#e88c70] text-[#193e40]"><Sparkles size={18} /></span>; }

export default function StudyPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: status, isLoading: statusLoading, isError: statusError, refetch: retryStatus } = useGetStudyStatus({ query: { queryKey: getGetStudyStatusQueryKey() } });
  const chat = useSendStudyMessage();
  const voice = useSendStudyVoiceMessage();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const [mode, setMode] = useState<StudyMode>('tutor');
  const [subject, setSubject] = useState('');
  const [draft, setDraft] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [openModes, setOpenModes] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const userStorageKey = isLoaded && isSignedIn && user?.id ? `${STORE_KEY}:${user.id}` : null;
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modeDetails = MODES.find(item => item.id === mode) ?? MODES[0];
  const busy = chat.isPending || voice.isPending;

  useEffect(() => {
    if (!isLoaded) return;
    setHydratedStorageKey(null);
    if (!userStorageKey) {
      setMessages([]);
      return;
    }
    setMessages(readHistory(userStorageKey));
    setHydratedStorageKey(userStorageKey);
  }, [isLoaded, userStorageKey]);
  useEffect(() => {
    if (!userStorageKey || hydratedStorageKey !== userStorageKey) return;
    try {
      const textHistory = messages.map(({ imageDataUrl: _imageDataUrl, ...message }) => message);
      localStorage.setItem(userStorageKey, JSON.stringify(textHistory));
    } catch { /* Keep the active session usable when browser storage is unavailable. */ }
  }, [messages, userStorageKey, hydratedStorageKey]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-[#f7f4eb]" aria-label="Cargando tu espacio"><div className="h-9 w-64 animate-pulse rounded-full bg-[#e6e8dc]" /></div>;
  if (!isSignedIn) return <div className="grid min-h-[100dvh] place-items-center bg-[#f7f4eb] px-5"><div className="max-w-md rounded-[2rem] border border-[#dfe2d5] bg-[#fbfaf4] p-9 text-center shadow-sm"><LogoMark /><h1 className="display-font mt-6 text-3xl font-extrabold">Tu espacio te espera</h1><p className="mt-3 text-sm leading-6 text-[#668078]">Entra a tu cuenta para continuar aprendiendo con Nexo.</p><Link href="/sign-in" className="mt-7 inline-flex rounded-full bg-[#1e6660] px-6 py-3 font-bold text-white" data-testid="link-study-sign-in">Entrar a mi cuenta</Link><Link href="/" className="mt-3 block text-sm font-semibold text-[#52716a]" data-testid="link-back-home">Volver al inicio</Link></div></div>;

  const addMessages = (items: UiMessage[]) => setMessages(previous => [...previous, ...items]);
  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if ((!content && !imageDataUrl) || busy) return;
    const userMessage: UiMessage = { id: crypto.randomUUID(), role: 'user', content, ...(imageDataUrl ? { imageDataUrl } : {}) };
    const next = [...messages, userMessage];
    setMessages(next);
    setDraft(''); setImageDataUrl(''); setErrorMessage('');
    chat.mutate({ data: { mode, ...(subject.trim() ? { subject: subject.trim() } : {}), messages: next.map(({ role, content: body, imageDataUrl: image }, index) => ({ role, content: body, ...(index === next.length - 1 && image ? { imageDataUrl: image } : {}) })) } }, {
      onSuccess: response => addMessages([{ id: crypto.randomUUID(), role: 'assistant', content: response.answer }]),
      onError: () => setErrorMessage('No pudimos conectar ahora. Tu pregunta sigue aquí; inténtalo de nuevo.')
    });
  };

  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMessage('Elige un archivo de imagen para compartir tus apuntes.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErrorMessage('La imagen debe ocupar menos de 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const toggleRecord = async () => {
    setRecordingError('');
    if (recording && recorder.current) { recorder.current.stop(); setRecording(false); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setRecordingError('Este navegador no permite grabar audio. Prueba con otro dispositivo.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const instance = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      recorder.current = instance; chunks.current = [];
      instance.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      instance.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks.current, { type: instance.mimeType || 'audio/webm' });
        const format = (blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : blob.type.includes('mp3') ? 'mp3' : 'webm') as StudyVoiceInput['audioFormat'];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = reject; reader.readAsDataURL(blob);
        });
        setErrorMessage('');
        voice.mutate({ data: { audioBase64: base64, audioFormat: format, messages: messages.map(({ role, content, imageDataUrl }) => ({ role, content, ...(imageDataUrl ? { imageDataUrl } : {}) })) } }, {
          onSuccess: response => addMessages([
            ...(response.transcript ? [{ id: crypto.randomUUID(), role: 'user' as const, content: response.transcript }] : []),
            { id: crypto.randomUUID(), role: 'assistant', content: response.answer, transcript: response.transcript, audio: `data:${response.audioMimeType};base64,${response.audioBase64}` }
          ]),
          onError: () => setErrorMessage('No pudimos procesar el audio. Comprueba tu conexión e inténtalo de nuevo.')
        });
      };
      instance.start(); setRecording(true);
    } catch { setRecordingError('No se pudo acceder al micrófono. Revisa los permisos del navegador.'); }
  };

  const resetChat = () => { if (!messages.length || window.confirm('¿Empezamos una conversación nueva? Esta conversación guardada se borrará.')) { setMessages([]); setErrorMessage(''); } };

  return <div className="flex min-h-[100dvh] bg-[#f7f4eb] text-[#193e40]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col border-r border-[#dfe2d5] bg-[#f1f0e7] px-4 py-5 transition-transform md:static md:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><Link href="/" className="inline-flex items-center gap-2.5" data-testid="link-study-brand"><LogoMark /><span className="display-font text-xl font-extrabold tracking-tight">nexo<span className="text-[#e8896d]">.</span>ia</span></Link><button className="rounded-lg p-2 text-[#6d8077] hover:bg-[#e6e8dc] md:hidden" onClick={() => setMobileMenu(false)} aria-label="Cerrar navegación" data-testid="button-close-menu"><X size={18} /></button></div>
      <button onClick={resetChat} className="mt-9 flex items-center gap-3 rounded-xl border border-[#d8dfd3] bg-[#faf9f2] px-4 py-3 text-sm font-bold transition hover:border-[#94b9a8] hover:bg-white" data-testid="button-new-chat"><Plus size={17} />Nueva conversación</button>
      <div className="mt-9 px-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#91a099]">Tu mesa de estudio</div>
      <div className="mt-3 space-y-1">
        {MODES.map(item => <button key={item.id} onClick={() => { setMode(item.id); setMobileMenu(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${mode === item.id ? 'bg-[#dfeae0] text-[#276a62]' : 'text-[#668078] hover:bg-[#e8e9df]'}`} data-testid={`button-mode-${item.id}`} aria-pressed={mode === item.id}>
          <span className="grid size-8 place-items-center rounded-lg bg-[#f8f6ec]">{item.id === 'tutor' ? <CircleHelp size={16} /> : item.id === 'quiz' ? <Check size={16} /> : item.id === 'study_plan' ? <BookOpen size={16} /> : item.id === 'flashcards' ? <PanelLeftClose size={16} /> : <Sparkles size={16} />}</span>{item.title}
        </button>)}
      </div>
      <div className="mt-auto rounded-2xl border border-[#d9e2d6] bg-[#e6eee4] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#397268]"><span className={`size-2 rounded-full ${status?.available ? 'bg-[#4a9b79]' : statusLoading ? 'animate-pulse bg-[#d6a568]' : 'bg-[#ce795e]'}`} />{statusLoading ? 'Conectando con Nexo' : statusError ? 'Estado no disponible' : status?.available ? 'Tu tutor está listo' : 'Tutor temporalmente no disponible'}</div>{statusError && <button onClick={() => retryStatus()} className="mt-2 text-xs font-bold text-[#356d65] underline" data-testid="button-retry-status">Intentar de nuevo</button>}{status?.model && <p className="mt-2 break-all text-[10px] text-[#71877e]" data-testid="text-model">{status.model}</p>}</div>
      <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-3"><span className="grid size-9 place-items-center rounded-full bg-[#d7e4d9] text-xs font-bold text-[#35685f]">{user?.firstName?.slice(0, 1) || 'N'}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold" data-testid="text-account-name">{user?.firstName || 'Estudiante'}</p><button onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="text-[11px] font-semibold text-[#81918a] hover:text-[#305f57]" data-testid="button-sign-out">Cerrar sesión</button></div></div>
    </aside>
    {mobileMenu && <button className="fixed inset-0 z-30 bg-[#193e40]/20 md:hidden" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)} data-testid="button-menu-backdrop" />}
    <main className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#e3e3d8] bg-[#faf9f3]/80 px-4 md:px-8">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-[#6d8077] hover:bg-[#e9eade] md:hidden" onClick={() => setMobileMenu(true)} aria-label="Abrir navegación" data-testid="button-open-menu"><PanelLeftClose size={18} /></button><div className="hidden h-7 w-px bg-[#dfe2d5] md:block" /><span className="text-sm font-semibold text-[#71847b]">{modeDetails.title}</span><ChevronDown size={14} className="text-[#9aaa9f]" /></div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#82928b]"><span className={`size-2 rounded-full ${status?.available ? 'bg-[#4a9b79]' : statusLoading ? 'bg-[#d6a568]' : 'bg-[#cf775d]'}`} />{statusLoading ? 'Conectando' : statusError ? 'Sin estado' : status?.available ? 'Disponible' : 'No disponible'}</div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? <section className="mx-auto flex min-h-[calc(100dvh-230px)] max-w-[860px] flex-col justify-center px-5 py-10 md:px-10">
          <div className="reveal"><span className="inline-flex items-center gap-2 rounded-full border border-[#dce4d9] bg-[#edf2e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#4e8376]"><Sparkles size={13} />Tu tutor, a tu manera</span><h1 className="display-font mt-6 text-4xl font-extrabold leading-[1.05] tracking-[-.06em] md:text-6xl">{modeDetails.intro}<br /><span className="text-[#2a8378]">¿Por dónde empezamos?</span></h1><p className="mt-5 max-w-[540px] text-sm leading-7 text-[#6b8179]">Pregunta con tus palabras, comparte una foto o cuéntame qué necesitas. Aquí no hay preguntas demasiado pequeñas.</p></div>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">{['Explícame un concepto con un ejemplo sencillo', 'Ayúdame a preparar mi próximo examen', '¿Cómo puedo recordar mejor lo que estudio?'].map((suggestion, index) => <button key={suggestion} onClick={() => setDraft(suggestion)} className="group rounded-2xl border border-[#dfe3d8] bg-[#fbfaf4] p-4 text-left text-sm font-semibold leading-6 text-[#536f67] transition hover:-translate-y-0.5 hover:border-[#a9cabc] hover:bg-white" data-testid={`button-suggestion-${index}`}><span className="mb-4 grid size-8 place-items-center rounded-lg bg-[#e8efe5] text-[#518175]"><ArrowUp size={15} className="rotate-45" /></span>{suggestion}</button>)}</div>
        </section> : <section className="mx-auto max-w-[820px] space-y-7 px-5 py-8 md:px-10 md:py-12" aria-live="polite">
          {messages.map(message => <article key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`} data-testid={`message-${message.role}-${message.id}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${message.role === 'assistant' ? 'bg-[#dcebe0] text-[#30766c]' : 'bg-[#f2dfd3] text-[#a35c48]'}`}>{message.role === 'assistant' ? <Sparkles size={16} /> : <span className="text-xs font-bold">{user?.firstName?.slice(0, 1) || 'T'}</span>}</span>
            <div className={`max-w-[min(88%,640px)] rounded-2xl px-4 py-3.5 ${message.role === 'user' ? 'rounded-tr-sm bg-[#e6eee4]' : 'rounded-tl-sm border border-[#e3e5da] bg-[#fbfaf4]'}`}>
              {message.imageDataUrl && <img src={message.imageDataUrl} alt="Imagen adjunta a la pregunta" className="mb-3 max-h-64 max-w-full rounded-xl object-contain" data-testid={`image-attachment-${message.id}`} />}
              {message.content && <p className="whitespace-pre-wrap text-sm leading-7 text-[#375b55]" data-testid={`text-message-content-${message.id}`}>{message.content}</p>}
              {message.audio && <audio controls src={message.audio} className="mt-3 h-10 max-w-full" data-testid={`audio-reply-${message.id}`} aria-label="Respuesta de voz de Nexo" />}
            </div>
          </article>)}
          {busy && <div className="flex gap-3" role="status" aria-label="Nexo está preparando una respuesta" data-testid="status-assistant-loading"><span className="grid size-8 place-items-center rounded-xl bg-[#dcebe0] text-[#30766c]"><Sparkles size={16} /></span><div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#e3e5da] bg-[#fbfaf4] px-4 py-4"><span className="size-1.5 animate-pulse rounded-full bg-[#54897d]" /><span className="size-1.5 animate-pulse rounded-full bg-[#54897d] [animation-delay:150ms]" /><span className="size-1.5 animate-pulse rounded-full bg-[#54897d] [animation-delay:300ms]" /><span className="ml-1 text-xs text-[#82928b]">Pensando contigo</span></div></div>}
          {errorMessage && <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e8c8b9] bg-[#fbede4] px-4 py-3 text-sm text-[#925f4e]" role="alert" data-testid="status-chat-error"><span>{errorMessage}</span><button onClick={() => { setErrorMessage(''); setDraft(messages.at(-1)?.content || ''); }} className="shrink-0 font-bold underline" data-testid="button-retry-chat"><RotateCcw size={15} className="mr-1 inline" />Editar pregunta</button></div>}
        </section>}
      </div>
      <div className="shrink-0 px-4 pb-3 pt-2 md:px-8 md:pb-5"><div className="mx-auto max-w-[820px]">
        <div className="mb-2 flex items-center gap-2"><label className="text-[11px] font-semibold text-[#82918a]" htmlFor="subject-input">Materia</label><input id="subject-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Opcional" maxLength={120} className="w-36 rounded-full border border-[#e0e3d8] bg-[#fbfaf4] px-3 py-1.5 text-xs text-[#3a5e56] outline-none placeholder:text-[#a1aca5] focus:border-[#8bb5a3]" data-testid="input-subject" /><div className="relative ml-auto"><button onClick={() => setOpenModes(v => !v)} className="flex items-center gap-2 rounded-full bg-[#e8ede4] px-3 py-2 text-xs font-bold text-[#4c7168]" aria-expanded={openModes} data-testid="button-select-mode"><Sparkles size={13} />{modeDetails.title}<ChevronDown size={13} /></button>{openModes && <div className="absolute bottom-full right-0 z-20 mb-2 w-48 rounded-xl border border-[#dce2d7] bg-[#fbfaf4] p-1.5 shadow-xl">{MODES.map(item => <button key={item.id} onClick={() => { setMode(item.id); setOpenModes(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${mode === item.id ? 'bg-[#e6eee4] text-[#286b62]' : 'text-[#5d766e] hover:bg-[#f0f1e8]'}`} data-testid={`menu-mode-${item.id}`}>{item.title}</button>)}</div>}</div></div>
        <form onSubmit={handleSubmit} className="rounded-[1.4rem] border border-[#dce1d6] bg-[#fbfaf4] p-2 shadow-[0_8px_26px_rgba(38,76,66,.06)]">
          {imageDataUrl && <div className="relative mb-2 inline-block pl-2 pt-2"><img src={imageDataUrl} alt="Vista previa del archivo adjunto" className="h-16 w-16 rounded-lg object-cover" data-testid="image-attachment-preview" /><button type="button" onClick={() => setImageDataUrl('')} aria-label="Quitar imagen adjunta" className="absolute -right-2 -top-1 grid size-6 place-items-center rounded-full bg-[#193e40] text-white" data-testid="button-remove-image"><X size={13} /></button></div>}
          <textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} rows={2} placeholder={modeDetails.placeholder} className="max-h-40 min-h-[54px] w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-[#345b54] outline-none placeholder:text-[#94a29a]" aria-label="Escribe tu pregunta" data-testid="input-message" />
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-1"><button type="button" onClick={() => fileInput.current?.click()} aria-label="Adjuntar imagen" className="grid size-9 place-items-center rounded-xl text-[#778980] transition hover:bg-[#e9eee5] hover:text-[#32756b]" data-testid="button-attach-image"><ImagePlus size={18} /></button><input ref={fileInput} type="file" accept="image/*" onChange={selectImage} className="hidden" data-testid="input-image-file" /><button type="button" onClick={toggleRecord} disabled={busy} aria-label={recording ? 'Detener grabación' : 'Grabar pregunta de voz'} className={`grid size-9 place-items-center rounded-xl transition ${recording ? 'bg-[#f4ddd2] text-[#aa5745]' : 'text-[#778980] hover:bg-[#e9eee5] hover:text-[#32756b]'}`} data-testid="button-record-audio">{recording ? <MicOff size={18} /> : <Mic size={18} />}</button>{recording && <span className="text-xs font-semibold text-[#b15f4d]" role="status" data-testid="status-recording">Grabando… pulsa para terminar</span>}</div>
            <button type="submit" disabled={busy || (!draft.trim() && !imageDataUrl)} aria-label="Enviar pregunta" className="grid size-10 place-items-center rounded-xl bg-[#1e6660] text-white transition hover:bg-[#174f4b] disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-send-message">{busy ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowUp size={19} />}</button>
          </div>
        </form>
        {(recordingError || (errorMessage && messages.length === 0)) && <p className="mt-2 text-xs text-[#a85f4b]" role="alert" data-testid="status-input-error">{recordingError || errorMessage}</p>}
        <p className="mt-2 text-center text-[10px] text-[#9aa69e]">Nexo puede equivocarse. Usa sus respuestas como apoyo para aprender.</p>
      </div></div>
    </main>
  </div>;
}