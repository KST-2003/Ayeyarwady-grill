<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MenuController extends Controller
{
    // GET /api/menu — public: full menu grouped by category
    public function index()
    {
        $categories = Category::where('is_active', true)
            ->orderBy('display_order')
            ->with(['menuItems' => function ($query) {
                $query->where('is_available', true)->with('images');
            }])
            ->get();

        return response()->json($categories);
    }

    // GET /api/menu/admin — admin only: every category and item, including
    // inactive categories and unavailable items, so they can be found again
    // and re-enabled (the public /menu endpoint hides those by design).
    public function adminIndex()
    {
        $categories = Category::orderBy('display_order')
            ->with(['menuItems' => function ($query) {
                $query->with('images');
            }])
            ->get();

        return response()->json($categories);
    }

    // PATCH /api/menu/categories/{id} — admin only (rename / reorder / toggle active)
    public function updateCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $oldValue = $category->toArray();

        $data = [];
        if ($request->has('categoryName')) {
            $data['category_name'] = $request->input('categoryName');
        }
        if ($request->has('displayOrder')) {
            $data['display_order'] = $request->input('displayOrder');
        }
        if ($request->has('isActive')) {
            $data['is_active'] = $request->boolean('isActive');
        }
        $category->update($data);

        AuditLogger::record($request, 'update', 'categories', $category->id, $oldValue, $category->toArray());

        return response()->json($category);
    }

    // POST /api/menu/categories — admin only
    public function storeCategory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'categoryName' => 'required|string|max:255',
            'displayOrder' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $category = Category::create([
            'category_name' => $request->input('categoryName'),
            'display_order' => $request->input('displayOrder', 0),
        ]);

        AuditLogger::record($request, 'create', 'categories', $category->id, null, $category->toArray());

        return response()->json($category, 201);
    }

    // POST /api/menu/items — admin only
    public function storeItem(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'categoryId' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'prepTimeMin' => 'nullable|integer|min:0',
            'imageUrl' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $item = MenuItem::create([
            'category_id' => $request->input('categoryId'),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'prep_time_min' => $request->input('prepTimeMin', 15),
        ]);

        if ($request->filled('imageUrl')) {
            $item->images()->create([
                'image_url' => $request->input('imageUrl'),
                'is_primary' => true,
            ]);
        }

        AuditLogger::record($request, 'create', 'menu_items', $item->id, null, $item->toArray());

        return response()->json($item->load('images'), 201);
    }

    // PATCH /api/menu/items/{id} — admin only (edit / toggle availability)
    public function updateItem(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);
        $oldValue = $item->toArray();

        $data = [];
        if ($request->has('name')) {
            $data['name'] = $request->input('name');
        }
        if ($request->has('description')) {
            $data['description'] = $request->input('description');
        }
        if ($request->has('price')) {
            $data['price'] = $request->input('price');
        }
        if ($request->has('isAvailable')) {
            $data['is_available'] = $request->boolean('isAvailable');
        }
        if ($request->has('prepTimeMin')) {
            $data['prep_time_min'] = $request->input('prepTimeMin');
        }

        $item->update($data);

        AuditLogger::record($request, 'update', 'menu_items', $item->id, $oldValue, $item->toArray());

        return response()->json($item);
    }

    // POST /api/menu/items/{id}/image — admin only: upload/replace this
    // item's photo. Only one photo per item today (menu_item_images allows
    // more, but the ordering page only ever shows the primary one) — the
    // previous file and row are replaced outright rather than accumulated.
    public function uploadImage(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'image' => 'required|image|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        foreach ($item->images as $existing) {
            $oldPath = parse_url($existing->image_url, PHP_URL_PATH);
            $relative = preg_replace('#^.*/storage/#', '', $oldPath ?? '');
            if ($relative) {
                Storage::disk('public')->delete($relative);
            }
        }
        $item->images()->delete();

        $file = $request->file('image');
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $path = $file->storeAs('menu-item-images', "{$item->id}-".now()->timestamp.".{$ext}", 'public');

        $item->images()->create([
            'image_url' => Storage::disk('public')->url($path),
            'is_primary' => true,
        ]);

        AuditLogger::record($request, 'upload_image', 'menu_items', $item->id);

        return response()->json($item->fresh()->load('images'));
    }

    // DELETE /api/menu/items/{id} — admin only
    public function destroyItem(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);
        $oldValue = $item->toArray();
        $item->delete();

        AuditLogger::record($request, 'delete', 'menu_items', $id, $oldValue, null);

        return response()->json(null, 204);
    }
}
