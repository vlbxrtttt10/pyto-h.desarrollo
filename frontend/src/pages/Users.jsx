import { useEffect, useState } from 'react'
import { usersApi } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import UserWizard from '../components/UserWizard'
import Notify, { Confirm } from '../lib/notify'

function hasModulePermission(user, module, action) {
  if (!user) return false
  if (user.is_super_admin) return true
  const permission = user.module_permissions?.find((p) => p.module === module)
  return Boolean(permission?.[action])
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(null)
  const [modules, setModules] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const canView = hasModulePermission(currentUser, 'usuarios', 'can_view')
  const canCreate = hasModulePermission(currentUser, 'usuarios', 'can_create')
  const canEdit = hasModulePermission(currentUser, 'usuarios', 'can_edit')
  const canDelete = hasModulePermission(currentUser, 'usuarios', 'can_delete')
  const hasActionsColumn = canEdit || canDelete

  function load() {
    usersApi.list().then((res) => setUsers(res.data))
  }

  useEffect(() => {
    if (!canView) return
    usersApi.modules().then((res) => setModules(res.data))
    load()
  }, [canView])

  function openCreate() {
    setEditingUser(null)
    setModalOpen(true)
  }

  function openEdit(targetUser) {
    setEditingUser(targetUser)
    setModalOpen(true)
  }

  function handleDelete(targetUser) {
    Confirm.show(
      'Eliminar usuario',
      `¿Estas seguro de eliminar a ${targetUser.name}? Esta accion no se puede deshacer.`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await usersApi.remove(targetUser.id)
          Notify.success('Usuario eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el usuario.')
        }
      },
      () => {},
    )
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <i className="bx bx-lock-alt text-3xl text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">No tienes permiso para ver este modulo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-user text-violet-400" />
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion de usuarios y sus permisos por modulo del sistema.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <i className="bx bx-plus text-base" />
            Nuevo usuario
          </button>
        )}
      </div>

      {!users || !modules ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Permisos</th>
                {hasActionsColumn && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u) => {
                const totalAssigned = (u.module_permissions || []).reduce(
                  (sum, p) => sum + (p.can_view ? 1 : 0) + (p.can_create ? 1 : 0) + (p.can_edit ? 1 : 0) + (p.can_delete ? 1 : 0),
                  0,
                )
                const totalPossible = Object.keys(modules).length * 4

                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-700">
                          <img src="/user.svg" alt="" className="h-full w-full object-cover" />
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.is_super_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                          <i className="bx bxs-crown text-xs" />
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Usuario estandar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_super_admin ? (
                        <span className="text-xs text-slate-500">{totalPossible} / {totalPossible}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{totalAssigned} / {totalPossible}</span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${totalPossible ? (totalAssigned / totalPossible) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    {hasActionsColumn && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(u)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              <i className="bx bx-edit text-sm" />
                              Editar
                            </button>
                          )}
                          {canDelete && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              <i className="bx bx-trash text-sm" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserWizard
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        modules={modules}
        usersApi={usersApi}
        onSaved={load}
        editingUser={editingUser}
      />
    </div>
  )
}
