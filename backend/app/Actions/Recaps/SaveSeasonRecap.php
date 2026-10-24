<?php

namespace PTSite\App\Actions\Recaps;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonRecap;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Recaps\SeasonRecapRules;

/**
 * Writes a season recap, or changes one: its text, its night, and whether it is published
 * (docs/specs/season-recaps.md). Writers and admins.
 */
final class SaveSeasonRecap
{
    public function __construct(
        private readonly SeasonRecapRules $rules,
        private readonly Features $features,
        private readonly AuditLogger $audit,
    ) {}

    /** @param array{body?: string, night_id?: ?int, published?: bool} $data */
    public function __invoke(User $user, Season $season, ?SeasonRecap $recap, array $data): SeasonRecap
    {
        $recap === null
            ? Gate::forUser($user)->authorize('create', SeasonRecap::class)
            : Gate::forUser($user)->authorize('update', $recap);

        $publishes = ($data['published'] ?? $recap === null) && $recap?->published_at === null;
        if ($publishes) {
            $this->rules->assertCanPublish($this->features->enabled(Feature::SeasonRecaps));
        }
        if (isset($data['night_id']) && $data['night_id'] !== $recap?->night_id) {
            $night = Night::query()->findOrFail($data['night_id']);
            $this->rules->assertNightFits(
                $night->season_id === $season->id,
                $night->status === 'finished' && ! $night->isArchived(),
                SeasonRecap::query()->where('night_id', $night->id)->exists(),
            );
        }

        return DB::transaction(function () use ($user, $season, $recap, $data, $publishes) {
            $recap ??= new SeasonRecap(['season_id' => $season->id, 'author_user_id' => $user->id]);
            $before = $recap->exists ? $this->snapshot($recap) : null;

            $recap->fill(array_intersect_key($data, array_flip(['body', 'night_id'])));
            if ($publishes) {
                $recap->published_at = now();
            } elseif (($data['published'] ?? null) === false) {
                $recap->published_at = null;
            }
            $recap->save();

            $this->audit->record($user, $before === null ? 'recap.created' : 'recap.updated', $recap, $before, $this->snapshot($recap));

            return $recap;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(SeasonRecap $recap): array
    {
        return [
            'night_id' => $recap->night_id,
            'body' => $recap->body,
            'published' => $recap->published_at !== null,
        ];
    }
}
