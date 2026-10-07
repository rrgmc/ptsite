<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use PTSite\App\Support\DatabaseCreator;

abstract class TestCase extends BaseTestCase
{
    private static bool $databaseChecked = false;

    public function createApplication()
    {
        $app = parent::createApplication();

        // Once per run, before RefreshDatabase migrates: the test database may not exist yet.
        if (! self::$databaseChecked) {
            DatabaseCreator::createIfMissing();
            self::$databaseChecked = true;
        }

        return $app;
    }
}
