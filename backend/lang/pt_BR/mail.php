<?php

// The messages the site sends by email. :site is the site's name.
return [
    'password_reset' => [
        'subject' => ':site: redefinir a senha',
        'one_account' => 'Alguém pediu para redefinir a senha do usuário :username no site :site.',
        'open_link' => 'Abra o link para escolher uma nova senha:',
        'many_accounts' => 'Alguém pediu para redefinir a senha no site :site.',
        'choose_account' => 'Este e-mail está em mais de um acesso. Use o link do usuário que você quer alterar:',
        'expires' => 'O link vale por :minutes minutos e só pode ser usado uma vez.',
        'ignore' => 'Se não foi você, ignore esta mensagem: a senha continua a mesma.',
    ],
];
