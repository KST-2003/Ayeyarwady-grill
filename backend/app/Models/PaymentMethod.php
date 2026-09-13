<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use App\Traits\CamelCaseAttributes;

class PaymentMethod extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['method_name', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    // Not a real column — the schema has no image field on payment_methods.
    // The restaurant's scan-to-pay QR image lives on disk, filed under this
    // row's own id (payment-method-qr/{id}.{ext}), so nothing needs to be
    // stored in the database at all — this accessor just looks it up.
    protected $appends = ['qr_image_url'];

    const QR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

    public function getQrImageUrlAttribute(): ?string
    {
        foreach (self::QR_EXTENSIONS as $ext) {
            $path = "payment-method-qr/{$this->id}.{$ext}";
            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->url($path);
            }
        }

        return null;
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'method_id');
    }
}
