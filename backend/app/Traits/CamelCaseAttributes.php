<?php

namespace App\Traits;

/**
 * Makes every model's JSON output (attributes AND relation keys, at any
 * nesting depth) use camelCase instead of Eloquent's default snake_case.
 *
 * This exists specifically so the existing React frontend — built against
 * the Node/Prisma backend, which returns camelCase by default — keeps
 * working unmodified against this Laravel backend. Without this trait,
 * `booking_date` would come back instead of `bookingDate`, `menu_items`
 * instead of `menuItems`, and the frontend's TypeScript interfaces would
 * silently receive `undefined` for every field.
 */
trait CamelCaseAttributes
{
    public function toArray()
    {
        return $this->camelCaseKeysRecursive(parent::toArray());
    }

    protected function camelCaseKeysRecursive($value)
    {
        if (! is_array($value)) {
            return $value;
        }

        $result = [];
        foreach ($value as $key => $item) {
            $newKey = is_string($key) ? $this->toCamelCase($key) : $key;
            $result[$newKey] = $this->camelCaseKeysRecursive($item);
        }

        return $result;
    }

    protected function toCamelCase(string $key): string
    {
        return lcfirst(str_replace(' ', '', ucwords(str_replace(['_', '-'], ' ', $key))));
    }
}
