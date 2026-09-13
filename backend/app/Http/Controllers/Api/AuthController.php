<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Customer;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // POST /api/auth/register — customer self-registration from the landing page
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $customer = Customer::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'address' => $request->input('address'),
            'password' => Hash::make($request->input('password')),
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'role' => 'CUSTOMER',
            ],
        ], 201);
    }

    // POST /api/auth/login — shared login used by customer, staff and admin.
    // `role` in the request body tells us which table to check against,
    // same contract as the Node/Express version.
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'role' => 'required|in:CUSTOMER,STAFF,ADMIN',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $role = $request->input('role');

        $modelClass = match ($role) {
            'CUSTOMER' => Customer::class,
            'STAFF' => Staff::class,
            'ADMIN' => Admin::class,
        };

        $account = $modelClass::where('email', $request->input('email'))->first();

        if (! $account || ! Hash::check($request->input('password'), $account->password)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        $token = $account->createToken(strtolower($role).'-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $account->id,
                'name' => $account->name,
                'email' => $account->email,
                'role' => $role,
            ],
        ]);
    }

    // GET /api/auth/me — returns the logged-in user's basic profile
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->roleType === 'CUSTOMER' ? $user->address : null,
            'role' => $user->roleType,
        ]);
    }

    // PATCH /api/auth/me — update the logged-in user's own profile.
    // `address` only applies to customers; it's silently ignored for
    // staff/admin accounts since they don't have that column.
    public function updateMe(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:50',
            'address' => 'sometimes|nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $data = $request->only(['name', 'phone']);
        if ($user->roleType === 'CUSTOMER' && $request->has('address')) {
            $data['address'] = $request->input('address');
        }

        $user->update($data);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->roleType === 'CUSTOMER' ? $user->address : null,
            'role' => $user->roleType,
        ]);
    }

    // POST /api/auth/logout — revokes the token used for this request
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
