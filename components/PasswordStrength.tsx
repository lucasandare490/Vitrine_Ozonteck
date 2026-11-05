import { estimatePasswordStrength } from '@/lib/password-strength';

/** Informational only: never controls submission or password requirements. */
export default function PasswordStrength({ password, id }: { password: string; id: string }) {
  const estimate = estimatePasswordStrength(password);
  if (!estimate) return null;
  const tone = ['bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-teal-700'][estimate.level - 1];
  return <div id={id} className="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-600 dark:text-neutral-300">Força estimada da senha</span>
      <output aria-live="polite" className="font-semibold text-slate-800 dark:text-neutral-100">{estimate.label}</output>
    </div>
    <div aria-hidden="true" className="flex gap-1.5">{[1, 2, 3, 4].map(part => <span key={part} className={`h-1.5 flex-1 rounded-full transition-colors motion-reduce:transition-none ${part <= estimate.level ? tone : 'bg-slate-200 dark:bg-neutral-600'}`} />)}</div>
    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-neutral-400">Apenas uma orientação. Não é preciso atingir um nível para criar sua conta.</p>
  </div>;
}
