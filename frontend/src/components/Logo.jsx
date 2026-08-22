/**
 * Renderiza el isotipo de Aleri (public/aleri.svg) como una mascara CSS,
 * de forma que el color/gradiente se controle desde aqui sin editar el SVG
 * fuente (que trae un fill solido negro fijo).
 */
export default function Logo({ className = '', gradient = false }) {
  const style = {
    WebkitMaskImage: 'url(/aleri.svg)',
    maskImage: 'url(/aleri.svg)',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }

  return (
    <span
      role="img"
      aria-label="Aleri"
      className={`inline-block ${gradient ? 'brand-gradient' : 'bg-current'} ${className}`}
      style={style}
    />
  )
}
