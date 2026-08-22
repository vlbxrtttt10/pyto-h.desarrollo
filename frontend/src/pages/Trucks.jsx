import { useEffect, useState } from 'react'
import { trucksApi } from '../api/resources'
import Loader from '../components/Loader'

const STATUS_LABELS = {
  active: 'Activo',
  maintenance: 'Mantenimiento',
  inactive: 'Inactivo',
}

const emptyForm = {
  code: '',
  model: '',
  tank_capacity_liters: '',
  empty_weight_tons: '',
  max_payload_tons: '',
  status: 'active',
}

export default function Trucks() {
  const [trucks, setTrucks] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function load() {
    trucksApi.list().then((res) => setTrucks(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await trucksApi.create(form)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el camion.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este camion? Se eliminaran tambien sus viajes registrados.')) return
    await trucksApi.remove(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-car text-violet-400" />
          Flota de camiones
        </h1>
        <p className="mt-1 text-sm text-slate-500">Gestion del catalogo de camiones mineros.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-3 lg:grid-cols-6"
      >
        <input
          required
          placeholder="Codigo (CAM-009)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          placeholder="Modelo"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Tanque (L)"
          value={form.tank_capacity_liters}
          onChange={(e) => setForm({ ...form, tank_capacity_liters: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Peso vacio (t)"
          value={form.empty_weight_tons}
          onChange={(e) => setForm({ ...form, empty_weight_tons: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Carga max (t)"
          value={form.max_payload_tons}
          onChange={(e) => setForm({ ...form, max_payload_tons: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <i className="bx bx-plus text-base" />
          {saving ? 'Guardando...' : 'Agregar camion'}
        </button>
        {error && <p className="col-span-full text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>

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
                      onClick={() => handleDelete(truck.id)}
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
