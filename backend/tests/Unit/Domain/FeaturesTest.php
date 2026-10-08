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

it('has every feature by default but the Main Event and the house owner\'s buy-in, which a site turns on', function () {
    $off = [Feature::MainEvent, Feature::HouseOwnerBuyIn, Feature::NightDashboard];

    foreach (Feature::cases() as $feature) {
        expect($feature->default())->toBe(! in_array($feature, $off, true));
    }
    foreach ($off as $feature) {
        expect((new Features([$feature->value => true]))->enabled($feature))->toBeTrue();
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
