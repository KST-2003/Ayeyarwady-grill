<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceType;
use App\Models\Staff;
use App\Models\StaffRole;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StaffController extends Controller
{
    // POST /api/staff/clock — staff clocks in or out
    public function clock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:Clock In,Clock Out',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $attendanceType = AttendanceType::firstOrCreate(
            ['type_name' => $request->input('type')]
        );

        $record = Attendance::create([
            'staff_id' => $request->user()->id,
            'type_id' => $attendanceType->id,
            'notes' => $request->input('notes'),
        ]);

        return response()->json($record, 201);
    }

    // GET /api/staff/attendance/mine — staff's own attendance history
    public function myAttendance(Request $request)
    {
        $records = Attendance::where('staff_id', $request->user()->id)
            ->with('type')
            ->orderByDesc('timestamp')
            ->take(50)
            ->get();

        return response()->json($records);
    }

    // GET /api/staff/attendance — admin: every staff member's clock-in/out history
    public function attendance()
    {
        $records = Attendance::with(['staff', 'type'])
            ->orderByDesc('timestamp')
            ->take(200)
            ->get();

        return response()->json($records);
    }

    // GET /api/staff — admin: list all staff accounts
    public function index()
    {
        $staff = Staff::with('role')->orderBy('name')->get();

        return response()->json($staff);
    }

    // POST /api/staff — admin: create a new staff account
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:staff,email',
            'phone' => 'nullable|string|max:50',
            'roleId' => 'required|exists:staff_roles,id',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $staff = Staff::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'role_id' => $request->input('roleId'),
            'password' => Hash::make($request->input('password')),
            'managed_by_admin_id' => $request->user()->id,
        ]);

        AuditLogger::record($request, 'create', 'staff', $staff->id, null, $staff->toArray());

        return response()->json($staff->load('role'), 201);
    }

    // PATCH /api/staff/{id} — admin: toggle active/inactive or change role
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'isActive' => 'sometimes|boolean',
            'roleId' => 'sometimes|exists:staff_roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $staff = Staff::findOrFail($id);
        $oldValue = $staff->toArray();

        $data = [];
        if ($request->has('isActive')) {
            $data['is_active'] = $request->boolean('isActive');
        }
        if ($request->has('roleId')) {
            $data['role_id'] = $request->input('roleId');
        }
        $staff->update($data);

        AuditLogger::record($request, 'update', 'staff', $staff->id, $oldValue, $staff->toArray());

        return response()->json($staff->load('role'));
    }

    // GET /api/staff/roles — list available staff roles (for the create-staff form)
    public function roles()
    {
        return response()->json(StaffRole::all());
    }
}
