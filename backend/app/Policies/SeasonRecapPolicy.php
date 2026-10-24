<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\SeasonRecap;
use PTSite\App\Models\User;

/** Writers and admins write the season recaps and see the drafts; everyone reads the published ones. */
class SeasonRecapPolicy
{
    public function viewDrafts(User $user): bool
    {
        return $user->canWriteTexts();
    }

    public function create(User $user): bool
    {
        return $user->canWriteTexts();
    }

    public function update(User $user, SeasonRecap $recap): bool
    {
        return $user->canWriteTexts();
    }

    public function delete(User $user, SeasonRecap $recap): bool
    {
        return $user->canWriteTexts();
    }
}
