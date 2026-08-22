import { useEffect, useState } from 'react'
import { operatorsApi } from '../api/resources'
import Loader from '../components/Loader'

const emptyForm = { employee_code: '', name: '', shift: 'Dia' }

export default function Operators() {
  const [operators, setOperators] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function load() {
    operatorsApi.list().then((res) => setOperators(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await operatorsApi.create(form)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el operador.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este operador? Se eliminaran tambien sus viajes registrados.')) return
    await operatorsApi.remove(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-id-card text-violet-400" />
          Operadores
        </h1>
        <p className="mt-1 text-sm text-slate-500">Gestion del catalogo de operadores de camiones.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-4"
      >
        <input
          required
          placeholder="Codigo (OP-0099)"
          value={form.employee_code}
          onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          placeholder="Nombre completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          value={form.shift}
          onChange={(e) => setForm({ ...form, shift: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="Dia">Turno dia</option>
          <option value="Noche">Turno noche</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <i className="bx bx-plus text-base" />
          {saving ? 'Guardando...' : 'Agregar operador'}
        </button>
        {error && <p className="col-span-full text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>

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
                      onClick={() => handleDelete(operator.id)}
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
    </div>
  )
}
