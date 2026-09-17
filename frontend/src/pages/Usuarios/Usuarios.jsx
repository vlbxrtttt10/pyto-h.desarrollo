import { useEffect, useState } from 'react'
import { usersApi } from '../../api/resources'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/Loader'
import UserWizard from '../../components/UserWizard'
import Notify, { Confirm } from '../../lib/notify'

export default function Usuarios() {
  const { user, hasModulePermission } = useAuth()
  const [users, setUsers] = useState(null)
  const [modules, setModules] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const canView = hasModulePermission('usuarios', 'can_view')
  const canCreate = hasModulePermission('usuarios', 'can_create')
  const canEdit = hasModulePermission('usuarios', 'can_edit')
  const canDelete = hasModulePermission('usuarios', 'can_delete')

  function load() {
    setLoadError(null)
    usersApi
      .list()
      .then((res) => setUsers(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los usuarios.'))
  }

  useEffect(() => {
    if (!canView) return
    load()
    usersApi.modules().then((res) => setModules(res.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditingUser(null)
    setWizardOpen(true)
  }

  function openEdit(target) {
    setEditingUser(target)
    setWizardOpen(true)
  }

  function handleDelete(target) {
    Confirm.show(
      'Eliminar usuario',
      `¿Estas seguro de eliminar a ${target.name}?`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await usersApi.remove(target.id)
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <i className="bx bx-lock-alt text-3xl text-slate-400" />
        <p className="mt-2 text-sm text-slate-500">No tienes permiso para ver este modulo.</p>
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
          <p className="mt-1 text-sm text-slate-500">Gestion de acceso y permisos por modulo.</p>
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

      {loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
          {loadError}
        </p>
      ) : !users ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Tipo</th>
                {(canEdit || canDelete) && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((target) => (
                <tr key={target.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 text-xs font-semibold text-white">
                        {target.name?.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{target.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{target.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {target.is_super_admin ? 'Administrador' : 'Usuario estandar'}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(target)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                          >
                            <i className="bx bx-edit text-sm" />
                            Editar
                          </button>
                        )}
                        {canDelete && target.id !== user.id && (
                          <button
                            onClick={() => handleDelete(target)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        modules={modules}
        onSaved={load}
        usersApi={usersApi}
        editingUser={editingUser}
      />
    </div>
  )
}
