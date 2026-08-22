import { useEffect, useState } from 'react'
import { trucksApi } from '../api/resources'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import Notify, { Confirm } from '../lib/notify'

const STATUS_LABELS = {
  active: 'Activo',
  maintenance: 'Mantenimiento',
  inactive: 'Inactivo',
}

const emptyForm = {
  model: '',
  tank_capacity_liters: '',
  empty_weight_tons: '',
  max_payload_tons: '',
  status: 'active',
}

function nextCode(trucks) {
  const lastNumber = trucks.reduce((max, truck) => {
    const match = /^CAM-(\d+)$/.exec(truck.code || '')
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `CAM-${String(lastNumber + 1).padStart(3, '0')}`
}

export default function Trucks() {
  const [trucks, setTrucks] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  function load() {
    trucksApi.list().then((res) => setTrucks(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  function openModal() {
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await trucksApi.create(form)
      setModalOpen(false)
      Notify.success('Camion agregado correctamente')
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el camion.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(truck) {
    Confirm.show(
      'Eliminar camion',
      `¿Estas seguro de eliminar ${truck.code}? Se eliminaran tambien sus viajes registrados.`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await trucksApi.remove(truck.id)
          Notify.success('Camion eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el camion.')
        }
      },
      () => {},
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-car text-violet-400" />
            Flota de camiones
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gestion del catalogo de camiones mineros.</p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nuevo camion
        </button>
      </div>

      {!trucks ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Tanque</th>
                <th className="px-4 py-3">Peso vacio</th>
                <th className="px-4 py-3">Carga max</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {trucks.map((truck) => (
                <tr key={truck.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{truck.code}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{truck.model}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{Number(truck.tank_capacity_liters).toFixed(0)} L</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{Number(truck.empty_weight_tons).toFixed(0)} t</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{Number(truck.max_payload_tons).toFixed(0)} t</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{STATUS_LABELS[truck.status]}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(truck)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                      <i className="bx bx-trash text-sm" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo camion">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Codigo</label>
              <input
                readOnly
                value={nextCode(trucks || [])}
                className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Modelo</label>
              <input
                required
                autoFocus
                placeholder="Caterpillar 797F"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Tanque (L)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.tank_capacity_liters}
                onChange={(e) => setForm({ ...form, tank_capacity_liters: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Peso vacio (t)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.empty_weight_tons}
                onChange={(e) => setForm({ ...form, empty_weight_tons: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Carga max (t)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.max_payload_tons}
                onChange={(e) => setForm({ ...form, max_payload_tons: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <i className="bx bx-plus text-base" />
              {saving ? 'Guardando...' : 'Agregar camion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
