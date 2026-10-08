<?php

namespace PTSite\App\Actions\Nights;

use PTSite\App\Models\Season;
use PTSite\Domain\Nights\NightType;

/** Finds a season's Main Event night. A cancelled one does not count. */
final class MainEventNight
{
    /** Locks the rows it finds: call inside the transaction that adds the night. */
    public static function existsIn(Season $season): bool
    {
        return $season->nights()->notArchived()->where('type', NightType::MainEvent->value)->lockForUpdate()->exists();
    }
}
