/**
 * Marca oficial de DipleBill. Los archivos viven en /public:
 *  - logo-mark.svg       → isotipo solo (D + símbolo de dólar)
 *  - logo-horizontal.svg → isotipo + wordmark (para fondos claros)
 * Para actualizar el logo basta reemplazar esos archivos.
 */

const MARK_RATIO = 324.58 / 351.77;

export function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-mark.svg"
      width={Math.round(size * MARK_RATIO)}
      height={size}
      alt=""
      className={className}
      draggable={false}
    />
  );
}

// Isotipo + wordmark en texto: el azul/morado del wordmark oficial se pierde
// sobre fondos oscuros, así que en dark se usan tonos claros equivalentes.
export function BrandLogo({ size = 36, className = '' }: { size?: number; className?: string }) {
  const fontSize = Math.round(size * 0.62);
  return (
    <span
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="DipleBill">
      <BrandMark size={size} />
      <span className="font-bold tracking-tight" style={{ fontSize }}>
        <span className="text-[#0859df] dark:text-[#8FB2F9]">Diple</span>
        <span className="text-[#9e51fa] dark:text-[#B39DF2]">Bill</span>
      </span>
    </span>
  );
}
