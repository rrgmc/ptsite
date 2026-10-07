<?php

/*
 * Mirrors rule 8 of docs/specs/players.md: lists are alphabetical, ignoring capitals and accents. The API order is
 * covered in tests/Feature/PlayersTest.php.
 */

use PTSite\Domain\Shared\NameOrder;

it('sorts names ignoring capitals and accents, as in the spec example', function () {
    $names = ['Zé', 'breno', 'Élio', 'Carlão'];
    usort($names, NameOrder::compare(...));
    expect($names)->toBe(['breno', 'Carlão', 'Élio', 'Zé']);
});

it('keeps a fixed order for names that differ only in capitals or accents', function () {
    $names = ['dudu', 'Dudú', 'Dudu'];
    usort($names, NameOrder::compare(...));
    expect($names)->toBe(['Dudu', 'Dudú', 'dudu']);
});
