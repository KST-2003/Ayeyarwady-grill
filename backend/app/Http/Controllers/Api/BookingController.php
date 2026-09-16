<?php

namespace App\Http\Controllers\Api;

use App\Events\BookingCreated;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingStatusLog;
use App\Models\DiningTable;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Support\SafeBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BookingController extends Controller
{
    // GET /api/bookings/availability?date=2026-05-25&time=19:00&guests=4
    public function availability(Request $request)
    {
        $date = $request->query('date');
        $time = $request->query('time');
        $guests = (int) $request->query('guests', 1);

        if (! $date || ! $time) {
            return response()->json(['error' => 'date and time are required'], 400);
        }

        $bookedTableIds = Booking::where('booking_date', $date)
            ->where('booking_time', $time)
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->whereNotNull('table_id')
            ->pluck('table_id');

        // Excludes OCCUPIED and NEEDS_CLEANING — both are live dine-in floor
        // states (see TableController), not date/time-scoped like a
        // booking is, but this app has no way to know when an occupied
        // table will free up, so the safe behavior is to leave it off the
        // picker entirely rather than risk double-booking it. RESERVED is
        // left bookable: it's a short-lived (~20 min) state from a QR scan
        // with no order yet, and self-expires (TableController::reapStaleReservations),
        // so it's not a meaningful signal for a reservation days out.
        $availableTables = DiningTable::whereNotIn('id', $bookedTableIds)
            ->where('capacity', '>=', $guests)
            ->whereNotIn('status', ['OCCUPIED', 'NEEDS_CLEANING'])
            ->with('section')
            ->orderBy('table_number')
            ->get();

        return response()->json($availableTables);
    }

    // POST /api/bookings — customer creates a booking. The booking and its
    // deposit both start PENDING (matches the schema's column defaults);
    // the customer pays the deposit externally (QR/bank transfer) and
    // uploads proof via PaymentController::uploadProof, then staff verify
    // it via PaymentController::verify before the booking is CONFIRMED.
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tableId' => 'required|exists:dining_tables,id',
            'bookingDate' => 'required|date',
            'bookingTime' => 'required|string',
            'guestCount' => 'required|integer|min:1',
            'specialRequest' => 'nullable|string',
            'depositAmount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $customer = $request->user();

        $booking = Booking::create([
            'customer_id' => $customer->id,
            'table_id' => $request->input('tableId'),
            'booking_date' => $request->input('bookingDate'),
            'booking_time' => $request->input('bookingTime'),
            'guest_count' => $request->input('guestCount'),
            'special_request' => $request->input('specialRequest'),
            'deposit_amount' => $request->input('depositAmount', 20000),
            'status' => 'PENDING',
        ]);

        $method = PaymentMethod::firstOrCreate(['method_name' => 'KBZPay']);

        Payment::create([
            'booking_id' => $booking->id,
            'method_id' => $method->id,
            'amount' => $booking->deposit_amount,
            'status' => 'PENDING',
        ]);

        Notification::create([
            'customer_id' => $customer->id,
            'message' => "Booking request received for {$booking->booking_time} on {$booking->booking_date} — pay the deposit and upload your payment screenshot to confirm your table.",
            'type' => 'BOOKING_REMINDER',
        ]);

        $booking->load(['table', 'customer', 'payments']);

        SafeBroadcast::send(new BookingCreated($booking));

        return response()->json($booking, 201);
    }

    // GET /api/bookings/mine — customer's own booking history
    public function mine(Request $request)
    {
        $bookings = Booking::where('customer_id', $request->user()->id)
            ->with(['table.section', 'payments'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($bookings);
    }

    // GET /api/bookings — staff/admin: all bookings, most recently
    // submitted first (not by dining date — several bookings can share the
    // same future date, and staff need to see new requests as they come in).
    public function index()
    {
        $bookings = Booking::with(['customer', 'table', 'payments'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($bookings);
    }

    // PATCH /api/bookings/{id}/status — staff/admin
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:PENDING,CONFIRMED,CANCELLED,COMPLETED,NO_SHOW',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $booking = Booking::findOrFail($id);
        $oldStatus = $booking->status;
        $newStatus = $request->input('status');

        $booking->update(['status' => $newStatus]);

        BookingStatusLog::create([
            'booking_id' => $booking->id,
            // Only attribute to staff_id when the acting account is actually
            // a Staff row — an Admin's id would violate the staff_id foreign
            // key, since Admin and Staff are separate tables with their own
            // independent id sequences.
            'staff_id' => $request->user()->roleType === 'STAFF' ? $request->user()->id : null,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_at' => now(),
        ]);

        return response()->json($booking);
    }
}
