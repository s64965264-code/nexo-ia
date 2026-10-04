import { ArrowDown, ArrowRight, BookOpen, Brain, Check, ChevronRight, CircleHelp, Mic2, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { Show } from '@clerk/react';

function Brand({ light = false }: { light?: boolean }) {
  return <span className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${light ? 'text-[#f6f1e4]' : 'text-[#193e40]'}`}>
    <span className="grid size-9 place-items-center rounded-xl bg-[#e88c70] text-[#193e40]"><Sparkles size={19} strokeWidth={2.5} /></span>
    <span className="display-font text-[21px]">nexo<span className="text-[#e8896d]">.</span>ia</span>
  </span>;
}

export default function HomePage() {
  return <main className="grain overflow-hidden bg-[#f7f4eb] text-[#193e40]">
    <header className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 md:px-10">
      <Link href="/" aria-label="Nexo IA, inicio" data-testid="link-brand"><Brand /></Link>
      <nav className="hidden items-center gap-8 text-sm font-semibold text-[#55706c] md:flex" aria-label="Navegación principal">
        <a href="#como-funciona" className="hover:text-[#193e40]" data-testid="link-how-it-works">Cómo funciona</a>
        <a href="#herramientas" className="hover:text-[#193e40]" data-testid="link-tools">Herramientas</a>
        <a href="#filosofia" className="hover:text-[#193e40]" data-testid="link-philosophy">Nuestra idea</a>
      </nav>
      <div className="flex items-center gap-3">
        <Show when="signed-out"><Link href="/sign-in" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#345553] hover:bg-[#e8e6dc] sm:inline-flex" data-testid="link-sign-in">Entrar</Link></Show>
        <Show when="signed-in"><Link href="/study" className="rounded-full bg-[#1e6660] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#174f4b]" data-testid="link-go-study">Ir a estudiar <ArrowRight className="ml-2" size={15} /></Link></Show>
        <Show when="signed-out"><Link href="/sign-up" className="rounded-full bg-[#1e6660] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#174f4b]" data-testid="link-start">Empezar <ArrowRight className="ml-2" size={15} /></Link></Show>
      </div>
    </header>

    <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-[1.03fr_.97fr] md:px-10 md:pb-32 md:pt-20">
      <div className="relative z-[1] reveal">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d7ded2] bg-[#eff0e7] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#43716a]"><span className="size-1.5 rounded-full bg-[#e8896d]" />Tu curiosidad merece mejores respuestas</div>
        <h1 className="display-font max-w-[660px] text-[clamp(3.25rem,8vw,6.6rem)] font-extrabold leading-[.98] tracking-[-.075em]">Entenderlo<br />cambia <span className="relative inline-block text-[#278176]">todo.<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 280 17" fill="none" aria-hidden="true"><path d="M4 11.8C74 2.1 197 1.6 275 8.2" stroke="#E88C70" strokeWidth="6" strokeLinecap="round" /></svg></span></h1>
        <p className="mt-8 max-w-[490px] text-[17px] leading-8 text-[#607572]">Una pregunta, una foto de tus apuntes o una idea a medio hacer. Nexo te ayuda a comprender de verdad, practicar y seguir avanzando.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Show when="signed-out"><Link href="/sign-up" className="group inline-flex items-center rounded-full bg-[#1e6660] px-6 py-4 font-bold text-[#fffdf5] shadow-[0_10px_25px_rgba(25,83,77,.17)] transition hover:-translate-y-0.5 hover:bg-[#174f4b]" data-testid="button-hero-start">Encuentra tu manera de aprender <ArrowRight size={17} className="ml-3 transition-transform group-hover:translate-x-1" /></Link></Show>
          <Show when="signed-in"><Link href="/study" className="group inline-flex items-center rounded-full bg-[#1e6660] px-6 py-4 font-bold text-[#fffdf5]" data-testid="button-hero-study">Volver a mi espacio <ArrowRight size={17} className="ml-3" /></Link></Show>
          <a href="#como-funciona" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-[#54716b]" data-testid="link-see-how">Descubre cómo <ArrowDown size={15} /></a>
        </div>
        <div className="mt-12 flex items-center gap-3 text-xs font-semibold text-[#77908b]"><span className="flex -space-x-2"><i className="size-7 rounded-full border-2 border-[#f7f4eb] bg-[#b8cec0]" /><i className="size-7 rounded-full border-2 border-[#f7f4eb] bg-[#edbaa4]" /><i className="size-7 rounded-full border-2 border-[#f7f4eb] bg-[#d8ca90]" /></span>Aprender a tu ritmo, sin respuestas enlatadas</div>
      </div>
      <div className="relative mx-auto w-full max-w-[510px] reveal [animation-delay:140ms]">
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-[#ead9b5]/50 blur-3xl" />
        <div className="paper-grid relative rotate-[1.6deg] rounded-[2rem] border border-[#d5dfd3] bg-[#ecf0e8] p-4 shadow-[0_35px_85px_rgba(39,76,67,.14)] md:p-6">
          <div className="absolute -left-7 top-[21%] z-10 grid size-[58px] place-items-center rounded-2xl bg-[#e88c70] text-[#183e40] shadow-lg"><Brain size={27} /></div>
          <div className="rounded-[1.5rem] border border-[#dce3d8] bg-[#fcfbf5] p-5 md:p-7">
            <div className="flex items-center justify-between border-b border-[#e8e9de] pb-4"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#dceae1] text-[#34736c]"><Sparkles size={16} /></span><span className="text-sm font-bold">Tu espacio de estudio</span></div><span className="rounded-full bg-[#eaf2e8] px-2.5 py-1 text-[10px] font-bold text-[#508172]">EN LÍNEA</span></div>
            <div className="mt-6 flex items-start gap-3"><span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-[#f5e3d9] text-[#a35c48]"><CircleHelp size={15} /></span><div className="rounded-2xl rounded-tl-sm bg-[#f0f0e7] px-4 py-3 text-sm leading-6 text-[#3d5955]">¿Por qué las estaciones son opuestas en cada hemisferio?</div></div>
            <div className="ml-9 mt-4 rounded-2xl rounded-tl-sm border border-[#dbe8dc] bg-[#eaf2e9] p-4 text-sm leading-6 text-[#365a54]"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#27776c]"><Sparkles size={14} />Vamos paso a paso</div>Piensa en la Tierra como una peonza inclinada. Mientras viaja alrededor del Sol, un hemisferio queda más orientado hacia él…<div className="mt-3 flex gap-2"><span className="rounded-lg bg-[#dbe9dc] px-2 py-1 text-[10px] font-bold text-[#47796e]">Una idea clara</span><span className="rounded-lg bg-[#f2dfd2] px-2 py-1 text-[10px] font-bold text-[#9b624e]">Con ejemplos</span></div></div>
            <div className="mt-6 rounded-xl border border-[#e2e4d8] bg-white/80 p-3 text-xs text-[#91a09a]">Pregunta lo que quieras… <span className="float-right rounded-lg bg-[#1e6660] p-1.5 text-white"><ArrowRight size={13} /></span></div>
          </div>
          <div className="absolute -bottom-5 right-7 rounded-2xl border border-[#e7dfcc] bg-[#fffaf0] px-4 py-3 shadow-lg"><div className="flex items-center gap-2 text-xs font-bold text-[#456c63]"><Check size={16} className="text-[#2c8578]" />Ahora sí lo entiendo</div></div>
        </div>
      </div>
    </section>

    <section className="border-y border-[#dfdfd3] bg-[#eeeee4]">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-8 md:grid-cols-[1fr_auto] md:items-center md:px-10">
        <p className="text-sm font-semibold text-[#607671]">Aprender no es memorizar más. Es encontrar el hilo que lo conecta todo.</p>
        <div className="flex flex-wrap gap-x-7 gap-y-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#84938b]"><span>Matemáticas</span><span>Ciencias</span><span>Historia</span><span>Idiomas</span><span>Lo que te intrigue</span></div>
      </div>
    </section>

    <section id="como-funciona" className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
      <div className="max-w-[610px]"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#d77d62]">Una conversación distinta</span><h2 className="display-font mt-4 text-4xl font-extrabold leading-tight tracking-[-.05em] md:text-6xl">No te da la respuesta.<br /><span className="text-[#278176]">Te lleva hasta ella.</span></h2></div>
      <div className="mt-14 grid gap-4 md:grid-cols-[1.15fr_.85fr]">
        <article className="relative overflow-hidden rounded-[2rem] bg-[#1e5652] p-8 text-[#f7f4eb] md:min-h-[350px] md:p-11">
          <span className="text-xs font-bold uppercase tracking-[.17em] text-[#a7cfc0]">01 · Comprende</span><h3 className="display-font mt-8 max-w-[410px] text-3xl font-bold leading-tight md:text-4xl">Explicaciones que se ajustan a ti.</h3><p className="mt-4 max-w-[390px] text-sm leading-7 text-[#c4d9cf]">Con ejemplos cotidianos, analogías y el detalle justo. Si algo no encaja, cambia el enfoque contigo.</p>
          <div className="absolute -bottom-16 -right-8 size-56 rounded-full border-[1px] border-[#79a99a]/40" /><div className="absolute -bottom-8 -right-1 size-40 rounded-full border-[1px] border-[#79a99a]/40" />
          <BookOpen className="absolute bottom-9 right-10 text-[#9bc2ae]" size={42} strokeWidth={1.2} />
        </article>
        <article className="rounded-[2rem] border border-[#d9e1d4] bg-[#e7eee5] p-8 md:p-10"><span className="text-xs font-bold uppercase tracking-[.17em] text-[#d77d62]">02 · Practica</span><h3 className="display-font mt-8 text-3xl font-bold leading-tight">Aprender también es intentarlo.</h3><p className="mt-4 text-sm leading-7 text-[#637a72]">Pasa de la explicación a los ejercicios, las tarjetas de memoria o un plan hecho para tu objetivo.</p><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#f8f5eb] px-3 py-2 text-xs font-bold text-[#42645e]">Mini quiz</span><span className="rounded-full bg-[#f8f5eb] px-3 py-2 text-xs font-bold text-[#42645e]">Tarjetas</span><span className="rounded-full bg-[#f8f5eb] px-3 py-2 text-xs font-bold text-[#42645e]">Plan de estudio</span></div></article>
        <article className="rounded-[2rem] border border-[#e4dcc8] bg-[#f2e9d7] p-8 md:p-10"><span className="text-xs font-bold uppercase tracking-[.17em] text-[#a56e56]">03 · Explora</span><h3 className="display-font mt-7 text-2xl font-bold">Una foto, una voz, una pregunta.</h3><p className="mt-3 text-sm leading-7 text-[#786f60]">Comparte tus apuntes o conversa en voz alta. La curiosidad no tiene un formato único.</p><div className="mt-6 flex gap-3 text-[#9e6951]"><Mic2 size={20} /><Sparkles size={20} /><Brain size={20} /></div></article>
        <article id="herramientas" className="flex flex-col justify-between rounded-[2rem] bg-[#e58b6d] p-8 text-[#173e3f] md:p-10"><div><span className="text-xs font-bold uppercase tracking-[.17em]">A tu manera</span><h3 className="display-font mt-7 max-w-[360px] text-3xl font-extrabold leading-tight">Tu ritmo. Tu camino. Tu siguiente paso.</h3></div><div className="mt-8 flex items-end justify-between"><p className="max-w-[300px] text-sm leading-6 text-[#4f5450]">Nexo está para acompañar tu proceso, no para ponerle límites.</p><span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#f7f1e4]"><ChevronRight /></span></div></article>
      </div>
    </section>

    <section id="filosofia" className="relative overflow-hidden bg-[#dfe9df]">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 md:grid-cols-[.9fr_1.1fr] md:px-10 md:py-28">
        <div className="relative mx-auto grid size-[250px] place-items-center rounded-full border border-[#a9c4b5] md:size-[340px]"><div className="absolute inset-6 rounded-full border border-[#b9cfbf]" /><div className="absolute inset-12 rounded-full border border-[#b9cfbf]" /><div className="grid size-24 place-items-center rounded-[2rem] bg-[#e88c70] text-[#193e40] shadow-lg md:size-32"><Brain size={52} strokeWidth={1.2} /></div><span className="absolute right-4 top-9 text-[#44756b]"><Sparkles size={20} /></span><span className="absolute bottom-10 left-3 text-[#ce795e]"><BookOpen size={23} /></span></div>
        <div><span className="text-xs font-bold uppercase tracking-[.18em] text-[#d77d62]">La idea detrás de Nexo</span><h2 className="display-font mt-4 text-4xl font-extrabold leading-tight tracking-[-.05em] md:text-5xl">Cada persona aprende de una forma.<br /><span className="text-[#278176]">Empecemos por la tuya.</span></h2><p className="mt-6 max-w-[520px] text-base leading-8 text-[#5e7770]">La tecnología puede acercarnos al conocimiento, pero aprender sigue siendo algo profundamente personal. Nexo escucha tu pregunta, se adapta y convierte el «no lo entiendo» en un punto de partida.</p>
        <div className="mt-8 flex items-center gap-3 text-sm font-bold text-[#37685f]"><span className="grid size-8 place-items-center rounded-full bg-[#c7ddce]"><Check size={16} /></span>Sin juicios. Sin prisas. Con ganas de entender.</div></div>
      </div>
    </section>

    <section className="mx-auto max-w-[1240px] px-5 py-24 text-center md:px-10 md:py-32">
      <span className="text-xs font-bold uppercase tracking-[.18em] text-[#d77d62]">Tu próxima pregunta te espera</span>
      <h2 className="display-font mx-auto mt-5 max-w-[790px] text-5xl font-extrabold leading-[1.04] tracking-[-.065em] md:text-7xl">Lo difícil no es preguntar.<br /><span className="text-[#278176]">Es no preguntar.</span></h2>
      <p className="mx-auto mt-6 max-w-[500px] text-base leading-7 text-[#688078]">Empieza con eso que llevas un rato queriendo entender.</p>
      <Show when="signed-out"><Link href="/sign-up" className="mt-9 inline-flex items-center rounded-full bg-[#1e6660] px-7 py-4 font-bold text-white transition hover:bg-[#174f4b]" data-testid="button-final-start">Abrir mi espacio de estudio <ArrowRight size={17} className="ml-3" /></Link></Show>
      <Show when="signed-in"><Link href="/study" className="mt-9 inline-flex items-center rounded-full bg-[#1e6660] px-7 py-4 font-bold text-white" data-testid="button-final-study">Seguir aprendiendo <ArrowRight size={17} className="ml-3" /></Link></Show>
    </section>
    <footer className="border-t border-[#dfdfd3] bg-[#efede3]"><div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-7 text-xs font-semibold text-[#73847c] md:flex-row md:items-center md:justify-between md:px-10"><Brand /><span>Un lugar para entender, no solo para responder.</span><span>© 2025 Nexo IA</span></div></footer>
  </main>;
}