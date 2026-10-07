<?php

namespace PTSite\App\Support;

use Illuminate\Database\Eloquent\Model;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\User;

/**
 * Records admin and results-keeper changes: who, what, and the values before and after.
 * Called by action classes, the single place where changes happen.
 */
final class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function record(?User $user, string $action, Model $subject, ?array $before, ?array $after): AuditLog
    {
        return AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject->getMorphClass() === $subject::class ? class_basename($subject) : $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'before' => $before,
            'after' => $after,
        ]);
    }
}
