import { useEffect, useState } from 'react'
import { componentsApi, equipmentComponentsApi, equipmentsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import Modal from '../../components/Modal'
import { CauseBadge, SeverityBadge } from '../../components/Badge'
import Notify, { Confirm } from '../../lib/notify'

const STATUS_LABELS = {
  operativo: 'Operativo',
  en_falla: 'En falla',
  en_mantenimiento: 'En mantenimiento',
}

const RISK_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Critica' }

const CRITICALITY_STYLES = {
  alta: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  media: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  baja: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
}

const emptyForm = {
  type: 'ULM',
  model: '',
  client: '',
  site: '',
  criticality: 'media',
  install_date: '',
  status: 'operativo',
}

export default function Equipos() {
  const [equipos, setEquipos] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [showModalOpen, setShowModalOpen] = useState(false)
  const [showEquipo, setShowEquipo] = useState(null)
  const [showError, setShowError] = useState(null)

  const [catalogComponents, setCatalogComponents] = useState([])
  const [selectedComponentId, setSelectedComponentId] = useState('')
  const [installing, setInstalling] = useState(false)

  const isEditing = editingId !== null

  function load() {
    setLoadError(null)
    equipmentsApi
      .list()
      .then((res) => setEquipos(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los equipos.'))
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

  function openEdit(equipo) {
    setEditingId(equipo.id)
    setForm({
      type: equipo.type,
      model: equipo.model,
      client: equipo.client,
      site: equipo.site || '',
      criticality: equipo.criticality,
      install_date: equipo.install_date ? equipo.install_date.slice(0, 10) : '',
      status: equipo.status,
    })
    setError(null)
    setModalOpen(true)
  }

  function openShow(equipo) {
    setShowEquipo(null)
    setShowError(null)
    setSelectedComponentId('')
    setShowModalOpen(true)
    equipmentsApi
      .show(equipo.id)
      .then((res) => setShowEquipo(res.data))
      .catch((err) => setShowError(err.response?.data?.message || 'No se pudo cargar el equipo.'))
    if (catalogComponents.length === 0) {
      componentsApi
        .list()
        .then((res) => setCatalogComponents(res.data))
        .catch(() => {})
    }
  }

  function refreshShowEquipo() {
    if (!showEquipo) return
    equipmentsApi
      .show(showEquipo.id)
      .then((res) => setShowEquipo(res.data))
      .catch((err) => setShowError(err.response?.data?.message || 'No se pudo cargar el equipo.'))
  }

  async function handleInstallComponent(e) {
    e.preventDefault()
    if (!selectedComponentId || !showEquipo) return
    setInstalling(true)
    try {
      await equipmentComponentsApi.create(showEquipo.id, { component_id: selectedComponentId })
      Notify.success('Componente instalado en el equipo')
      setSelectedComponentId('')
      refreshShowEquipo()
    } catch (err) {
      Notify.failure(err.response?.data?.message || 'No se pudo instalar el componente.')
    } finally {
      setInstalling(false)
    }
  }

  function handleUninstallComponent(equipmentComponent) {
    Confirm.show(
      'Quitar componente',
      `¿Estas seguro de quitar ${equipmentComponent.component?.name} de este equipo? Se eliminaran tambien sus lecturas de sensor registradas.`,
      'Si, quitar',
      'Cancelar',
      async () => {
        try {
          await equipmentComponentsApi.remove(showEquipo.id, equipmentComponent.id)
          Notify.success('Componente retirado del equipo')
          refreshShowEquipo()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo quitar el componente.')
        }
      },
      () => {},
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEditing) {
        await equipmentsApi.update(editingId, form)
        Notify.success('Equipo actualizado correctamente')
      } else {
        await equipmentsApi.create(form)
        Notify.success('Equipo agregado correctamente')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el equipo.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(equipo) {
    Confirm.show(
      'Eliminar equipo',
      `¿Estas seguro de eliminar ${equipo.code}? Se eliminaran tambien sus lecturas de sensor registradas.`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await equipmentsApi.remove(equipo.id)
          Notify.success('Equipo eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el equipo.')
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
            <i className="bx bx-wrench text-violet-400" />
            Equipos
          </h1>
          <p className="mt-1 text-sm text-slate-500">Camiones lubricadores y unidades hidraulicas en campo.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nuevo equipo
        </button>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
          {loadError}
        </p>
      ) : !equipos ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Sitio</th>
                <th className="px-4 py-3">Criticidad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {equipos.map((equipo) => (
                <tr key={equipo.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={() => openShow(equipo)}
                      className="hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {equipo.code}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipo.model}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipo.client}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipo.site || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${CRITICALITY_STYLES[equipo.criticality]}`}>
                      {equipo.criticality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{STATUS_LABELS[equipo.status]}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openShow(equipo)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        <i className="bx bx-show text-sm" />
                        Ver
                      </button>
                      <button
                        onClick={() => openEdit(equipo)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                      >
                        <i className="bx bx-edit text-sm" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(equipo)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Editar equipo' : 'Nuevo equipo'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Sitio</label>
              <input
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
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar equipo'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showModalOpen} onClose={() => setShowModalOpen(false)} title={showEquipo ? showEquipo.code : 'Equipo'} maxWidth="max-w-4xl">
        {showError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-6 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
            {showError}
          </p>
        ) : !showEquipo ? (
          <Loader />
        ) : (
          <div className="space-y-5">
            <p className="-mt-2 text-sm text-slate-500">{showEquipo.model} · {showEquipo.client}</p>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Tipo</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{showEquipo.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Sitio</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{showEquipo.site || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Criticidad</p>
                <p className="mt-1 text-sm capitalize text-slate-800 dark:text-slate-200">{showEquipo.criticality}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Estado</p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{STATUS_LABELS[showEquipo.status]}</p>
              </div>
            </div>

            <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Componentes instalados</p>
              </div>

              {showEquipo.equipment_components?.length > 0 ? (
                <ul className="space-y-1.5">
                  {showEquipo.equipment_components.map((ec) => (
                    <li
                      key={ec.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/40"
                    >
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{ec.component?.name}</p>
                        <p className="text-xs text-slate-500">
                          {ec.installed_at ? `Instalado el ${new Date(ec.installed_at).toLocaleDateString()}` : 'Sin fecha de instalacion'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUninstallComponent(ec)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        <i className="bx bx-trash text-sm" />
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Este equipo aun no tiene componentes instalados.</p>
              )}

              <form onSubmit={handleInstallComponent} className="flex items-center gap-2 pt-1">
                <select
                  value={selectedComponentId}
                  onChange={(e) => setSelectedComponentId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Selecciona un componente del catalogo...</option>
                  {catalogComponents
                    .filter((c) => !showEquipo.equipment_components?.some((ec) => ec.component_id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.equipment_type})
                      </option>
                    ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedComponentId || installing}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  <i className="bx bx-plus text-base" />
                  Instalar
                </button>
              </form>
            </div>

            {showEquipo.maintenance_alerts?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alertas de mantenimiento</p>
                {showEquipo.maintenance_alerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-rose-200 bg-rose-500/5 p-3 dark:border-rose-700/50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{alert.title}</p>
                      <span className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">{RISK_LABELS[alert.risk_level]}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Historial de lecturas de sensores</p>
              </div>
              <div className="scrollbar-thin max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5">Componente</th>
                      <th className="px-3 py-2.5">Temp.</th>
                      <th className="px-3 py-2.5">Presion</th>
                      <th className="px-3 py-2.5">Grasa</th>
                      <th className="px-3 py-2.5">Anomalia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {showEquipo.sensor_readings?.map((reading) => (
                      <tr key={reading.id}>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-slate-400">{new Date(reading.read_at).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-slate-400">{reading.equipment_component?.component?.name}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-slate-400">{reading.temperature_celsius}°C</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-slate-400">{reading.pressure_psi} PSI</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-slate-400">{reading.grease_level_percent}%</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {reading.equipment_anomalies?.[0] ? (
                            <div className="flex items-center gap-1">
                              <CauseBadge cause={reading.equipment_anomalies[0].cause} />
                              <SeverityBadge severity={reading.equipment_anomalies[0].severity} />
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
