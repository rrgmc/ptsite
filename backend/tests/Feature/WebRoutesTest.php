<?php

it('sends the site root to the app', function () {
    $this->get('/')->assertRedirect('/app/');
});

it('returns JSON 404 for unknown API URLs instead of the app', function () {
    $this->getJson('/api/v1/nope')->assertNotFound();
});

it('answers 401 in JSON to a logged-out API request, also when it does not ask for JSON', function () {
    // There is no "login" route to redirect to: the app has its own login page.
    $this->get('/api/v1/seasons/current')->assertUnauthorized()->assertJson(['message' => 'Unauthenticated.']);
    $this->getJson('/api/v1/seasons/current')->assertUnauthorized();
});
