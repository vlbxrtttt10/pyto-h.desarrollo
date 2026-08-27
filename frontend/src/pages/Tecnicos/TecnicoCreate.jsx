import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { techniciansApi } from '../../api/resources'
import Notify from '../../lib/notify'

const emptyForm = { employee_code: '', name: '', specialty: 'Hidraulica', hired_at: '' }

export default function TecnicoCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await techniciansApi.create(form)
      Notify.success('Tecnico agregado correctamente')
      navigate('/tecnicos')
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el tecnico.'
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
          Nuevo tecnico
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Codigo de empleado</label>
          <input
            required
            autoFocus
            placeholder="TEC-0099"
            value={form.employee_code}
            onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Nombre completo</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Especialidad</label>
            <select
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Hidraulica">Hidraulica</option>
              <option value="Lubricacion">Lubricacion</option>
              <option value="Electromecanica">Electromecanica</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Fecha de ingreso</label>
            <input
              type="date"
              value={form.hired_at}
              onChange={(e) => setForm({ ...form, hired_at: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/tecnicos')}
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
            {saving ? 'Guardando...' : 'Agregar tecnico'}
          </button>
        </div>
      </form>
    </div>
  )
}
