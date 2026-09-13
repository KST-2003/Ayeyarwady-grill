<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingStatusLog;
use App\Models\Notification;
use App\Models\Payment;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    // POST /api/bookings/{id}/payment-proof — customer uploads a screenshot
    // of their external KBZPay/bank payment as proof of the deposit. The
    // schema's `payments` table has no image column, so the file goes to
    // disk (the `public` storage disk) and only its relative path is saved
    // into the existing `notes` column — see Payment::getScreenshotUrlAttribute.
    public function uploadProof(Request $request, $bookingId)
    {
        $booking = Booking::where('id', $bookingId)
            ->where('customer_id', $request->user()->id)
            ->firstOrFail();

        $payment = $booking->payments()->latest('id')->first();

        if (! $payment) {
            return response()->json(['error' => 'No deposit found for this booking'], 404);
        }

        if ($payment->status === 'PAID') {
            return response()->json(['error' => 'This deposit has already been verified'], 400);
        }

        $validator = Validator::make($request->all(), [
            // Capped at 2MB to match this server's php.ini upload_max_filesize —
            // a larger validation limit here would silently fail instead.
            'screenshot' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $path = $request->file('screenshot')->store('payment-proofs', 'public');

        $payment->update([
            'notes' => $path,
            'payment_date' => now(),
            'status' => 'PENDING',
        ]);

        return response()->json($payment);
    }

    // PATCH /api/payments/{id}/verify — staff/admin marks an uploaded proof
    // as PAID (after checking it against the restaurant's own KBZPay
    // dashboard) or FAILED (screenshot doesn't check out). Confirming a
    // deposit also confirms its booking; this is the only place a booking
    // moves from PENDING to CONFIRMED for the QR-payment flow.
    public function verify(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:PAID,FAILED',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $payment = Payment::findOrFail($id);
        $oldStatus = $payment->status;
        $newStatus = $request->input('status');
        $payment->update(['status' => $newStatus]);

        AuditLogger::record($request, 'verify', 'payments', $payment->id, ['status' => $oldStatus], ['status' => $newStatus]);

        if ($payment->booking_id) {
            $booking = Booking::findOrFail($payment->booking_id);

            if ($newStatus === 'PAID') {
                $oldStatus = $booking->status;
                $booking->update(['status' => 'CONFIRMED']);

                BookingStatusLog::create([
                    'booking_id' => $booking->id,
                    'staff_id' => $request->user()->roleType === 'STAFF' ? $request->user()->id : null,
                    'old_status' => $oldStatus,
                    'new_status' => 'CONFIRMED',
                    'changed_at' => now(),
                ]);

                Notification::create([
                    'customer_id' => $booking->customer_id,
                    'message' => "Your deposit has been verified — table confirmed for {$booking->booking_time} on {$booking->booking_date}.",
                    'type' => 'DEPOSIT_RECEIPT',
                ]);
            } else {
                Notification::create([
                    'customer_id' => $booking->customer_id,
                    'message' => 'We could not verify your payment screenshot — please upload it again or contact the restaurant.',
                    'type' => 'PAYMENT_REJECTED',
                ]);
            }
        }

        return response()->json($payment);
    }
}
