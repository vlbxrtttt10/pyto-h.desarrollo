import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { equipmentsApi } from '../../api/resources'
import Notify from '../../lib/notify'

const emptyForm = {
  type: 'ULM',
  model: '',
  client: '',
  site: '',
  criticality: 'media',
  install_date: '',
  status: 'operativo',
}

export default function EquipoCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await equipmentsApi.create(form)
      Notify.success('Equipo agregado correctamente')
      navigate('/equipos')
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el equipo.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-plus text-violet-400" />
          Nuevo equipo
        </h1>
        <p className="mt-1 text-sm text-slate-500">El codigo se asigna automaticamente segun el tipo de equipo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ULM">ULM — Camion lubricador</option>
              <option value="ULP">ULP — Camioneta lubricadora</option>
              <option value="UMO">UMO — Unidad movil hidraulica</option>
              <option value="ULE">ULE — Estacion de lubricacion</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Modelo</label>
            <input
              required
              autoFocus
              placeholder="Sampa120"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Cliente</label>
            <input
              required
              placeholder="Antamina"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Sitio</label>
            <input
              placeholder="Tajo Norte"
              value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Criticidad</label>
            <select
              value={form.criticality}
              onChange={(e) => setForm({ ...form, criticality: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Fecha de instalacion</label>
            <input
              type="date"
              value={form.install_date}
              onChange={(e) => setForm({ ...form, install_date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="operativo">Operativo</option>
              <option value="en_falla">En falla</option>
              <option value="en_mantenimiento">En mantenimiento</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/equipos')}
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
            {saving ? 'Guardando...' : 'Agregar equipo'}
          </button>
        </div>
      </form>
    </div>
  )
}
