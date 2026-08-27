import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { techniciansApi } from '../../api/resources'
import Loader from '../../components/Loader'
import Modal from '../../components/Modal'
import Notify, { Confirm } from '../../lib/notify'

const emptyForm = { employee_code: '', name: '', specialty: 'Hidraulica', hired_at: '' }

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  function load() {
    setLoadError(null)
    techniciansApi
      .list()
      .then((res) => setTecnicos(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los tecnicos.'))
  }

  useEffect(() => {
    load()
  }, [])

  function openEdit(tecnico) {
    setEditingId(tecnico.id)
    setForm({
      employee_code: tecnico.employee_code,
      name: tecnico.name,
      specialty: tecnico.specialty || 'Hidraulica',
      hired_at: tecnico.hired_at ? tecnico.hired_at.slice(0, 10) : '',
    })
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await techniciansApi.update(editingId, form)
      Notify.success('Tecnico actualizado correctamente')
      setModalOpen(false)
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo actualizar el tecnico.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(tecnico) {
    Confirm.show(
      'Eliminar tecnico',
      `¿Estas seguro de eliminar a ${tecnico.name}?`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await techniciansApi.remove(tecnico.id)
          Notify.success('Tecnico eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el tecnico.')
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
            <i className="bx bx-id-card text-violet-400" />
            Tecnicos
          </h1>
          <p className="mt-1 text-sm text-slate-500">Personal tecnico que realiza las visitas de servicio en campo.</p>
        </div>

        <Link
          to="/tecnicos/crear"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nuevo tecnico
        </Link>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
          {loadError}
        </p>
      ) : !tecnicos ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Especialidad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tecnicos.map((tecnico) => (
                <tr key={tecnico.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{tecnico.employee_code}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <Link to={`/tecnicos/${tecnico.id}`} className="hover:text-violet-600 dark:hover:text-violet-400">
                      {tecnico.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tecnico.specialty || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(tecnico)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                      >
                        <i className="bx bx-edit text-sm" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tecnico)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar tecnico">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Codigo de empleado</label>
            <input
              required
              autoFocus
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
              <i className="bx bx-save text-base" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
