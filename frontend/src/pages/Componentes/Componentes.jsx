import { useEffect, useState } from 'react'
import { componentsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import Modal from '../../components/Modal'
import Notify, { Confirm } from '../../lib/notify'

const emptyForm = {
  name: '',
  equipment_type: 'ULM',
  min_temperature_celsius: '',
  max_temperature_celsius: '',
  min_pressure_psi: '',
  max_pressure_psi: '',
  min_grease_level_percent: '',
}

export default function Componentes() {
  const [componentes, setComponentes] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const isEditing = editingId !== null

  function load() {
    setLoadError(null)
    componentsApi
      .list()
      .then((res) => setComponentes(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los componentes.'))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(componente) {
    setEditingId(componente.id)
    setForm({
      name: componente.name,
      equipment_type: componente.equipment_type,
      min_temperature_celsius: componente.min_temperature_celsius,
      max_temperature_celsius: componente.max_temperature_celsius,
      min_pressure_psi: componente.min_pressure_psi,
      max_pressure_psi: componente.max_pressure_psi,
      min_grease_level_percent: componente.min_grease_level_percent,
    })
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEditing) {
        await componentsApi.update(editingId, form)
        Notify.success('Componente actualizado correctamente')
      } else {
        await componentsApi.create(form)
        Notify.success('Componente agregado correctamente')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el componente.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(componente) {
    Confirm.show(
      'Eliminar componente',
      `¿Estas seguro de eliminar ${componente.name}?`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await componentsApi.remove(componente.id)
          Notify.success('Componente eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el componente.')
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
            <i className="bx bx-cog text-violet-400" />
            Componentes
          </h1>
          <p className="mt-1 text-sm text-slate-500">Rangos normales de operacion usados por el motor de deteccion de fallas.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nuevo componente
        </button>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
          {loadError}
        </p>
      ) : !componentes ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo de equipo</th>
                <th className="px-4 py-3">Temperatura normal</th>
                <th className="px-4 py-3">Presion normal</th>
                <th className="px-4 py-3">Grasa minima</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {componentes.map((componente) => (
                <tr key={componente.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{componente.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{componente.equipment_type}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {Number(componente.min_temperature_celsius).toFixed(0)}°C – {Number(componente.max_temperature_celsius).toFixed(0)}°C
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {Number(componente.min_pressure_psi).toFixed(0)} – {Number(componente.max_pressure_psi).toFixed(0)} PSI
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{Number(componente.min_grease_level_percent).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(componente)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                      >
                        <i className="bx bx-edit text-sm" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(componente)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        <i className="bx bx-trash text-sm" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Editar componente' : 'Nuevo componente'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Nombre</label>
              <input
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Tipo de equipo</label>
              <select
                value={form.equipment_type}
                onChange={(e) => setForm({ ...form, equipment_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="ULM">ULM</option>
                <option value="ULP">ULP</option>
                <option value="UMO">UMO</option>
                <option value="ULE">ULE</option>
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Rango normal de temperatura</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Minima (°C)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.min_temperature_celsius}
                  onChange={(e) => setForm({ ...form, min_temperature_celsius: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Maxima (°C)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.max_temperature_celsius}
                  onChange={(e) => setForm({ ...form, max_temperature_celsius: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Rango normal de presion</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Minima (PSI)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_pressure_psi}
                  onChange={(e) => setForm({ ...form, min_pressure_psi: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Maxima (PSI)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.max_pressure_psi}
                  onChange={(e) => setForm({ ...form, max_pressure_psi: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Nivel minimo de grasa (%)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.min_grease_level_percent}
              onChange={(e) => setForm({ ...form, min_grease_level_percent: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
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
              <i className={`bx ${isEditing ? 'bx-save' : 'bx-plus'} text-base`} />
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar componente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
