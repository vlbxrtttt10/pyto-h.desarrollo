import { useEffect, useState } from 'react'
import { operatorsApi } from '../api/resources'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import Notify, { Confirm } from '../lib/notify'

const emptyForm = { employee_code: '', name: '', shift: 'Dia' }

export default function Operators() {
  const [operators, setOperators] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  function load() {
    operatorsApi.list().then((res) => setOperators(res.data))
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
      await operatorsApi.create(form)
      setModalOpen(false)
      Notify.success('Operador agregado correctamente')
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el operador.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(operator) {
    Confirm.show(
      'Eliminar operador',
      `¿Estas seguro de eliminar a ${operator.name}? Se eliminaran tambien sus viajes registrados.`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await operatorsApi.remove(operator.id)
          Notify.success('Operador eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el operador.')
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
            Operadores
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gestion del catalogo de operadores de camiones.</p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nuevo operador
        </button>
      </div>

      {!operators ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {operators.map((operator) => (
                <tr key={operator.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{operator.employee_code}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{operator.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{operator.shift}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(operator)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo operador">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Codigo</label>
            <input
              required
              autoFocus
              placeholder="OP-0099"
              value={form.employee_code}
              onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Nombre completo</label>
            <input
              required
              placeholder="Nombre completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Turno</label>
            <select
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Dia">Turno dia</option>
              <option value="Noche">Turno noche</option>
            </select>
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
              {saving ? 'Guardando...' : 'Agregar operador'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
