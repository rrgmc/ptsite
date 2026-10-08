<?php

namespace PTSite\App\Http\Requests;

/**
 * A Main Event's result sent as the list of its players in finishing order: the 1st place first, as many as are
 * known, with no gap.
 */
trait HasMainEventOrder
{
    /** @return array<string, list<mixed>> */
    protected function orderRules(): array
    {
        return [
            /** Player ids in finishing order, the 1st place first. At least one, and nobody twice. */
            'player_ids' => ['present', 'array'],
            'player_ids.*' => ['required', 'integer'],
        ];
    }

    /** @return list<int> */
    public function playerIds(): array
    {
        return array_map(intval(...), array_values($this->validated('player_ids')));
    }
}
