<?php

// The messages the site sends by email. :site is the site's name.
return [
    'password_reset' => [
        'subject' => ':site: reset your password',
        'one_account' => 'Someone asked to reset the password of the user :username on the :site site.',
        'open_link' => 'Open the link to choose a new password:',
        'many_accounts' => 'Someone asked to reset a password on the :site site.',
        'choose_account' => 'This email is on more than one login. Use the link of the user you want to change:',
        'expires' => 'The link works for :minutes minutes and can be used only once.',
        'ignore' => 'If it was not you, ignore this message: the password stays the same.',
    ],
];
