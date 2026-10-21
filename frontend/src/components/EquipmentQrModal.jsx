import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import Modal from './Modal'

export default function EquipmentQrModal({ open, onClose, equipment }) {
  const canvasRef = useRef(null)
  const [dataUrl, setDataUrl] = useState(null)
  const [error, setError] = useState(null)

  const equipmentUrl = equipment
    ? `${window.location.origin}/equipos/${equipment.id}`
    : ''

  useEffect(() => {
    if (!open || !equipment || !canvasRef.current) return

    setError(null)
    QRCode.toCanvas(canvasRef.current, equipmentUrl, { width: 220, margin: 1 })
      .then(() => QRCode.toDataURL(equipmentUrl, { width: 480, margin: 2 }))
      .then(setDataUrl)
      .catch(() => setError('No se pudo generar el codigo QR.'))
  }, [open, equipment, equipmentUrl])

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=400,height=500')
    if (!printWindow || !dataUrl) return

    printWindow.document.write(`
      <html>
        <head><title>QR ${equipment?.code || ''}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:24px;">
          <img src="${dataUrl}" alt="QR ${equipment?.code}" style="width:260px;height:260px;" />
          <p style="font-size:16px;font-weight:600;margin-top:12px;">${equipment?.code || ''}</p>
          <p style="font-size:12px;color:#666;">${equipment?.model || ''}</p>
          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Modal open={open} onClose={onClose} title={equipment ? `QR — ${equipment.code}` : 'Codigo QR'} maxWidth="max-w-sm">
      {!equipment ? null : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-slate-500">
            Escanea este codigo para abrir el detalle de {equipment.code} directamente desde el celular.
          </p>

          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800">
              <canvas ref={canvasRef} />
            </div>
          )}

          <div className="flex w-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!dataUrl}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <i className="bx bx-printer text-base" />
              Imprimir
            </button>

            {dataUrl && (
              <a
                href={dataUrl}
                download={`qr-${equipment.code}.png`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <i className="bx bx-download text-base" />
                Descargar
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
