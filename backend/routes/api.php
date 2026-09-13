<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OverviewController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// ── Auth ──────────────────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/me', [AuthController::class, 'updateMe']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

// ── Menu ──────────────────────────────────────────────────────────────
Route::get('/menu', [MenuController::class, 'index']); // public
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/menu/admin', [MenuController::class, 'adminIndex']);
    Route::post('/menu/categories', [MenuController::class, 'storeCategory']);
    Route::patch('/menu/categories/{id}', [MenuController::class, 'updateCategory']);
    Route::post('/menu/items', [MenuController::class, 'storeItem']);
    Route::patch('/menu/items/{id}', [MenuController::class, 'updateItem']);
    Route::post('/menu/items/{id}/image', [MenuController::class, 'uploadImage']);
    Route::delete('/menu/items/{id}', [MenuController::class, 'destroyItem']);
});

// ── Tables ────────────────────────────────────────────────────────────
Route::get('/tables/verify-qr', [TableController::class, 'verifyQr']); // public
Route::middleware(['auth:sanctum', 'role:staff,admin'])->group(function () {
    Route::get('/tables', [TableController::class, 'index']);
    Route::patch('/tables/{id}/status', [TableController::class, 'updateStatus']);
});
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/tables', [TableController::class, 'store']);
    Route::post('/tables/{id}/qr', [TableController::class, 'generateQr']);
});

// ── Bookings ──────────────────────────────────────────────────────────
Route::get('/bookings/availability', [BookingController::class, 'availability']); // public
Route::middleware(['auth:sanctum', 'role:customer'])->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/mine', [BookingController::class, 'mine']);
    Route::post('/bookings/{id}/payment-proof', [PaymentController::class, 'uploadProof']);
    Route::get('/customers/me/stats', [CustomerController::class, 'stats']);
});
Route::middleware(['auth:sanctum', 'role:staff,admin'])->group(function () {
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::patch('/payments/{id}/verify', [PaymentController::class, 'verify']);
});

// ── Orders ────────────────────────────────────────────────────────────
// Creating an order is open to a logged-in customer OR a guest who just
// scanned a table's QR code. OptionalSanctumAuth attaches $request->user()
// when a valid bearer token is present, but never blocks the request
// when it's absent — same contract as the Node backend's optionalAuth.
Route::post('/orders', [OrderController::class, 'store'])
    ->middleware('optional.auth');

Route::middleware(['auth:sanctum', 'role:staff,admin'])->group(function () {
    Route::get('/orders/live', [OrderController::class, 'live']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});
Route::middleware(['auth:sanctum', 'role:customer'])->group(function () {
    Route::get('/orders/mine', [OrderController::class, 'mine']);
});

// ── Staff ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:staff,admin'])->group(function () {
    Route::post('/staff/clock', [StaffController::class, 'clock']);
    Route::get('/staff/attendance/mine', [StaffController::class, 'myAttendance']);
});
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/staff', [StaffController::class, 'index']);
    Route::post('/staff', [StaffController::class, 'store']);
    Route::patch('/staff/{id}', [StaffController::class, 'update']);
    Route::get('/staff/roles', [StaffController::class, 'roles']);
    Route::get('/staff/attendance', [StaffController::class, 'attendance']);
});

// ── Notifications ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications/mine', [NotificationController::class, 'mine']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
});

// ── Overview (dashboard stat cards) ─────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:staff,admin'])->group(function () {
    Route::get('/overview', [OverviewController::class, 'index']);
});

// ── Payment methods ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payment-methods/qr', [PaymentMethodController::class, 'activeQr']);
});
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
    Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
    Route::patch('/payment-methods/{id}', [PaymentMethodController::class, 'update']);
    Route::post('/payment-methods/{id}/qr-image', [PaymentMethodController::class, 'uploadQr']);
});

// ── Audit log ─────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::delete('/audit-logs/{id}', [AuditLogController::class, 'destroy']);
});
