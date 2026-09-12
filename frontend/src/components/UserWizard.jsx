import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from './Modal'
import Notify from '../lib/notify'

const MODULE_ICONS = {
  equipos: 'bx-wrench',
  componentes: 'bx-cog',
  lecturas: 'bx-broadcast',
  anomalias: 'bx-error-alt',
  alertas_mantenimiento: 'bx-bell',
  usuarios: 'bx-user',
}

const ACTIONS = [
  { key: 'can_view', label: 'Ver', icon: 'bx-show', description: 'Puede ver la informacion' },
  { key: 'can_create', label: 'Crear', icon: 'bx-plus', description: 'Puede crear nuevos registros' },
  { key: 'can_edit', label: 'Editar', icon: 'bx-edit', description: 'Puede editar registros existentes' },
  { key: 'can_delete', label: 'Eliminar', icon: 'bx-trash', description: 'Puede eliminar registros' },
]

function emptyPermissions(modules) {
  const matrix = {}
  Object.keys(modules).forEach((module) => {
    matrix[module] = { can_view: false, can_create: false, can_edit: false, can_delete: false }
  })
  return matrix
}

function countActive(permissions) {
  return ACTIONS.filter((a) => permissions?.[a.key]).length
}

function summarizeActive(permissions) {
  const active = ACTIONS.filter((a) => permissions?.[a.key])
  if (active.length === 0) return 'Sin permisos'
  return active.map((a) => a.label).join(' · ')
}

function permissionsFromUser(editingUser, modules) {
  const matrix = emptyPermissions(modules)
  editingUser?.module_permissions?.forEach((p) => {
    if (matrix[p.module]) {
      matrix[p.module] = {
        can_view: Boolean(p.can_view),
        can_create: Boolean(p.can_create),
        can_edit: Boolean(p.can_edit),
        can_delete: Boolean(p.can_delete),
      }
    }
  })
  return matrix
}

export default function UserWizard({ open, onClose, modules, onSaved, usersApi, editingUser = null }) {
  const isEditing = Boolean(editingUser)
  const [step, setStep] = useState('form') // 'form' | 'permissions' | 'detail'
  const [activeModule, setActiveModule] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    is_super_admin: false,
    permissions: {},
  })

  useEffect(() => {
    if (!open) return
    setStep('form')
    setActiveModule(null)
    setError(null)
    setForm({
      name: editingUser?.name || '',
      email: editingUser?.email || '',
      password: '',
      is_super_admin: editingUser?.is_super_admin || false,
      permissions: modules ? permissionsFromUser(editingUser, modules) : {},
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingUser])

  function goToPermissions(e) {
    e.preventDefault()
    if (!form.name || !form.email || (!isEditing && !form.password)) return
    setStep('permissions')
  }

  function openModuleDetail(moduleKey) {
    setActiveModule(moduleKey)
    setStep('detail')
  }

  function toggleAction(moduleKey, actionKey, checked) {
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [moduleKey]: { ...f.permissions[moduleKey], [actionKey]: checked },
      },
    }))
  }

  const totalModules = modules ? Object.keys(modules).length : 0
  const totalPossible = totalModules * ACTIONS.length
  const totalAssigned = modules
    ? Object.keys(modules).reduce((sum, m) => sum + countActive(form.permissions[m]), 0)
    : 0
  const progressPercent = totalPossible ? Math.round((totalAssigned / totalPossible) * 100) : 0

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form }
      if (isEditing && !payload.password) {
        delete payload.password
      }

      if (isEditing) {
        await usersApi.update(editingUser.id, payload)
        Notify.success('Usuario actualizado correctamente')
      } else {
        await usersApi.create(payload)
        Notify.success('Usuario creado correctamente')
      }

      onSaved()
      onClose()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el usuario.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  const title =
    step === 'detail' && activeModule
      ? modules[activeModule]
      : isEditing
        ? 'Editar usuario'
        : 'Nuevo usuario'

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-xl">
      {step !== 'detail' && (
        <div className="mb-5 flex items-center gap-3 text-sm">
          <StepPill index={1} label="Datos del usuario" active={step === 'form'} done={step === 'permissions'} />
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <StepPill index={2} label="Permisos" active={step === 'permissions'} done={false} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={goToPermissions}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Nombre completo</label>
              <input
                required
                autoFocus
                placeholder="Nombre completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Correo electronico</label>
              <input
                required
                type="email"
                placeholder="correo@aleri.mining"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Contrasena {isEditing && <span className="text-slate-400">(dejar en blanco para no cambiarla)</span>}
              </label>
              <input
                required={!isEditing}
                type="password"
                minLength={8}
                placeholder={isEditing ? 'Nueva contrasena (opcional)' : 'Minimo 8 caracteres'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Tipo de usuario</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_super_admin: false })}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${
                    !form.is_super_admin
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <i className="bx bx-user mb-2 block text-xl text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Usuario estandar</p>
                  <p className="mt-0.5 text-xs text-slate-500">Tiene acceso limitado segun los permisos asignados.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_super_admin: true })}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${
                    form.is_super_admin
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <i className="bx bxs-crown mb-2 block text-xl text-violet-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Administrador</p>
                  <p className="mt-0.5 text-xs text-slate-500">Acceso completo a todos los modulos y acciones.</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Continuar
                <i className="bx bx-right-arrow-alt text-base" />
              </button>
            </div>
          </motion.form>
        )}

        {step === 'permissions' && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {form.is_super_admin ? (
              <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-700 dark:border-violet-800 dark:bg-violet-500/10 dark:text-violet-300">
                <i className="bx bxs-crown text-base" />
                Este usuario es Administrador: tiene acceso completo a todos los modulos.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-700 dark:border-violet-800 dark:bg-violet-500/10 dark:text-violet-300">
                <i className="bx bx-info-circle text-base" />
                Define que puede hacer este usuario en cada modulo del sistema.
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Modulos del sistema</p>
              <div
                className={`divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800 ${form.is_super_admin ? 'pointer-events-none opacity-50' : ''}`}
              >
                {modules &&
                  Object.entries(modules).map(([moduleKey, moduleLabel]) => {
                    const active = countActive(form.permissions[moduleKey])
                    return (
                      <button
                        key={moduleKey}
                        type="button"
                        onClick={() => openModuleDetail(moduleKey)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <i className={`bx ${MODULE_ICONS[moduleKey] || 'bx-square'} text-base`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{moduleLabel}</p>
                          <p className="truncate text-xs text-slate-500">{summarizeActive(form.permissions[moduleKey])}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${active > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {active}/4
                        </span>
                        <i className="bx bx-chevron-right shrink-0 text-slate-400" />
                      </button>
                    )
                  })}
              </div>
            </div>

            {!form.is_super_admin && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <i className="bx bx-check-circle text-brand-600 dark:text-brand-400" />
                    {totalAssigned} de {totalPossible} permisos asignados
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{progressPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <i className="bx bx-left-arrow-alt text-base" />
                Atras
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                <i className={`bx ${isEditing ? 'bx-save' : 'bx-user-plus'} text-base`} />
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'detail' && activeModule && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={() => setStep('permissions')}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <i className="bx bx-left-arrow-alt text-sm" />
              Volver a modulos
            </button>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <i className={`bx ${MODULE_ICONS[activeModule] || 'bx-square'} text-lg`} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{modules[activeModule]}</p>
                <p className="text-xs text-slate-500">Selecciona las acciones que puede realizar el usuario en este modulo.</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Acciones disponibles</p>
              <div className="space-y-2">
                {ACTIONS.map((action) => {
                  const checked = Boolean(form.permissions[activeModule]?.[action.key])
                  return (
                    <label
                      key={action.key}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        checked
                          ? 'border-brand-300 bg-brand-50 dark:border-brand-700/50 dark:bg-brand-500/10'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleAction(activeModule, action.key, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600 dark:border-slate-600"
                      />
                      <i
                        className={`bx ${action.icon} text-base ${checked ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{action.label}</p>
                        <p className="text-xs text-slate-500">{action.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('permissions')}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Guardar cambios
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

function StepPill({ index, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
          done
            ? 'bg-brand-500 text-white'
            : active
              ? 'bg-violet-600 text-white'
              : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {done ? <i className="bx bx-check text-sm" /> : index}
      </span>
      <span
        className={`font-medium ${active || done ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}
      >
        {label}
      </span>
    </div>
  )
}
