'use client';

import { ArrowLeft, Award, Heart, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';

const RevealOnScroll = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const OzoneBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-[#FAFAFC] pointer-events-none">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes float1 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(150px, -100px) scale(1.05); }
        66% { transform: translate(-100px, 120px) scale(0.95); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(-150px, 150px) scale(1.05); }
      }
      @keyframes floatBadge {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
      }
    `}} />
    <div className="absolute top-[5%] left-[-10%] sm:left-[5%] opacity-70" style={{ animation: 'float1 25s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-64 h-64 bg-teal-300/60 rounded-full blur-[80px] absolute -left-20 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="w-56 h-56 bg-cyan-300/60 rounded-full blur-[80px] absolute top-20 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
      </div>
    </div>
    <div className="absolute top-[60%] right-[-10%] sm:right-[10%] opacity-60" style={{ animation: 'float2 30s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-72 h-72 bg-cyan-300/50 rounded-full blur-[90px] absolute -left-10 animate-[pulse_12s_ease-in-out_infinite_alternate]"></div>
        <div className="w-80 h-80 bg-teal-300/60 rounded-full blur-[100px] absolute -right-20 animate-[pulse_9s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
);

const conquistas = [
  { 
    id: 1, 
    fotos: [
      "/diretoria3.jpg", 
      "/diretoria2.jpg", 
      "/diretoria1.jpg",
      "/diretoria4.jpg",
      "/diretoria5.jpg"  
    ], 
    titulo: "Reconhecimento da Diretoria", 
    descricao: "Lado a lado com os fundadores e diretores da Ozonteck, colhendo os frutos de um trabalho construído com transparência." 
  },
  { 
    id: 2, 
    fotos: [
      "/argentina.jpg",
      "/argentina2.png", 
      "/argentina3.jpg", 
      "/argentina5.jpg", 
      "/argentina4.jpg", 
      "/argentina6.jpg"  
    ], 
    titulo: "Destinos Internacionais", 
    descricao: "O resultado de muita dedicação levou-o a conquistar a sua primeira viagem internacional com destino à Argentina, uma experiência inesquecível." 
  },
  { 
    id: 3, 
    fotos: [
      "/cruzeiro1.jpg", 
      "/cruzeiro5.jpg", 
      "/cruzeiro7.jpg",
      "/cruzeiro4.jpg", 
      "/cruzeiro2.jpg", 
      "/cruzeiro9.jpg",
      "/cruzeiro6.jpg", 
      "/cruzeiro8.jpg"  
    ], 
    titulo: "Cruzeiro de Sucesso", 
    descricao: "Reconhecimento a bordo de um cruzeiro exclusivo. Uma conquista marcante por ser a sua primeira vez em alto mar e por ter a alegria de proporcionar essa primeira experiência também ao seu filho." 
  },
  { 
    id: 4, 
    fotos: [
      "/lideranca.jpg", 
      "/lideranca2.jpg",
      "/lideranca0.jpg",
      "/lideranca1.jpg",
      "/lideranca3.jpg",
      "/lideranca6.jpg",
      "/lideranca7.jpg",
      "/lideranca4.jpg"
    ], 
    titulo: "Liderança pelo Brasil", 
    descricao: "Participação em eventos nacionais, levando sempre a sua alegria e partilhando muito conhecimento." 
  },
];

const GalleryCard = ({ item, delay }: { item: any, delay: number }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (item.fotos.length <= 1 || !isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % item.fotos.length);
    }, 2000); 
    return () => clearInterval(interval);
  }, [item.fotos.length, isHovered]);

  const handleInteraction = () => {
    if (item.fotos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % item.fotos.length);
  };

  return (
    <RevealOnScroll delay={delay} className="w-[75vw] sm:w-[280px] lg:w-full shrink-0 snap-center">
      <div 
        className="group bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-xl lg:rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 h-full flex flex-col cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleInteraction}
      >
        
        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
          <div className="w-full h-full relative transition-transform duration-700 group-hover:scale-105">
            {item.fotos.map((foto: string, i: number) => (
              <Image 
                key={i}
                src={foto} 
                alt={`${item.titulo} - Foto ${i + 1}`} 
                fill
                sizes="(max-width: 640px) 75vw, (max-width: 1024px) 280px, 300px"
                quality={90}
                className={`object-cover object-center transition-opacity duration-1000 ${i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              />
            ))}
          </div>

          {item.fotos.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
              {item.fotos.map((_: string, i: number) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === currentIndex ? 'w-3 bg-teal-500' : 'w-1.5 bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 lg:p-5 flex-1 flex flex-col justify-center">
          <h4 className="font-bold text-slate-900 text-xs lg:text-sm mb-1">{item.titulo}</h4>
          <p className="text-slate-500 text-[10px] lg:text-xs font-medium leading-relaxed">
            {item.descricao}
          </p>
        </div>
      </div>
    </RevealOnScroll>
  );
};

export default function SobreCliente() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  return (
    <main className="min-h-screen text-slate-900 selection:bg-teal-600 selection:text-white relative pb-20 overflow-x-hidden">
      <OzoneBackground />

      <div className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pt-10 sm:pt-14 relative z-10">
        
        <RevealOnScroll delay={100}>
          <Link href="/" className="inline-flex items-center text-xs lg:text-[13px] font-bold text-teal-700 bg-white hover:bg-teal-600 hover:text-white border border-teal-200/60 rounded-full px-5 py-2 lg:px-6 lg:py-2 mb-10 transition-all duration-300 shadow-sm hover:shadow-md">
            <ArrowLeft className="mr-2 w-3.5 h-3.5 lg:w-4 lg:h-4" /> VOLTAR AO CATÁLOGO
          </Link>
        </RevealOnScroll>

        <section className="mb-20 lg:mb-24 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center lg:items-start">
            
            <RevealOnScroll delay={200} className="w-full lg:flex-1 order-2 lg:order-1">
              <div className="mb-6 lg:mb-8 text-center lg:text-left">
                <div className="inline-block px-3 py-1 mb-4 sm:mb-5 rounded-full border border-teal-200/60 bg-teal-50/50 text-teal-700 text-[9px] sm:text-[10px] font-black tracking-widest uppercase backdrop-blur-md shadow-sm">
                  Distribuidor Autorizado
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">
                  Conheça <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500">Rogério André</span>
                </h1>
              </div>

              <div className="space-y-5 text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                <p>
                  A trajetória de Rogério no mercado de relacionamento começou como uma busca por renda extra para complementar seus horários de folga. Enfrentando os desafios de uma época sem internet e com comunicação limitada, ele construiu sua jornada com tanto esforço que o que era apenas um complemento transformou-se em sua principal profissão.
                </p>
                <p>
                  Sendo um apaixonado por esporte e por um estilo de vida ativo (como nadar na praia e pedalar), encontrou na Ozonteck o seu verdadeiro propósito: levar saúde e bem-estar às pessoas. O grande diferencial do seu atendimento alia os seus valores inegociáveis à consultoria humanizada. Rogério constrói relações baseadas na honestidade e transparência, nunca prometendo o que não pode cumprir, focando-se sempre na segurança e na indicação do protocolo exato para a verdadeira qualidade de vida de cada cliente.
                </p>
                <p>
                  Fora do trabalho, é um homem extrovertido que adora conversar, ouvir música, ver filmes e desfrutar do seu grande sonho realizado: viajar pelo mundo.
                </p>
                
                <div className="pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-slate-800 font-bold text-sm lg:text-[15px]">
                    <CheckCircle2 className="text-teal-500 shrink-0" size={20} />
                    <span>Transparência e compromisso inegociável com a palavra dada</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-800 font-bold text-sm lg:text-[15px]">
                    <Heart className="text-teal-500 shrink-0" size={20} />
                    <span>Atendimento focado na segurança e no bem-estar real do cliente</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-800 font-bold text-sm lg:text-[15px]">
                    <Award className="text-teal-500 shrink-0" size={20} />
                    <span>Reconhecido na empresa com diversas viagens pelo Brasil e exterior</span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={400} className="w-full max-w-sm lg:max-w-md xl:max-w-[450px] order-1 lg:order-2 lg:sticky lg:top-24">
              <div className="relative w-full aspect-[3/4] flex items-end justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-teal-100/40 to-transparent rounded-[3rem] -z-10 blur-xl"></div>
                <img 
                  src="/foto-pai-sem-fundo.png" 
                  alt="Rogério André - Distribuidor Ozonteck" 
                  className="w-full h-auto max-h-full object-contain object-bottom drop-shadow-[0_20px_40px_rgb(13,148,136,0.15)]"
                />
                
                <div 
                  className="absolute top-[5%] right-[-5%] sm:right-[-10%] lg:right-[-15%] z-20 flex justify-center items-center pointer-events-none"
                  style={{ animation: 'floatBadge 4.5s ease-in-out infinite' }}
                >
                  <img 
                    src="/jaspe.gif" 
                    alt="Nível Jaspe 3D" 
                    className="w-40 h-40 sm:w-48 sm:h-48 lg:w-[220px] lg:h-[220px] object-contain drop-shadow-[0_20px_40px_rgba(217,119,6,0.5)]"
                  />
                </div>
                
              </div>
            </RevealOnScroll>
            
          </div>
        </section>

        <section className="mb-20 lg:mb-24">
          <RevealOnScroll delay={200}>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">Trajetória e Reconhecimento</h2>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto text-sm lg:text-base">
                O compromisso com a saúde e o bem-estar dos clientes resultou em prêmios e reconhecimentos nacionais e internacionais pela diretoria da Ozonteck.
              </p>
            </div>
          </RevealOnScroll>

          <div className="relative w-screen -ml-5 sm:-ml-10 lg:w-full lg:ml-0 px-5 sm:px-10 lg:px-0">
            <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 sm:gap-5 xl:gap-6 pb-6 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {conquistas.map((item, index) => (
                <GalleryCard key={item.id} item={item} delay={300 + (index * 100)} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <RevealOnScroll delay={300}>
            <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[1.5rem] lg:rounded-[2rem] p-6 sm:p-10 lg:p-12 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-start relative z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center relative">
                  <img 
                    src="/foto-lucas.jpg" 
                    alt="Lucas André - Desenvolvedor" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center md:text-left space-y-3 lg:space-y-4 w-full">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-teal-600 font-bold text-xs lg:text-[13px] tracking-widest uppercase mb-1">
                    <Heart size={14} className="animate-pulse" />
                    <span>A Tecnologia por trás do atendimento</span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
                    O projeto de um filho para um pai.
                  </h3>
                  
                  <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] font-medium leading-relaxed">
                Esta plataforma de e-commerce foi desenvolvida e arquitetada por <strong>Lucas André</strong>, Desenvolvedor de Software e filho de Rogério. 
                A ideia nasceu de um propósito claro: usar a tecnologia para modernizar, automatizar e escalar o excelente trabalho de consultoria e vendas que Rogério já fazia presencialmente. 
                <br/><br/>
                Mais do que código, esta loja virtual é a união da experiência de mercado de uma geração com a inovação digital da outra, garantindo que você tenha a melhor experiência de compra e atendimento possível.
                  </p>

                  <div className="pt-4 flex justify-center md:justify-start">
                    <a 
                      href="https://linktr.ee/Lucas_andre490" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs lg:text-sm font-bold text-slate-700 bg-slate-100/80 hover:bg-teal-600 hover:text-white border border-slate-200 hover:border-teal-600 px-5 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      Conecte-se comigo <ExternalLink size={16} />
                    </a>
                  </div>

                </div>
              </div>
            </div>
          </RevealOnScroll>
        </section>

      </div>
    </main>
  );
}