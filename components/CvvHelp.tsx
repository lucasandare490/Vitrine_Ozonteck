export default function CvvHelp() {
  return <details className="mx-4 mb-4 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
    <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-teal-600">Onde encontro o código de segurança (CVV)?</summary>
    <div className="mt-3 flex flex-wrap items-center gap-4">
      <div role="img" aria-label="Verso ilustrativo do cartão com o código 123 destacado" className="h-24 w-40 shrink-0 rounded-md border border-slate-400 bg-slate-100 pt-3">
        <div className="h-5 bg-slate-800" />
        <div className="mx-3 mt-2 flex h-6 justify-end bg-white"><span className="border-2 border-red-600 px-1 font-mono text-red-700">123</span></div>
      </div>
      <p className="max-w-sm">Na maioria dos cartões, são os três dígitos no verso, próximos à assinatura. Alguns cartões usam quatro dígitos na frente. O CVV não é a senha do cartão.</p>
    </div>
  </details>;
}
