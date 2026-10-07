<?php

namespace PTSite\App\Http\Requests;

/**
 * Finishing order sent as a list of {position, player_id}; the actions take a position => player id map.
 */
trait HasPositions
{
    /**
     * @param  bool  $required  false lets the list be empty, for a partial result
     * @return array<string, list<mixed>>
     */
    protected function positionRules(bool $required = true): array
    {
        return [
            'positions' => $required ? ['required', 'array', 'min:1', 'max:20'] : ['present', 'array', 'max:20'],
            'positions.*.position' => ['required', 'integer', 'min:1', 'max:20', 'distinct'],
            'positions.*.player_id' => ['required', 'integer'],
        ];
    }

    /** @return array<int, int> */
    public function playerByPosition(): array
    {
        $map = [];
        foreach ($this->validated('positions') as $item) {
            $map[(int) $item['position']] = (int) $item['player_id'];
        }
        ksort($map);

        return $map;
    }
}
