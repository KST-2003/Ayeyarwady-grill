import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, QrCode } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BookingStepper from "../components/BookingStepper";
import BookingCalendar from "../components/BookingCalendar";

interface AvailableTable {
  id: string;
  tableNumber: number;
  capacity: number;
  section: { sectionName: string };
}

interface ConfirmedBooking {
  id: string;
  depositAmount: number;
  payments?: { id: string }[];
}

interface PaymentQr {
  methodName: string | null;
  qrImageUrl: string | null;
}

const TIME_SLOTS = [
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
];

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookTablePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [guests, setGuests] = useState(2);
  const [specialRequest, setSpecialRequest] = useState("");
  const [tables, setTables] = useState<AvailableTable[] | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<AvailableTable | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [paymentQr, setPaymentQr] = useState<PaymentQr | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get("/payment-methods/qr").then((res) => setPaymentQr(res.data));
  }, [user]);

  useEffect(() => {
    if (user) {
      setContactName((prev) => prev || user.name);
      setContactPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (step !== 2 || !selectedDate || !selectedTime) return;
    setLoadingTables(true);
    setSelectedTable(null);
    api
      .get("/bookings/availability", {
        params: { date: formatDateInput(selectedDate), time: selectedTime, guests },
      })
      .then(({ data }) => setTables(data))
      .finally(() => setLoadingTables(false));
  }, [step, selectedDate, selectedTime, guests]);

  async function confirmBooking() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedTable || !selectedDate || !selectedTime) return;

    setConfirming(true);
    try {
      if (contactName !== user.name || contactPhone !== (user.phone ?? "")) {
        await updateProfile({ name: contactName, phone: contactPhone });
      }
      const { data } = await api.post("/bookings", {
        tableId: selectedTable.id,
        bookingDate: formatDateInput(selectedDate),
        bookingTime: selectedTime,
        guestCount: guests,
        specialRequest: specialRequest || undefined,
        depositAmount: 20000,
      });
      setBooking(data);
      setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  }

  async function submitProof() {
    if (!screenshotFile || !booking) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("screenshot", screenshotFile);
      await api.post(`/bookings/${booking.id}/payment-proof`, form);
      setProofSubmitted(true);
    } catch (err: any) {
      setUploadError(err?.response?.data?.error ?? "Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
        <div className="max-w-sm animate-step rounded-2xl border border-grill-brown/10 bg-white p-8 text-center shadow-sm">
          {proofSubmitted ? (
            <>
              <h1 className="font-display text-2xl text-grill-brown">Payment submitted ✅</h1>
              <p className="mt-2 text-sm text-grill-brown/60">
                We've received your payment screenshot. The restaurant will verify it and
                confirm your table shortly — track the status in My Bookings.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl text-grill-brown">Almost there</h1>
              <p className="mt-2 text-sm text-grill-brown/60">
                Your table request is saved as pending. Pay the{" "}
                {Number(booking?.depositAmount ?? 20000).toLocaleString()} MMK deposit via{" "}
                {paymentQr?.methodName ?? "the restaurant's payment method"} below, then upload
                your payment screenshot to confirm your table.
              </p>

              <div className="mt-6 rounded-xl border border-dashed border-grill-brown/20 bg-grill-brown/[0.02] p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Scan to pay{paymentQr?.methodName ? ` · ${paymentQr.methodName}` : ""}
                </p>
                <div className="mx-auto mt-3 flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg border border-grill-brown/15 bg-white">
                  {paymentQr?.qrImageUrl ? (
                    <img
                      src={paymentQr.qrImageUrl}
                      alt={`${paymentQr.methodName} QR code`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <QrCode className="h-16 w-16 text-grill-brown/20" strokeWidth={1} />
                  )}
                </div>
                {!paymentQr?.qrImageUrl && (
                  <p className="mt-3 text-xs text-grill-brown/50">
                    QR not set up yet — ask a staff member for payment details.
                  </p>
                )}
              </div>

              <div className="mt-5 text-left">
                <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Upload payment screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-grill-brown/70 file:mr-3 file:rounded-md file:border-0 file:bg-grill-orange/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-grill-orange-dark"
                />
                <p className="mt-1 text-xs text-grill-brown/35">Max 2MB</p>
                {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
              </div>

              <button
                onClick={submitProof}
                disabled={!screenshotFile || uploading}
                className="mt-5 w-full rounded-md bg-grill-orange px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-grill-orange-dark disabled:opacity-50"
              >
                {uploading ? "Submitting…" : "Submit payment proof"}
              </button>
            </>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 w-full rounded-md border border-grill-brown/15 px-4 py-2 text-sm text-grill-brown/60 hover:bg-grill-brown/5"
          >
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Botahtaung Waterfront · Yangon
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Book a Table</h1>

        <div className="mt-8 mb-8">
          <BookingStepper current={step} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <div key={step} className="animate-step p-7">
            {step === 1 && (
              <>
                <h2 className="font-display text-xl text-grill-brown">Choose Date &amp; Time</h2>

                <p className="mt-6 text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Select date
                </p>
                <p className="mt-1 text-xs text-grill-brown/40">
                  Reservations open up to 3 months in advance
                </p>
                <div className="mt-3">
                  <BookingCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                </div>

                <p className="mt-7 text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Select time
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        selectedTime === t
                          ? "border-grill-orange bg-grill-orange/10 font-medium text-grill-orange-dark"
                          : "border-grill-brown/15 text-grill-brown/70 hover:border-grill-orange/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex justify-between border-t border-grill-brown/8 pt-6">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 rounded-md px-4 py-2.5 text-sm font-medium text-grill-brown/60 hover:bg-grill-brown/5"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex items-center gap-1 rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-grill-orange-dark disabled:cursor-not-allowed disabled:bg-grill-orange/40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-xl text-grill-brown">Party Details</h2>

                <p className="mt-6 text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Guests
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-grill-brown/20 text-grill-brown/70 hover:border-grill-orange/40"
                  >
                    <Minus className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <span className="w-10 text-center font-display text-xl text-grill-brown">{guests}</span>
                  <button
                    onClick={() => setGuests((g) => Math.min(20, g + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-grill-brown/20 text-grill-brown/70 hover:border-grill-orange/40"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <span className="text-sm text-grill-brown/50">guests</span>
                </div>

                <p className="mt-7 text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Special request (optional)
                </p>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  rows={2}
                  placeholder="Window seat, birthday celebration, allergies…"
                  className="mt-3 w-full rounded-lg border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                />

                <p className="mt-7 text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                  Available tables
                </p>
                <div className="mt-3 space-y-2">
                  {loadingTables && (
                    <p className="py-4 text-center text-sm text-grill-brown/40">Checking availability…</p>
                  )}
                  {!loadingTables && tables?.length === 0 && (
                    <p className="py-4 text-center text-sm text-grill-brown/40">
                      No tables free at that time — try another slot.
                    </p>
                  )}
                  {!loadingTables &&
                    tables?.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTable(t)}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          selectedTable?.id === t.id
                            ? "border-grill-orange bg-grill-orange/5"
                            : "border-grill-brown/15 hover:border-grill-orange/40"
                        }`}
                      >
                        <span className="text-grill-brown">
                          Table {t.tableNumber} · {t.section.sectionName}
                        </span>
                        <span className="text-grill-brown/50">Seats {t.capacity}</span>
                      </button>
                    ))}
                </div>

                <div className="mt-8 flex justify-between border-t border-grill-brown/8 pt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 rounded-md px-4 py-2.5 text-sm font-medium text-grill-brown/60 hover:bg-grill-brown/5"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedTable}
                    className="flex items-center gap-1 rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-grill-orange-dark disabled:cursor-not-allowed disabled:bg-grill-orange/40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-xl text-grill-brown">Customer Details</h2>

                {!user ? (
                  <div className="mt-6 rounded-xl border border-grill-brown/10 bg-grill-brown/[0.02] p-6 text-center">
                    <p className="text-sm text-grill-brown/60">
                      Sign in or create an account to continue your reservation.
                    </p>
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={() => navigate("/login")}
                        className="rounded-md bg-grill-orange px-4 py-2 text-sm font-medium text-white hover:bg-grill-orange-dark"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => navigate("/register")}
                        className="rounded-md border border-grill-brown/20 px-4 py-2 text-sm text-grill-brown/70 hover:bg-grill-brown/5"
                      >
                        Create account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                        Full name
                      </label>
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        className="mt-2 w-full rounded-lg border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                        Phone
                      </label>
                      <input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="09-xxx-xxx-xxx"
                        className="mt-2 w-full rounded-lg border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">
                        Email
                      </label>
                      <input
                        value={user.email}
                        disabled
                        className="mt-2 w-full rounded-lg border border-grill-brown/10 bg-grill-brown/5 px-3.5 py-2.5 text-sm text-grill-brown/50"
                      />
                    </div>
                    <p className="text-xs text-grill-brown/40">
                      This reservation is booked under your account. Changes here also update your profile.
                    </p>
                  </div>
                )}

                <div className="mt-8 flex justify-between border-t border-grill-brown/8 pt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1 rounded-md px-4 py-2.5 text-sm font-medium text-grill-brown/60 hover:bg-grill-brown/5"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!user || !contactName}
                    className="flex items-center gap-1 rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-grill-orange-dark disabled:cursor-not-allowed disabled:bg-grill-orange/40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </>
            )}

            {step === 4 && selectedDate && selectedTime && selectedTable && (
              <>
                <h2 className="font-display text-xl text-grill-brown">Confirm &amp; Pay</h2>

                <div className="mt-6 space-y-4 rounded-xl bg-grill-brown-dark p-6 text-white">
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-white/40">Date</p>
                      <p className="mt-1 font-display text-base">
                        {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Time</p>
                      <p className="mt-1 font-display text-base">{selectedTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Guests</p>
                      <p className="mt-1 font-display text-base">{guests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Table</p>
                      <p className="mt-1 font-display text-base">
                        {selectedTable.tableNumber} · {selectedTable.section.sectionName}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4 text-sm text-white/70">
                    <p>{contactName} · {contactPhone || "no phone on file"}</p>
                    {specialRequest && <p className="mt-1">"{specialRequest}"</p>}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl border border-grill-brown/10 px-5 py-4">
                  <span className="text-sm text-grill-brown/60">Deposit to confirm</span>
                  <span className="font-display text-xl text-grill-brown">20,000 MMK</span>
                </div>

                <div className="mt-8 flex justify-between border-t border-grill-brown/8 pt-6">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1 rounded-md px-4 py-2.5 text-sm font-medium text-grill-brown/60 hover:bg-grill-brown/5"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    Back
                  </button>
                  <button
                    onClick={confirmBooking}
                    disabled={confirming}
                    className="rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-grill-orange-dark disabled:opacity-50"
                  >
                    {confirming ? "Confirming…" : "Confirm booking"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
