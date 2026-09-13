<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Traits\CamelCaseAttributes;

class DiningTable extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $table = 'dining_tables';

    protected $fillable = ['section_id', 'table_number', 'capacity', 'status', 'floor'];

    public function section(): BelongsTo
    {
        return $this->belongsTo(TableSection::class, 'section_id');
    }

    public function qrCode(): HasOne
    {
        return $this->hasOne(QrCode::class, 'table_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'table_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}
