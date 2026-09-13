<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class QrCode extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $table = 'qr_codes';

    protected $fillable = ['table_id', 'token', 'generated_at', 'is_active'];
    protected $casts = ['generated_at' => 'datetime', 'is_active' => 'boolean'];

    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }
}
