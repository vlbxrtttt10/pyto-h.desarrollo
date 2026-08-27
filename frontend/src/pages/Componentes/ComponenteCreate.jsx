import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { componentsApi } from '../../api/resources'
import Notify from '../../lib/notify'

const emptyForm = {
  name: '',
  equipment_type: 'ULM',
  expected_pressure_psi: '',
  expected_volume_liters: '',
  expected_cycle_minutes: '',
}

export default function ComponenteCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await componentsApi.create(form)
      Notify.success('Componente agregado correctamente')
      navigate('/componentes')
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el componente.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-plus text-violet-400" />
          Nuevo componente
        </h1>
        <p className="mt-1 text-sm text-slate-500">Estos valores son la referencia que usa el motor para detectar desviaciones.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Nombre</label>
            <input
              required
              autoFocus
              placeholder="Bomba Zeus"
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

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Presion esperada (PSI)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.expected_pressure_psi}
              onChange={(e) => setForm({ ...form, expected_pressure_psi: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Volumen esperado (L)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.expected_volume_liters}
              onChange={(e) => setForm({ ...form, expected_volume_liters: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Ciclo esperado (min)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.expected_cycle_minutes}
              onChange={(e) => setForm({ ...form, expected_cycle_minutes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/componentes')}
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
            {saving ? 'Guardando...' : 'Agregar componente'}
          </button>
        </div>
      </form>
    </div>
  )
}
