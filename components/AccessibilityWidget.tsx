'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { type A11yPreferences, serializeA11yPreferences, useAccessibilityStore } from '@/store/useAccessibilityStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  X, ChevronRight, ArrowLeft, Eye, Type, Keyboard, 
  Volume2, Focus, RotateCcw, ShieldCheck, BrainCircuit,
  ZoomIn, Ear, BookOpen, Globe
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const subscribeToClientMount = () => () => undefined;

const UniversalAccessIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M12 8.5v5" />
    <path d="M12 9.5l-3.5-1" />
    <path d="M12 9.5l3.5-1" />
    <path d="M12 13.5l-2.5 4" />
    <path d="M12 13.5l2.5 4" />
    <circle cx="12" cy="2.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="21.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="2.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="21.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const NavRow = ({ icon: Icon, title, onClick }: { icon: LucideIcon; title: string; onClick: () => void }) => (
  <button onClick={onClick} aria-label={`Abrir menu de ${title}`} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 mb-2 rounded-xl transition-colors hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-emerald-800" aria-hidden="true" />
      <span className="font-semibold text-[15px] text-slate-800">{title}</span>
    </div>
    <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
  </button>
);

const ProfileCard = ({ icon: Icon, title, desc, onClick, active }: { icon: LucideIcon; title: string; desc: string; onClick: () => void; active: boolean }) => (
  <button 
    onClick={onClick} 
    aria-pressed={active}
    className={`flex flex-col p-4 rounded-xl border text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all ${active ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon size={18} className={active ? 'text-emerald-700' : 'text-slate-700'} aria-hidden="true" />
      <h4 className={`font-bold text-[14px] ${active ? 'text-emerald-900' : 'text-slate-800'}`}>{title}</h4>
    </div>
    <p className="text-[13px] text-slate-600 leading-relaxed">{desc}</p>
  </button>
);

const RangeSliderRow = ({ label, value, min, max, step, unit = "%", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-3 border-b border-slate-100">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[14px] font-medium text-slate-800" id={`label-${label.replace(/\s+/g, '-')}`}>{label}</span>
        <span className="text-[13px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100" aria-live="polite" aria-atomic="true">
          {value}{unit}
        </span>
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step}
        aria-labelledby={`label-${label.replace(/\s+/g, '-')}`}
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700 a11y-custom-slider"
        style={{ background: `linear-gradient(to right, #047857 0%, #047857 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)` }}
      />
    </div>
  );
};

const SelectGroup = ({ label, options, currentValue, onChange }: { label: string; options: { label: string; value: string }[]; currentValue: string; onChange: (value: string) => void }) => (
  <div className="py-4 border-b border-slate-100" role="radiogroup" aria-label={label}>
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3" aria-hidden="true">{label}</span>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button 
          key={opt.value} role="radio" aria-checked={currentValue === opt.value}
          onClick={() => onChange(opt.value)} 
          className={`px-3 py-2 rounded-lg text-[13px] font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700 ${currentValue === opt.value ? 'bg-emerald-800 border-emerald-900 text-white shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const ToggleSwitch = ({ label, description, active, onChange }: { label: string; description?: string; active: boolean; onChange: (value: boolean) => void }) => (
  <div className="py-4 border-b border-slate-100 last:border-0">
    <div className="flex items-center justify-between cursor-pointer group" onClick={() => onChange(!active)}>
      <span className="text-[14px] font-medium text-slate-800 group-hover:text-slate-900 transition-colors" id={`label-${label.replace(/\s+/g, '-')}`}>{label}</span>
      <button 
        role="switch" aria-checked={active} aria-labelledby={`label-${label.replace(/\s+/g, '-')}`}
        className={`relative flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700 shrink-0 ${active ? 'bg-emerald-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
    {description && <p className="text-[13px] text-slate-600 mt-2 leading-relaxed pr-6">{description}</p>}
  </div>
);

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<'main'|'visual'|'text'|'nav'|'audio'|'focus'>('main');
  const isMounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  
  const currentTextRef = useRef(''); 
  const store = useAccessibilityStore();
  const hydrateSettings = useAccessibilityStore((state) => state.hydrateSettings);
  const resetAll = useAccessibilityStore((state) => state.resetAll);
  
  type PositionKey = 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'center-right' | 'bottom-right';
  const pos = store.widgetPosition as PositionKey;
  const isLeft = pos.includes('left');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousIsOpen = useRef(isOpen);

  // =========================================================================
  // 🟢 INTEGRAÇÃO COM SUPABASE E CONTROLE ESTRITO DE SESSÃO
  // =========================================================================
  useEffect(() => {
    let isSubscribed = true;

    // 1. Validação inicial ao carregar a página
    const loadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('accessibility_settings')
          .eq('id', session.user.id)
          .single();

        if (!error && data?.accessibility_settings && Object.keys(data.accessibility_settings).length > 0 && isSubscribed) {
          hydrateSettings(data.accessibility_settings);
        }
      } else {
        // Se NÃO estiver logado ao abrir/recarregar a página: Zera tudo!
        resetAll();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ozk-a11y-preferences');
        }
      }
    };

    loadSettings();

    // 2. Ouvinte global de login e logout
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // Ao clicar em sair da conta: Reseta tudo na hora e apaga qualquer cache
          resetAll();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ozk-a11y-preferences');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('accessibility_settings')
          .eq('id', session.user.id)
          .single();

        if (!error && data?.accessibility_settings && Object.keys(data.accessibility_settings).length > 0 && isSubscribed) {
          hydrateSettings(data.accessibility_settings);
        }
      }
    });

    // 3. Salvar alterações no banco apenas se estiver autenticado
    let timeoutId: ReturnType<typeof setTimeout>;
    const unsubscribeStore = useAccessibilityStore.subscribe((state) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { error } = await supabase
            .from('profiles')
            .update({ accessibility_settings: serializeA11yPreferences(state) })
            .eq('id', session.user.id);
          if (error) console.error('Falha ao salvar preferências de acessibilidade:', error.message);
        }
      }, 1000); 
    });

    return () => {
      isSubscribed = false;
      authListener.unsubscribe();
      unsubscribeStore();
      clearTimeout(timeoutId);
    };
  }, [hydrateSettings, resetAll]);
  // =========================================================================

  useEffect(() => { 
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (previousIsOpen.current && !isOpen) setTimeout(() => triggerRef.current?.focus(), 100);
    else if (!previousIsOpen.current && isOpen) setTimeout(() => closeBtnRef.current?.focus(), 50);
    previousIsOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const toggleMediaMute = () => document.querySelectorAll<HTMLMediaElement>('video, audio').forEach(m => m.muted = store.muteMedia);
    toggleMediaMute();
    const observer = new MutationObserver(toggleMediaMute);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [store.muteMedia]);

  const speakText = (text: string, rate: number) => {
    window.speechSynthesis.cancel(); 
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = rate / 100;
    window.speechSynthesis.speak(utterance);
  };

  const handleReadSelected = () => {
    const text = window.getSelection()?.toString();
    if (text?.trim()) { currentTextRef.current = text; speakText(text, store.ttsSpeed); } 
    else toast('Selecione (grife) um texto no site primeiro.', { icon: '📢', style: { background: '#0f172a', color: '#fff', fontSize: '14px', borderRadius: '8px' } });
  };

  const handleReadPage = () => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelector('#a11y-widget-root')?.remove();
    clone.querySelectorAll('style, script, noscript, svg, iframe, canvas').forEach(el => el.remove());
    const text = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim(); 
    if (text) { currentTextRef.current = text; speakText(text, store.ttsSpeed); }
  };

  const handlePauseResume = () => window.speechSynthesis.paused ? window.speechSynthesis.resume() : window.speechSynthesis.pause();
  const handleStop = () => { window.speechSynthesis.cancel(); document.querySelectorAll('.a11y-reading-highlight').forEach(el => el.classList.remove('a11y-reading-highlight')); };
  const changeSpeed = (newSpeed: number) => { store.updateValue('ttsSpeed', newSpeed); if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) speakText(currentTextRef.current, newSpeed); };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (store.readingGuide !== 'none') { setMouseX(e.clientX); setMouseY(e.clientY); } };
    const handleClick = (e: MouseEvent) => {
      if (!store.ttsEnabled) return;
      const widget = document.getElementById('a11y-widget-root');
      if (widget?.contains(e.target as Node)) return;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        document.querySelectorAll('.a11y-reading-highlight').forEach(el => el.classList.remove('a11y-reading-highlight'));
        e.preventDefault(); e.stopPropagation(); return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === 'BODY' || target.tagName === 'MAIN') return;
      const textToRead = target.innerText || target.getAttribute('aria-label') || target.getAttribute('alt');
      if (textToRead?.trim()) {
        e.preventDefault(); 
        target.classList.add('a11y-reading-highlight');
        currentTextRef.current = textToRead;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'pt-BR'; utterance.rate = store.ttsSpeed / 100;
        utterance.onend = () => target.classList.remove('a11y-reading-highlight');
        utterance.onerror = () => target.classList.remove('a11y-reading-highlight');
        window.speechSynthesis.speak(utterance);
      }
    };
    if (store.readingGuide !== 'none') document.addEventListener('mousemove', handleMouseMove);
    if (store.ttsEnabled) document.body.addEventListener('click', handleClick);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.body.removeEventListener('click', handleClick); };
  }, [store.readingGuide, store.ttsEnabled, store.ttsSpeed]);

  useEffect(() => {
    if (!isMounted) return;
    const html = document.documentElement;

    html.style.setProperty('--a11y-text-scale', `${store.textSize / 100}`);
    html.style.setProperty('--a11y-page-scale', `${store.pageScale}%`);
    html.style.setProperty('--a11y-line-height', `${1.5 + (store.lineHeight * 0.1)}`);
    html.style.setProperty('--a11y-letter-spacing', `${store.letterSpacing}px`);
    html.style.setProperty('--a11y-word-spacing', `${store.wordSpacing}px`);
    html.style.setProperty('--a11y-saturation', `${store.saturation}%`);
    html.style.setProperty('--a11y-brightness', `${store.brightness}%`);

    html.classList.toggle('a11y-text-resize', store.textSize !== 100);
    html.classList.toggle('a11y-text-active', store.lineHeight > 0 || store.letterSpacing > 0 || store.wordSpacing > 0);
    html.classList.toggle('a11y-dyslexia', store.dyslexiaFont);
    html.classList.toggle('a11y-legible', store.legibleFont);
    html.classList.toggle('a11y-reading-mode', store.readingMode);
    html.classList.toggle('a11y-invert', store.invertColors);
    html.classList.toggle('a11y-highlight-titles', store.highlightTitles);
    html.classList.toggle('a11y-highlight-links', store.highlightLinks);
    html.classList.toggle('a11y-highlight-buttons', store.highlightButtons);
    html.classList.toggle('a11y-reduce-motion', store.reduceMotion);
    html.classList.toggle('a11y-pause-animations', store.pauseAnimations);
    html.classList.toggle('a11y-keyboard-tips', store.keyboardTips);
    html.classList.toggle('a11y-hover-focus', store.hoverFocus);

    html.classList.remove('a11y-daltonism-none', 'a11y-daltonism-protanopia', 'a11y-daltonism-deuteranopia', 'a11y-daltonism-tritanopia', 'a11y-daltonism-monochromatic');
    html.classList.add(`a11y-daltonism-${store.daltonism}`);

    const isNextJsBugSafeUrl = window.location.pathname;
    let filterString = '';
    
    if (store.highContrast > 0) filterString += `contrast(${100 + store.highContrast}%) `;
    if (store.invertColors) filterString += 'invert(100%) hue-rotate(180deg) ';
    
    if (store.daltonism === 'monochromatic') filterString += 'grayscale(100%) contrast(120%) ';
    else if (store.daltonism === 'protanopia') filterString += `url(${isNextJsBugSafeUrl}#daltonize-protanopia) `;
    else if (store.daltonism === 'deuteranopia') filterString += `url(${isNextJsBugSafeUrl}#daltonize-deuteranopia) `;
    else if (store.daltonism === 'tritanopia') filterString += `url(${isNextJsBugSafeUrl}#daltonize-tritanopia) `;
    
    filterString += `saturate(${store.saturation}%) brightness(${store.brightness}%)`;

    let globalCSS = '';
    
    if (filterString.trim() !== 'saturate(100%) brightness(100%)') {
      globalCSS += `html { filter: ${filterString} !important; -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }`;
    }

    globalCSS += `
      .a11y-custom-slider { -webkit-appearance: none; appearance: none; background: transparent; }
      .a11y-custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: #ffffff; border: 2.5px solid #047857; border-radius: 50%; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); transition: transform 0.1s ease; }
      .a11y-custom-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
      .a11y-custom-slider::-moz-range-thumb { width: 18px; height: 18px; background: #ffffff; border: 2.5px solid #047857; border-radius: 50%; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
    `;

    if (store.invertColors) globalCSS += `html.a11y-invert img, html.a11y-invert video, html.a11y-invert iframe, body.a11y-invert img, body.a11y-invert video, body.a11y-invert iframe { filter: none !important; }`;
    if (store.textAlign !== 'default') globalCSS += `html body *:not(#a11y-widget-root):not(#a11y-widget-root *) { text-align: ${store.textAlign} !important; }`;
    if (store.hideImages) {
      globalCSS += `
        img, video, iframe { opacity: 0 !important; visibility: hidden !important; }
        header img, nav img, footer img, .fixed img, .absolute img, [alt*="logo"], [src*="logo"], [alt*="whatsapp"], [src*="whatsapp"] { opacity: 1 !important; visibility: visible !important; }
        main, section, article { background-image: none !important; }
      `;
    }

    if (store.cursorSize !== 'default' || store.cursorColor !== 'default') {
      const size = store.cursorSize === 'large' ? 48 : store.cursorSize === 'medium' ? 36 : 28;
      const fill = store.cursorColor === 'white' ? 'white' : store.cursorColor === 'yellow' ? '#FDE047' : 'black';
      const stroke = store.cursorColor === 'black' ? 'white' : 'black';
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24'><path d='M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.7z' fill='${fill}' stroke='${stroke}' stroke-width='1.5'/></svg>`;
      globalCSS += `html, body, *:not(#a11y-widget-root *) { cursor: url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 2, auto !important; }`;
    }

    const prefixes = ['', 'sm\\\\:', 'md\\\\:', 'lg\\\\:', 'xl\\\\:', '2xl\\\\:'];
    const twSizes = { 'xxs':'0.65rem', 'xs':'0.75rem', 'sm':'0.875rem', 'base':'1rem', 'lg':'1.125rem', 'xl':'1.25rem', '2xl':'1.5rem', '3xl':'1.875rem', '4xl':'2.25rem', '5xl':'3rem', '6xl':'3.75rem', '7xl':'4.5rem', '8xl':'6rem', '9xl':'8rem' };
    prefixes.forEach(p => {
      Object.entries(twSizes).forEach(([n, v]) => globalCSS += `.a11y-text-resize .${p}text-${n}:not(#a11y-widget-root *) { font-size: calc(${v} * var(--a11y-text-scale)) !important; }\n`);
      [8,9,10,11,12,13,14,15,16,17,18,20,22,24].forEach(s => globalCSS += `.a11y-text-resize .${p}text-\\[${s}px\\]:not(#a11y-widget-root *) { font-size: calc(${s}px * var(--a11y-text-scale)) !important; }\n`);
    });

    globalCSS += `
      html, body { zoom: var(--a11y-page-scale, 100%); }
      .a11y-reading-highlight { outline: 3px solid #10B981 !important; outline-offset: 4px !important; background-color: rgba(16, 185, 129, 0.15) !important; border-radius: 4px !important; animation: pulse-reading 1.5s infinite !important; transition: all 0.2s ease-in-out !important; }
      @keyframes pulse-reading { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

      /* =========================================================
         WCAG 1.4.1 - TEXTURAS PARA DALTONISMO (OVERLAY INVISÍVEL)
         O :not(.fixed):not(.absolute) protege o botão do WhatsApp
         ========================================================= */
      html:not(.a11y-daltonism-none) button:not(#a11y-widget-root *):not(.fixed):not(.absolute),
      html:not(.a11y-daltonism-none) [role="button"]:not(#a11y-widget-root *):not(.fixed):not(.absolute),
      html:not(.a11y-daltonism-none) a[class*="bg-"]:not(#a11y-widget-root *):not(.fixed):not(.absolute),
      html:not(.a11y-daltonism-none) a[class*="btn"]:not(#a11y-widget-root *):not(.fixed):not(.absolute) {
        position: relative !important;
      }
      
      html:not(.a11y-daltonism-none) button:not(#a11y-widget-root *)::after,
      html:not(.a11y-daltonism-none) [role="button"]:not(#a11y-widget-root *)::after,
      html:not(.a11y-daltonism-none) a[class*="bg-"]:not(#a11y-widget-root *)::after,
      html:not(.a11y-daltonism-none) a[class*="btn"]:not(#a11y-widget-root *)::after {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        pointer-events: none !important;
        border-radius: inherit !important;
        background-image: repeating-linear-gradient(45deg, rgba(128, 128, 128, 0.15), rgba(128, 128, 128, 0.15) 5px, transparent 5px, transparent 10px) !important;
        z-index: 10 !important;
      }
    `;

    let styleEl = document.getElementById('ozk-a11y-static-styles');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'ozk-a11y-static-styles'; document.head.appendChild(styleEl); }
    styleEl.textContent = globalCSS;

  }, [store, isMounted]);

  if (!isMounted) return null;

  const positionClasses = {
    trigger: {
      'top-left': 'top-10 left-0 rounded-r-xl',
      'center-left': 'top-1/2 -translate-y-1/2 left-0 rounded-r-xl',
      'bottom-left': 'bottom-10 left-0 rounded-r-xl',
      'top-right': 'top-10 right-0 rounded-l-xl',
      'center-right': 'top-1/2 -translate-y-1/2 right-0 rounded-l-xl',
      'bottom-right': 'bottom-10 right-0 rounded-l-xl',
    },
    panel: {
      'top-left': 'top-10 left-4 sm:left-6',
      'center-left': 'top-1/2 -translate-y-1/2 left-4 sm:left-6',
      'bottom-left': 'bottom-10 left-4 sm:left-6',
      'top-right': 'top-10 right-4 sm:right-6',
      'center-right': 'top-1/2 -translate-y-1/2 right-4 sm:right-6',
      'bottom-right': 'bottom-10 right-4 sm:right-6',
    },
    triggerOpen: {
      'top-left': '-translate-x-14 opacity-0',
      'center-left': '-translate-x-14 opacity-0',
      'bottom-left': '-translate-x-14 opacity-0',
      'top-right': 'translate-x-14 opacity-0',
      'center-right': 'translate-x-14 opacity-0',
      'bottom-right': 'translate-x-14 opacity-0',
    },
    panelClosed: {
      'top-left': '-translate-x-[120%] opacity-0 pointer-events-none',
      'center-left': '-translate-x-[120%] opacity-0 pointer-events-none',
      'bottom-left': '-translate-x-[120%] opacity-0 pointer-events-none',
      'top-right': 'translate-x-[120%] opacity-0 pointer-events-none',
      'center-right': 'translate-x-[120%] opacity-0 pointer-events-none',
      'bottom-right': 'translate-x-[120%] opacity-0 pointer-events-none',
    },
    contentSlideOut: {
      'left': '-translate-x-full',
      'right': 'translate-x-full',
    }
  };

  return (
    <>
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="daltonize-protanopia" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0.6 0 1 0 0  0 0 0 1 0" />
          </filter>
          <filter id="daltonize-deuteranopia" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0.6 1 0 0  0 0 0 1 0" />
          </filter>
          <filter id="daltonize-tritanopia" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0.6 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {store.readingGuide === 'line' && (
        <div className="fixed pointer-events-none z-[9998] flex justify-center" style={{ top: mouseY + 20, left: mouseX, transform: 'translateX(-50%)', width: '600px' }} aria-hidden="true">
          <div className="relative w-full h-[6px] bg-black border-[1.5px] border-yellow-400">
            <div className="absolute left-1/2 -top-[12px] -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-yellow-400">
              <div className="absolute -left-[7px] top-[3px] w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-black"></div>
            </div>
          </div>
        </div>
      )}

      {store.readingGuide === 'mask' && (
        <>
          <div className="fixed top-0 left-0 w-full bg-black/60 z-[9998] pointer-events-none transition-transform duration-75" style={{ height: Math.max(0, mouseY - 50) }} />
          <div className="fixed bottom-0 left-0 w-full bg-black/60 z-[9998] pointer-events-none transition-transform duration-75" style={{ top: mouseY + 50, height: '100vh' }} />
        </>
      )}

      {store.readingGuide === 'spotlight' && (
        <div className="fixed inset-0 z-[9998] pointer-events-none transition-transform duration-75" style={{ background: `radial-gradient(circle 160px at ${mouseX}px ${mouseY}px, transparent 0%, rgba(0,0,0,0.8) 100%)` }} aria-hidden="true" />
      )}

      <div id="a11y-widget-root" className="fixed top-0 left-0 w-full h-full z-[99998] pointer-events-none" aria-label="Camada de Acessibilidade">
        
        <button
          ref={triggerRef}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) setCurrentMenu('main'); }}
          aria-expanded={isOpen} aria-haspopup="dialog" aria-controls="a11y-panel"
          aria-label="Menu de ferramentas de acessibilidade"
          className={`pointer-events-auto absolute w-14 h-16 bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/50 
            ${positionClasses.trigger[pos]}
            ${isOpen ? positionClasses.triggerOpen[pos] : 'translate-x-0 opacity-100'}`}
        >
          <UniversalAccessIcon size={34} />
        </button>

        <div 
          id="a11y-panel" ref={panelRef} role="dialog" aria-modal="true" aria-label="Painel de Controle de Acessibilidade" aria-hidden={!isOpen} inert={!isOpen}
          className={`pointer-events-auto absolute w-[min(340px,calc(100vw-2rem))] sm:w-[380px] bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col max-h-[85dvh] rounded-2xl overflow-hidden transition-transform duration-300 ease-out 
          ${positionClasses.panel[pos]}
          ${isOpen ? 'translate-x-0 opacity-100' : positionClasses.panelClosed[pos]}`}>
          
          <div className="bg-emerald-800 p-5 flex justify-between items-center text-white shrink-0">
            <div>
              <h2 className="font-bold text-[16px] flex items-center gap-2"><UniversalAccessIcon size={20} /> Acessibilidade</h2>
              <p className="text-[12px] text-emerald-200 mt-1 font-medium">Painel de Preferências Ozonteck</p>
            </div>
            <button 
              ref={closeBtnRef} onClick={() => setIsOpen(false)} aria-label="Fechar painel" 
              className="p-2 hover:bg-emerald-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden bg-white" style={{ minHeight: 'min(60dvh, 480px)' }}>
            
            <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar p-5 transition-transform duration-300 ease-in-out ${currentMenu === 'main' ? 'translate-x-0' : positionClasses.contentSlideOut[isLeft ? 'left' : 'right']}`}>
              
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Ajustes Personalizados</h3>
              <div className="space-y-1 mb-8" role="menu">
                <NavRow icon={Eye} title="Configurações Visuais" onClick={() => setCurrentMenu('visual')} />
                <NavRow icon={Type} title="Texto e Leitura" onClick={() => setCurrentMenu('text')} />
                <NavRow icon={Keyboard} title="Navegação e Foco" onClick={() => setCurrentMenu('nav')} />
                <NavRow icon={Volume2} title="Áudio e Narração (TTS)" onClick={() => setCurrentMenu('audio')} />
                <NavRow icon={Focus} title="Foco e Animações" onClick={() => setCurrentMenu('focus')} />
              </div>

              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Perfis de Acessibilidade</h3>
                <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">Ative perfis para aplicar configurações recomendadas de uma vez.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4">
                <ProfileCard icon={Eye} title="Deficiência visual" desc="Contraste elevado, texto maior e cursor ampliado." active={store.activeProfiles.includes('visual_impairment')} onClick={() => store.toggleProfile('visual_impairment')} />
                <ProfileCard icon={ZoomIn} title="Baixa visão" desc="Aumento de texto e contraste focados em legibilidade." active={store.activeProfiles.includes('low_vision')} onClick={() => store.toggleProfile('low_vision')} />
                <ProfileCard icon={Ear} title="Cego / leitor de tela" desc="Otimiza o uso em leitores ocultando as imagens." active={store.activeProfiles.includes('blind')} onClick={() => store.toggleProfile('blind')} />
                <ProfileCard icon={Keyboard} title="Deficiência motora" desc="Navegação por teclado, cursor ampliado e animações pausadas." active={store.activeProfiles.includes('motor')} onClick={() => store.toggleProfile('motor')} />
                <ProfileCard icon={BookOpen} title="Dislexia" desc="Fonte amigável, alinhamento à esquerda e espaçamento." active={store.activeProfiles.includes('dyslexia')} onClick={() => store.toggleProfile('dyslexia')} />
                <ProfileCard icon={BrainCircuit} title="Cognitivo" desc="Reduz distrações, simplifica texto e foca o layout." active={store.activeProfiles.includes('cognitive')} onClick={() => store.toggleProfile('cognitive')} />
                <ProfileCard icon={Focus} title="TDAH / concentração" desc="Modo foco com faixa horizontal e menos distrações." active={store.activeProfiles.includes('adhd')} onClick={() => store.toggleProfile('adhd')} />
                <ProfileCard icon={ShieldCheck} title="Epilepsia / sensibilidade" desc="Silencia sons e bloqueia animações na página." active={store.activeProfiles.includes('epilepsy')} onClick={() => store.toggleProfile('epilepsy')} />
                <ProfileCard icon={Globe} title="Daltonismo (protanopia)" desc="Ajusta cores para percepção de protanopia." active={store.activeProfiles.includes('protanopia')} onClick={() => store.toggleProfile('protanopia')} />
                <ProfileCard icon={Globe} title="Daltonismo (deuteranopia)" desc="Ajusta cores para percepção de deuteranopia." active={store.activeProfiles.includes('deuteranopia')} onClick={() => store.toggleProfile('deuteranopia')} />
                <ProfileCard icon={Globe} title="Daltonismo (tritanopia)" desc="Ajusta cores para percepção de tritanopia." active={store.activeProfiles.includes('tritanopia')} onClick={() => store.toggleProfile('tritanopia')} />
              </div>
            </div>

            <div className={`absolute inset-0 w-full h-full flex flex-col bg-white transition-transform duration-300 ease-in-out ${currentMenu !== 'main' ? 'translate-x-0' : (isLeft ? 'translate-x-full' : '-translate-x-full')}`}>
              
              <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white shrink-0">
                <button onClick={() => setCurrentMenu('main')} aria-label="Voltar" className="p-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"><ArrowLeft size={16} aria-hidden="true" /></button>
                <h3 className="font-bold text-slate-800 text-[14px] uppercase tracking-wide" aria-live="polite" aria-atomic="true">
                  {currentMenu === 'visual' && 'Configurações Visuais'}
                  {currentMenu === 'text' && 'Texto e Leitura'}
                  {currentMenu === 'nav' && 'Navegação e Foco'}
                  {currentMenu === 'audio' && 'Áudio e Leitura'}
                  {currentMenu === 'focus' && 'Foco e Animações'}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-6" tabIndex={-1}>
                
                {currentMenu === 'visual' && (
                  <>
                    <div className="py-4 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">CORES E CONTRASTE</span>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button aria-pressed={store.highContrast === 0 && !store.invertColors} onClick={() => { store.updateValue('highContrast', 0); store.updateValue('invertColors', false); }} className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all ${(store.highContrast === 0 && !store.invertColors) ? 'bg-emerald-800 border-emerald-900 text-white shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>Padrão</button>
                        <button aria-pressed={store.highContrast > 0} onClick={() => store.updateValue('highContrast', store.highContrast > 0 ? 0 : 50)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all ${store.highContrast > 0 ? 'bg-emerald-800 border-emerald-900 text-white shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>Alto Contraste</button>
                        <button aria-pressed={store.invertColors} onClick={() => store.updateValue('invertColors', !store.invertColors)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all ${store.invertColors ? 'bg-emerald-800 border-emerald-900 text-white shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>Inverter Cores</button>
                      </div>
                      {store.highContrast > 0 && <div className="mt-4 border-t border-slate-100 pt-2 animate-in fade-in slide-in-from-top-2"><RangeSliderRow label="Nível de Contraste" value={store.highContrast} min={10} max={100} step={10} onChange={(v:number) => store.updateValue('highContrast', v)} /></div>}
                    </div>
                    <RangeSliderRow label="Saturação" value={store.saturation} min={0} max={200} step={10} onChange={(v:number) => store.updateValue('saturation', v)} />
                    <RangeSliderRow label="Brilho" value={store.brightness} min={50} max={150} step={10} onChange={(v:number) => store.updateValue('brightness', v)} />
                    <SelectGroup label="DALTONISMO" currentValue={store.daltonism} onChange={(value) => store.updateValue('daltonism', value as A11yPreferences['daltonism'])} options={[{label:'Desativado', value:'none'}, {label:'Protanopia', value:'protanopia'}, {label:'Deuteranopia', value:'deuteranopia'}, {label:'Tritanopia', value:'tritanopia'}, {label:'Zero Saturação', value:'monochromatic'}]} />
                  </>
                )}

                {currentMenu === 'text' && (
                  <>
                    <div className="space-y-1">
                      <RangeSliderRow label="Tamanho do texto" value={store.textSize} min={100} max={200} step={10} onChange={(v:number) => store.updateValue('textSize', v)} />
                      <RangeSliderRow label="Escala da página" value={store.pageScale} min={100} max={200} step={10} onChange={(v:number) => store.updateValue('pageScale', v)} />
                      <RangeSliderRow label="Espaçamento entre letras" value={store.letterSpacing} min={0} max={10} step={1} unit="px" onChange={(v:number) => store.updateValue('letterSpacing', v)} />
                      <RangeSliderRow label="Espaçamento entre palavras" value={store.wordSpacing} min={0} max={10} step={1} unit="px" onChange={(v:number) => store.updateValue('wordSpacing', v)} />
                      <RangeSliderRow label="Altura da linha" value={store.lineHeight} min={0} max={10} step={1} unit="" onChange={(v:number) => store.updateValue('lineHeight', v)} />
                    </div>
                    <SelectGroup label="ALINHAMENTO DE TEXTO" currentValue={store.textAlign} onChange={(value) => store.updateValue('textAlign', value as A11yPreferences['textAlign'])} options={[{label:'Padrão', value:'default'}, {label:'Esquerda', value:'left'}, {label:'Centro', value:'center'}, {label:'Direita', value:'right'}, {label:'Justificado', value:'justify'}]} />
                    <div className="border-t border-slate-100 pt-2 mt-2">
                      <ToggleSwitch label="Fonte para dislexia" active={store.dyslexiaFont} onChange={(value) => store.updateValue('dyslexiaFont', value)} />
                      <ToggleSwitch label="Fonte legível" active={store.legibleFont} onChange={(value) => store.updateValue('legibleFont', value)} />
                      <ToggleSwitch label="Modo leitura" active={store.readingMode} onChange={(value) => store.updateValue('readingMode', value)} />
                    </div>
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Destaques</span>
                      <ToggleSwitch label="Destacar títulos" active={store.highlightTitles} onChange={(value) => store.updateValue('highlightTitles', value)} />
                      <ToggleSwitch label="Destacar links" active={store.highlightLinks} onChange={(value) => store.updateValue('highlightLinks', value)} />
                      <ToggleSwitch label="Destacar botões" active={store.highlightButtons} onChange={(value) => store.updateValue('highlightButtons', value)} />
                    </div>
                  </>
                )}

                {currentMenu === 'nav' && (
                  <>
                    <div className="pb-4 mb-4 border-b border-slate-100">
                      <SelectGroup 
                        label="POSIÇÃO DO BOTÃO" 
                        currentValue={store.widgetPosition} 
                        onChange={(value) => store.updateValue('widgetPosition', value as A11yPreferences['widgetPosition'])}
                        options={[
                          {label:'Sup. Esq.', value:'top-left'},
                          {label:'Sup. Dir.', value:'top-right'},
                          {label:'Meio Esq.', value:'center-left'},
                          {label:'Meio Dir.', value:'center-right'},
                          {label:'Inf. Esq.', value:'bottom-left'}, 
                          {label:'Inf. Dir.', value:'bottom-right'}
                        ]} 
                      />
                    </div>

                    <ToggleSwitch label="Dicas de navegação por teclado" description="Ative e pressione a tecla 'Tab' para navegar." active={store.keyboardTips} onChange={(value) => store.updateValue('keyboardTips', value)} />
                    <ToggleSwitch label="Destacar foco sob o mouse" description="Aplica uma borda visível em elementos clicáveis." active={store.hoverFocus} onChange={(value) => store.updateValue('hoverFocus', value)} />
                    
                    <SelectGroup label="TAMANHO DO CURSOR" currentValue={store.cursorSize} onChange={(value) => store.updateValue('cursorSize', value as A11yPreferences['cursorSize'])} options={[{label:'Padrão', value:'default'}, {label:'Médio', value:'medium'}, {label:'Grande', value:'large'}]} />
                    <SelectGroup label="COR DO CURSOR" currentValue={store.cursorColor} onChange={(value) => store.updateValue('cursorColor', value as A11yPreferences['cursorColor'])} options={[{label:'Padrão', value:'default'}, {label:'Preto', value:'black'}, {label:'Branco', value:'white'}, {label:'Amarelo', value:'yellow'}]} />
                    <SelectGroup label="FERRAMENTAS DE FOCO" currentValue={store.readingGuide} onChange={(value) => store.updateValue('readingGuide', value as A11yPreferences['readingGuide'])} options={[{label:'Desligado', value:'none'}, {label:'Guia de leitura', value:'line'}, {label:'Faixa horizontal', value:'mask'}, {label:'Foco com luz', value:'spotlight'}]} />
                  </>
                )}

                {currentMenu === 'audio' && (
                  <>
                    <ToggleSwitch label="Leitura ao clicar" description="Ative esta função. Em seguida, dê 1 clique em qualquer texto do site para escutá-lo." active={store.ttsEnabled} onChange={(value) => { store.updateValue('ttsEnabled', value); if (!value) handleStop(); }} />
                    <ToggleSwitch label="Silenciar mídias" description="Muta automaticamente qualquer vídeo ou áudio." active={store.muteMedia} onChange={(value) => store.updateValue('muteMedia', value)} />

                    <div className="mb-6 pt-4 border-t border-slate-100 mt-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Leitura em voz alta</span>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={handleReadSelected} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors bg-white shadow-sm focus:ring-2 focus:ring-emerald-700">Ler texto selecionado</button>
                        <button onClick={handleReadPage} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors bg-white shadow-sm focus:ring-2 focus:ring-emerald-700">Ler página</button>
                        <button onClick={handlePauseResume} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors bg-white shadow-sm focus:ring-2 focus:ring-emerald-700">Pausar / Retomar</button>
                        <button onClick={handleStop} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-red-500 hover:text-red-700 transition-colors bg-white shadow-sm focus:ring-2 focus:ring-red-700">Parar</button>
                      </div>
                      <div className="border-t border-slate-100 pt-3">
                        <RangeSliderRow label="Velocidade" value={store.ttsSpeed} min={50} max={500} step={10} onChange={(v:number) => { store.updateValue('ttsSpeed', v); changeSpeed(v); }} />
                      </div>
                    </div>
                  </>
                )}

                {currentMenu === 'focus' && (
                  <>
                    <div className="mb-8">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Animações e Interações</span>
                      <ToggleSwitch label="Pausar animações" description="Congela elementos com reprodução contínua." active={store.pauseAnimations} onChange={(value) => store.updateValue('pauseAnimations', value)} />
                      <ToggleSwitch label="Reduzir movimento" description="Remove deslizes e transições ao rolar a página." active={store.reduceMotion} onChange={(value) => store.updateValue('reduceMotion', value)} />
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <ToggleSwitch label="Ocultar imagens (Foco Extremo)" description="Remove imagens e vídeos do site para focar no texto." active={store.hideImages} onChange={(value) => store.updateValue('hideImages', value)} />
                      </div>
                    </div>
                    <div className="py-4 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Perfis Relacionados</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ProfileCard icon={BrainCircuit} title="Cognitivo" desc="Reduz distrações e simplifica a leitura da página." active={store.activeProfiles.includes('cognitive')} onClick={() => store.toggleProfile('cognitive')} />
                        <ProfileCard icon={Focus} title="TDAH / concentração" desc="Modo foco com faixa horizontal e menos distrações." active={store.activeProfiles.includes('adhd')} onClick={() => store.toggleProfile('adhd')} />
                        <ProfileCard icon={ShieldCheck} title="Epilepsia / sensibilidade" desc="Bloqueia animações e reduz movimento na página." active={store.activeProfiles.includes('epilepsy')} onClick={() => store.toggleProfile('epilepsy')} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between">
            <button onClick={store.resetAll} aria-label="Redefinir todas as configurações" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[13px] uppercase tracking-widest rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors w-full">
              <RotateCcw size={15} aria-hidden="true" /> Redefinir tudo
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
