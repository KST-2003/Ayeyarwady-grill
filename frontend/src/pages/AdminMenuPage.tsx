import { useEffect, useRef, useState, FormEvent } from "react";
import { Check, ChefHat, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import api from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  images: { imageUrl: string; isPrimary: boolean }[];
}
interface EditDraft {
  categoryId: string;
  name: string;
  description: string;
  price: string;
}
interface Category {
  id: string;
  categoryName: string;
  isActive: boolean;
  menuItems: MenuItem[];
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const rowFileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function refresh() {
    api.get("/menu/admin").then((res) => setCategories(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName) return;
    await api.post("/menu/categories", { categoryName: newCategoryName });
    setNewCategoryName("");
    refresh();
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !name || !price) return;
    setError("");
    try {
      const { data: item } = await api.post("/menu/items", {
        categoryId,
        name,
        description,
        price: Number(price),
      });
      if (photo) {
        const form = new FormData();
        form.append("image", photo);
        await api.post(`/menu/items/${item.id}/image`, form);
      }
      setName("");
      setPrice("");
      setDescription("");
      setPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not add item");
    }
  }

  async function uploadPhoto(itemId: string, file: File) {
    setUploadingId(itemId);
    try {
      const form = new FormData();
      form.append("image", file);
      await api.post(`/menu/items/${itemId}/image`, form);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not upload photo");
    } finally {
      setUploadingId(null);
    }
  }

  async function toggleAvailable(item: MenuItem) {
    await api.patch(`/menu/items/${item.id}`, { isAvailable: !item.isAvailable });
    refresh();
  }

  async function toggleCategoryActive(cat: Category) {
    await api.patch(`/menu/categories/${cat.id}`, { isActive: !cat.isActive });
    refresh();
  }

  function startEdit(item: MenuItem, categoryId: string) {
    setEditingId(item.id);
    setEditError("");
    setDraft({
      categoryId,
      name: item.name,
      description: item.description ?? "",
      price: String(Number(item.price)),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setEditError("");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId || !draft) return;
    if (!draft.name.trim() || draft.price === "") {
      setEditError("Name and price are required");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      await api.patch(`/menu/items/${editingId}`, {
        categoryId: draft.categoryId,
        name: draft.name.trim(),
        description: draft.description,
        price: Number(draft.price),
      });
      cancelEdit();
      refresh();
    } catch (err: any) {
      setEditError(err?.response?.data?.error ?? "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    await api.delete(`/menu/items/${id}`);
    refresh();
  }

  const totalItems = categories?.reduce((sum, c) => sum + c.menuItems.length, 0) ?? 0;
  const availableItems = categories?.reduce(
    (sum, c) => sum + c.menuItems.filter((i) => i.isAvailable).length,
    0
  ) ?? 0;

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/admin/menu" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Kitchen catalogue
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Manage Menu</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          Categories and dishes shown to customers on the public menu and QR ordering page.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-lg">
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{categories?.length ?? "—"}</p>
            <p className="text-xs text-grill-brown/50">Categories</p>
          </div>
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{categories ? totalItems : "—"}</p>
            <p className="text-xs text-grill-brown/50">Menu items</p>
          </div>
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{categories ? availableItems : "—"}</p>
            <p className="text-xs text-grill-brown/50">Available now</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={addCategory} className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-base text-grill-brown">
              <ChefHat className="h-4 w-4 text-grill-orange-dark" strokeWidth={1.75} />
              Add category
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Desserts"
                className="flex-1 rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
              />
              <button className="flex items-center gap-1 rounded-md bg-grill-brown px-4 py-2.5 text-sm font-medium text-white hover:bg-grill-brown-light">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add
              </button>
            </div>
          </form>

          <form onSubmit={addItem} className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-base text-grill-brown">
              <UtensilsCrossed className="h-4 w-4 text-grill-orange-dark" strokeWidth={1.75} />
              Add menu item
            </h2>
            <div className="mt-3 space-y-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
              >
                <option value="">Select category…</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.categoryName}</option>
                ))}
              </select>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                className="w-full rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price (MMK)"
                  className="w-1/2 rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                />
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="w-1/2 rounded-md border border-grill-brown/20 px-2 py-2 text-xs text-grill-brown/60 file:mr-2 file:rounded file:border-0 file:bg-grill-brown/5 file:px-2 file:py-1 file:text-xs focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button className="w-full rounded-md bg-grill-orange py-2.5 text-sm font-medium text-white hover:bg-grill-orange-dark">
                Add item
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 space-y-6">
          {categories?.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-grill-brown">{cat.categoryName}</h3>
                <button
                  onClick={() => toggleCategoryActive(cat)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-grill-brown/5 text-grill-brown/50"
                  }`}
                >
                  {cat.isActive ? "Visible on menu" : "Hidden"}
                </button>
              </div>
              <div className="mt-2 divide-y divide-grill-brown/5 rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
                {cat.menuItems.map((item) =>
                  editingId === item.id && draft ? (
                    <form key={item.id} onSubmit={saveEdit} className="space-y-2 bg-grill-orange/5 px-5 py-4 text-sm">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Item name"
                          autoFocus
                          className="rounded-md border border-grill-brown/20 bg-white px-3.5 py-2 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                        />
                        <select
                          value={draft.categoryId}
                          onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                          className="rounded-md border border-grill-brown/20 bg-white px-3.5 py-2 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                        >
                          {categories?.map((c) => (
                            <option key={c.id} value={c.id}>{c.categoryName}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        placeholder="Description"
                        className="w-full rounded-md border border-grill-brown/20 bg-white px-3.5 py-2 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={draft.price}
                          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                          placeholder="Price (MMK)"
                          className="w-40 rounded-md border border-grill-brown/20 bg-white px-3.5 py-2 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                        />
                        <span className="text-xs text-grill-brown/50">MMK</span>
                        <div className="ml-auto flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex items-center gap-1 rounded-md border border-grill-brown/20 bg-white px-3 py-2 text-xs font-medium text-grill-brown/70 hover:bg-grill-brown/5"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                            Cancel
                          </button>
                          <button
                            disabled={saving}
                            className="flex items-center gap-1 rounded-md bg-grill-orange px-3 py-2 text-xs font-medium text-white hover:bg-grill-orange-dark disabled:opacity-60"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2} />
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                      {editError && <p className="text-xs text-red-600">{editError}</p>}
                    </form>
                  ) : (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                    <button
                      onClick={() => rowFileInputs.current[item.id]?.click()}
                      disabled={uploadingId === item.id}
                      className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-grill-brown/5"
                      title="Upload / change photo"
                    >
                      {item.images?.[0] && (
                        <img src={item.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                        <ImagePlus className="h-4 w-4 text-white" strokeWidth={1.75} />
                      </span>
                      <input
                        ref={(el) => (rowFileInputs.current[item.id] = el)}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(item.id, file);
                          e.target.value = "";
                        }}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-grill-brown">{item.name}</p>
                      <p className="truncate text-xs text-grill-brown/50">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-grill-brown/70">
                      {Number(item.price).toLocaleString()} MMK
                    </span>
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-grill-brown/5 text-grill-brown/50"
                      }`}
                    >
                      {item.isAvailable ? (
                        <Eye className="h-3 w-3" strokeWidth={2} />
                      ) : (
                        <EyeOff className="h-3 w-3" strokeWidth={2} />
                      )}
                      {item.isAvailable ? "Available" : "Hidden"}
                    </button>
                    <button
                      onClick={() => startEdit(item, cat.id)}
                      title="Edit item"
                      className="shrink-0 rounded-md p-1.5 text-grill-brown/30 hover:bg-grill-orange/10 hover:text-grill-orange-dark"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 rounded-md p-1.5 text-grill-brown/30 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                  )
                )}
                {cat.menuItems.length === 0 && (
                  <p className="px-5 py-4 text-xs text-grill-brown/40">No items yet</p>
                )}
              </div>
            </div>
          ))}
          {categories?.length === 0 && (
            <p className="py-16 text-center text-sm text-grill-brown/40">No categories yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
