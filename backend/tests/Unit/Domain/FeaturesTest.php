<?php

/*
 * The features a site can turn off in its site.json (site/README.md, "Features").
 */

use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;

it('gives each feature its default when the site names none', function () {
    $features = new Features;

    foreach (Feature::cases() as $feature) {
        expect($features->enabled($feature))->toBe($feature->default());
    }
});

it('has every feature by default but the Main Event, which a site turns on', function () {
    expect(Feature::MainEvent->default())->toBeFalse()
        ->and((new Features(['mainEvent' => true]))->enabled(Feature::MainEvent))->toBeTrue();

    foreach (Feature::cases() as $feature) {
        if ($feature !== Feature::MainEvent) {
            expect($feature->default())->toBeTrue();
        }
    }
});

it('turns off only the features the site sets to false', function () {
    $features = new Features(['timeChip' => false, 'seasonPlanner' => true]);

    expect($features->enabled(Feature::TimeChip))->toBeFalse()
        ->and($features->enabled(Feature::SeasonPlanner))->toBeTrue()
        ->and($features->enabled(Feature::MainEventPot))->toBeTrue();
});

it('ignores a name it does not know and a value that is not true or false', function () {
    $features = new Features(['bingo' => false, 'timeChip' => 'no', 'mainEventPot' => 0]);

    expect($features->enabled(Feature::TimeChip))->toBeTrue()
        ->and($features->enabled(Feature::MainEventPot))->toBeTrue();
});
