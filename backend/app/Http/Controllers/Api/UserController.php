<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModulePermission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function modules()
    {
        return response()->json(ModulePermission::MODULES);
    }

    public function index(Request $request)
    {
        $this->authorizeModule($request, 'usuarios', 'view');

        return response()->json(User::with('modulePermissions')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $this->authorizeModule($request, 'usuarios', 'create');

        $validated = $this->validatePayload($request);
        $validated['payload']['password'] = bcrypt($validated['payload']['password']);

        $user = User::create($validated['payload']);
        $this->syncPermissions($user, $validated['permissions']);

        return response()->json($user->load('modulePermissions'), 201);
    }

    public function show(Request $request, User $user)
    {
        $this->authorizeModule($request, 'usuarios', 'view');

        return response()->json($user->load('modulePermissions'));
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeModule($request, 'usuarios', 'edit');

        $validated = $this->validatePayload($request, $user);

        if (! empty($validated['payload']['password'])) {
            $validated['payload']['password'] = bcrypt($validated['payload']['password']);
        } else {
            unset($validated['payload']['password']);
        }

        // Evita que el ultimo super admin se quite a si mismo el permiso,
        // dejando el sistema sin nadie con acceso total.
        if ($user->is_super_admin && array_key_exists('is_super_admin', $validated['payload']) && ! $validated['payload']['is_super_admin']) {
            $remainingSuperAdmins = User::where('is_super_admin', true)->where('id', '!=', $user->id)->count();
            if ($remainingSuperAdmins === 0) {
                return response()->json([
                    'message' => 'No se puede quitar el ultimo administrador total del sistema.',
                ], 422);
            }
        }

        $user->update($validated['payload']);

        if ($validated['permissions'] !== null) {
            $this->syncPermissions($user, $validated['permissions']);
        }

        return response()->json($user->fresh('modulePermissions'));
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeModule($request, 'usuarios', 'delete');

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta.',
            ], 422);
        }

        if ($user->is_super_admin) {
            $remainingSuperAdmins = User::where('is_super_admin', true)->where('id', '!=', $user->id)->count();
            if ($remainingSuperAdmins === 0) {
                return response()->json([
                    'message' => 'No se puede eliminar el ultimo administrador total del sistema.',
                ], 422);
            }
        }

        $user->delete();

        return response()->json(null, 204);
    }

    private function authorizeModule(Request $request, string $module, string $action): void
    {
        abort_unless($request->user()->hasModulePermission($module, $action), 403, 'No tienes permiso para realizar esta accion.');
    }

    /**
     * Sincroniza la matriz de permisos por modulo del usuario. Si es "admin
     * total", se le otorgan los 4 permisos en todos los modulos conocidos,
     * ignorando la matriz enviada (asi la UI y la API quedan consistentes).
     */
    private function syncPermissions(User $user, array $permissions): void
    {
        if ($user->is_super_admin) {
            foreach (array_keys(ModulePermission::MODULES) as $module) {
                ModulePermission::updateOrCreate(
                    ['user_id' => $user->id, 'module' => $module],
                    ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true]
                );
            }

            return;
        }

        foreach ($permissions as $module => $actions) {
            if (! array_key_exists($module, ModulePermission::MODULES)) {
                continue;
            }

            ModulePermission::updateOrCreate(
                ['user_id' => $user->id, 'module' => $module],
                [
                    'can_view' => (bool) ($actions['can_view'] ?? false),
                    'can_create' => (bool) ($actions['can_create'] ?? false),
                    'can_edit' => (bool) ($actions['can_edit'] ?? false),
                    'can_delete' => (bool) ($actions['can_delete'] ?? false),
                ]
            );
        }
    }

    private function validatePayload(Request $request, ?User $user = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user?->id)],
            'is_super_admin' => ['sometimes', 'boolean'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*.can_view' => ['sometimes', 'boolean'],
            'permissions.*.can_create' => ['sometimes', 'boolean'],
            'permissions.*.can_edit' => ['sometimes', 'boolean'],
            'permissions.*.can_delete' => ['sometimes', 'boolean'],
        ];

        $rules['password'] = $user
            ? ['nullable', 'string', 'min:8']
            : ['required', 'string', 'min:8'];

        $validated = $request->validate($rules);

        return [
            'payload' => [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'] ?? null,
                'is_super_admin' => $validated['is_super_admin'] ?? false,
            ],
            'permissions' => $validated['permissions'] ?? ($user ? null : []),
        ];
    }
}
