<?php

namespace PTSite\App\Queries;

use Closure;
use Illuminate\Support\Collection;
use PTSite\Domain\Shared\NameOrder;

/** Sorts a list for display by name, ignoring capitals and accents (NameOrder), optionally with a group first. */
final class SortByName
{
    /**
     * @template T
     *
     * @param  Collection<int, T>  $items
     * @param  Closure(T): string  $name
     * @param  (Closure(T): bool)|null  $first  items for which this is true come first, for example active players
     * @return Collection<int, T>
     */
    public static function sort(Collection $items, Closure $name, ?Closure $first = null): Collection
    {
        return $items
            ->sort(fn ($a, $b) => ($first ? ! $first($a) <=> ! $first($b) : 0) ?: NameOrder::compare($name($a), $name($b)))
            ->values();
    }
}
