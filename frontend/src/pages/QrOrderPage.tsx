import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Flame, Minus, Plus, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import api from "../lib/api";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: { imageUrl: string; isPrimary: boolean }[];
}
interface Category {
  id: string;
  categoryName: string;
  menuItems: MenuItem[];
}
interface CartLine {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
interface Receipt {
  id: string;
  createdAt: string;
  totalAmount: number;
  table: { tableNumber: number };
  items: { id: string; quantity: number; unitPrice: number; item: { name: string } }[];
}

export default function QrOrderPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table");
  const token = searchParams.get("token");

  const [tableId, setTableId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    api.get("/menu").then((res) => {
      setCategories(res.data);
      setActiveCategory(res.data[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!tableNumber || !token) return;
    api
      .get("/tables/verify-qr", { params: { table: tableNumber, token } })
      .then((res) => setTableId(res.data.tableId))
      .catch(() => setVerifyError("This QR code is invalid or has expired. Please ask staff for help."));
  }, [tableNumber, token]);

  function setQuantity(item: MenuItem, quantity: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[item.id];
        return next;
      }
      next[item.id] = {
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        imageUrl: item.images?.[0]?.imageUrl,
      };
      return next;
    });
  }

  const lines = Object.values(cart);
  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  async function placeOrder() {
    if (!tableId || lines.length === 0 || placing) return;
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", {
        tableId,
        items: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      });
      setReceipt(data);
      setCart({});
      setCartOpen(false);
    } finally {
      setPlacing(false);
    }
  }

  function orderMore() {
    setReceipt(null);
  }

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!tableNumber || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 text-center">
        <p className="text-sm text-grill-brown/60">
          Scan the QR code on your table to start ordering.
        </p>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 text-center">
        <p className="text-sm text-red-600">{verifyError}</p>
      </div>
    );
  }

  if (receipt) {
    return <ReceiptView receipt={receipt} tableNumber={tableNumber} onOrderMore={orderMore} />;
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-20 bg-grill-brown px-5 pb-3 pt-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Ayeyarwady Grill · Table {tableNumber}</p>
            <h1 className="font-display text-xl">Menu</h1>
          </div>
          <Flame className="h-6 w-6 text-grill-orange" strokeWidth={1.75} />
        </div>

        {categories && categories.length > 0 && (
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  activeCategory === cat.id
                    ? "bg-grill-orange text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-5 py-5">
        {categories === null && (
          <p className="py-16 text-center text-sm text-grill-brown/40">Loading menu…</p>
        )}
        {categories?.map((cat) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="mb-8 scroll-mt-32">
            <h2 className="mb-3 font-display text-lg text-grill-brown">{cat.categoryName}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cat.menuItems.map((item) => {
                const qty = cart[item.id]?.quantity ?? 0;
                const photo = item.images?.[0]?.imageUrl;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-grill-brown/10 bg-white shadow-sm"
                  >
                    <div className="aspect-square w-full bg-grill-brown/5">
                      {photo ? (
                        <img src={photo} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UtensilsCrossed className="h-6 w-6 text-grill-brown/20" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="text-xs font-medium leading-tight text-grill-brown">{item.name}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-grill-brown/50">
                        {item.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-xs font-medium text-grill-orange-dark">
                          {Number(item.price).toLocaleString()} MMK
                        </span>
                        {qty === 0 ? (
                          <button
                            onClick={() => setQuantity(item, 1)}
                            className="rounded-md bg-grill-orange px-2.5 py-1 text-[11px] font-medium text-white hover:bg-grill-orange-dark"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-md bg-grill-brown/5 px-1 py-1">
                            <button
                              onClick={() => setQuantity(item, qty - 1)}
                              className="flex h-5 w-5 items-center justify-center rounded bg-white text-grill-brown shadow-sm"
                            >
                              <Minus className="h-3 w-3" strokeWidth={2} />
                            </button>
                            <span className="w-3 text-center text-xs font-medium text-grill-brown">{qty}</span>
                            <button
                              onClick={() => setQuantity(item, qty + 1)}
                              className="flex h-5 w-5 items-center justify-center rounded bg-white text-grill-brown shadow-sm"
                            >
                              <Plus className="h-3 w-3" strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-grill-brown/10 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
        >
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-grill-orange text-xs font-semibold text-white">
                {cartCount}
              </span>
              <span className="text-sm font-medium text-grill-brown">View cart</span>
            </div>
            <span className="font-medium text-grill-brown">{total.toLocaleString()} MMK</span>
          </div>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
          <div className="max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-grill-brown/10 bg-white px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg text-grill-brown">
                <ShoppingBag className="h-4 w-4 text-grill-orange-dark" strokeWidth={1.75} />
                Your order
              </h2>
              <button onClick={() => setCartOpen(false)} className="rounded-md p-1 text-grill-brown/40 hover:bg-grill-brown/5">
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="divide-y divide-grill-brown/5 px-5">
              {lines.length === 0 && (
                <p className="py-8 text-center text-sm text-grill-brown/40">Your cart is empty.</p>
              )}
              {lines.map((line) => (
                <div key={line.itemId} className="flex items-center gap-3 py-3.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-grill-brown/5">
                    {line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-grill-brown">{line.name}</p>
                    <p className="text-xs text-grill-brown/50">{line.price.toLocaleString()} MMK</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-grill-brown/5 px-1 py-1">
                    <button
                      onClick={() => setCart((prev) => {
                        const next = { ...prev };
                        const l = next[line.itemId];
                        if (l.quantity <= 1) delete next[line.itemId];
                        else next[line.itemId] = { ...l, quantity: l.quantity - 1 };
                        return next;
                      })}
                      className="flex h-6 w-6 items-center justify-center rounded bg-white text-grill-brown shadow-sm"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <span className="w-4 text-center text-sm font-medium text-grill-brown">{line.quantity}</span>
                    <button
                      onClick={() => setCart((prev) => ({
                        ...prev,
                        [line.itemId]: { ...prev[line.itemId], quantity: prev[line.itemId].quantity + 1 },
                      }))}
                      className="flex h-6 w-6 items-center justify-center rounded bg-white text-grill-brown shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="sticky bottom-0 border-t border-grill-brown/10 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-grill-brown/60">Total</span>
                  <span className="font-display text-lg text-grill-brown">{total.toLocaleString()} MMK</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full rounded-md bg-grill-orange py-3 text-sm font-medium text-white hover:bg-grill-orange-dark disabled:opacity-60"
                >
                  {placing ? "Placing order…" : "Place order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptView({
  receipt,
  tableNumber,
  onOrderMore,
}: {
  receipt: Receipt;
  tableNumber: string;
  onOrderMore: () => void;
}) {
  const placedAt = new Date(receipt.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex min-h-screen flex-col items-center bg-cream px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-grill-brown/10 bg-white p-6 shadow-sm">
        <div className="text-center">
          <Flame className="mx-auto h-7 w-7 text-grill-orange" strokeWidth={1.75} />
          <h1 className="mt-2 font-display text-xl text-grill-brown">Ayeyarwady Grill</h1>
          <p className="mt-1 text-xs text-grill-brown/50">Order sent to the kitchen 🔥</p>
        </div>

        <div className="mt-5 flex justify-between border-y border-dashed border-grill-brown/15 py-3 text-xs text-grill-brown/60">
          <span>Order #{receipt.id}</span>
          <span>Table {tableNumber}</span>
        </div>
        <p className="mt-2 text-center text-[11px] text-grill-brown/40">{placedAt}</p>

        <div className="mt-4 space-y-2">
          {receipt.items.map((line) => (
            <div key={line.id} className="flex justify-between text-sm">
              <span className="text-grill-brown">
                {line.quantity} × {line.item.name}
              </span>
              <span className="text-grill-brown/70">
                {(line.unitPrice * line.quantity).toLocaleString()} MMK
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-grill-brown/10 pt-3 text-sm font-medium">
          <span className="text-grill-brown">Total</span>
          <span className="font-display text-lg text-grill-brown">
            {Number(receipt.totalAmount).toLocaleString()} MMK
          </span>
        </div>

        <p className="mt-5 text-center text-xs text-grill-brown/50">
          Staff will bring your food out shortly. Thank you!
        </p>
      </div>

      <button
        onClick={onOrderMore}
        className="mt-6 w-full max-w-sm rounded-md bg-grill-orange py-3 text-sm font-medium text-white hover:bg-grill-orange-dark"
      >
        Order more
      </button>
    </div>
  );
}
