import { useEffect, useState } from 'react'
import { haulRoutesApi } from '../api/resources'
import Loader from '../components/Loader'

const emptyForm = {
  name: '',
  origin: '',
  destination: '',
  distance_km: '',
  average_grade_percent: '',
  base_liters_per_ton_km: '0.022',
}

export default function HaulRoutes() {
  const [routes, setRoutes] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function load() {
    haulRoutesApi.list().then((res) => setRoutes(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await haulRoutesApi.create(form)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la ruta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta ruta?')) return
    await haulRoutesApi.remove(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-map-alt text-violet-400" />
          Rutas de acarreo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Rutas usadas por el motor de IA para calcular el consumo esperado.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-3 lg:grid-cols-6"
      >
        <input
          required
          placeholder="Nombre de la ruta"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          placeholder="Origen"
          value={form.origin}
          onChange={(e) => setForm({ ...form, origin: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          placeholder="Destino"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Distancia (km)"
          value={form.distance_km}
          onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Pendiente (%)"
          value={form.average_grade_percent}
          onChange={(e) => setForm({ ...form, average_grade_percent: e.target.value })}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <i className="bx bx-plus text-base" />
          {saving ? 'Guardando...' : 'Agregar ruta'}
        </button>
        {error && <p className="col-span-full text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>

      {!routes ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Origen → Destino</th>
                <th className="px-4 py-3">Distancia</th>
                <th className="px-4 py-3">Pendiente</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {routes.map((route) => (
                <tr key={route.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{route.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {route.origin} → {route.destination}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{Number(route.distance_km).toFixed(2)} km</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{Number(route.average_grade_percent).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(route.id)}
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
