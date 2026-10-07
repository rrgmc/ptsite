<?php

namespace PTSite\App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Archived records are hidden from normal use but kept, with their history. Unlike soft deletes, they are
 * not filtered automatically: queries opt in with notArchived().
 */
trait Archivable
{
    public function scopeNotArchived(Builder $query): void
    {
        $query->whereNull($this->qualifyColumn('archived_at'));
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }
}
