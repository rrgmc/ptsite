<?php

namespace PTSite\Domain\Recaps;

/**
 * Each player's rebuys and time chips on one night, as the night dashboard recorded them (docs/specs/season-recaps.md,
 * "Digest"). The time chip pays for the league's year party, so the recaps can say who is paying for it.
 */
final class MoneyTally
{
    /**
     * @param  array<int, int>  $rebuys  player id => the rebuys the player made
     * @param  list<int>  $late  the players who arrived late and owed a time chip
     * @param  int  $rebuysAllowed  the rebuys a player may make before the next ones are past the limit
     * @param  bool  $rebuyChargesTimeChip  whether a rebuy also charges a time chip
     * @param  bool  $timeChip  whether the site has the time chip at all
     * @return array<int, PlayerMoneyLine> by player id
     */
    public function night(array $rebuys, array $late, int $rebuysAllowed, bool $rebuyChargesTimeChip, bool $timeChip): array
    {
        $lines = [];
        foreach (array_unique([...array_keys($rebuys), ...$late]) as $playerId) {
            $count = $rebuys[$playerId] ?? 0;
            $isLate = $timeChip && in_array($playerId, $late, true);
            $lines[$playerId] = new PlayerMoneyLine(
                $playerId,
                $count,
                max(0, $count - $rebuysAllowed),
                $isLate ? 1 : 0,
                $timeChip ? ($isLate ? 1 : 0) + ($rebuyChargesTimeChip ? $count : 0) : 0,
            );
        }

        return $lines;
    }

    /**
     * @param  list<array<int, PlayerMoneyLine>>  $nights  the result of night() for each night
     * @return array<int, PlayerMoneyLine> by player id
     */
    public function add(array $nights): array
    {
        $total = [];
        foreach ($nights as $night) {
            foreach ($night as $playerId => $line) {
                $total[$playerId] = isset($total[$playerId]) ? $total[$playerId]->plus($line) : $line;
            }
        }

        return $total;
    }
}
