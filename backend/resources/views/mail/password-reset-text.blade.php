@if (count($links) === 1)
Alguém pediu para redefinir a senha do usuário {!! $links[0]['username'] !!} no site {!! $site !!}.

Abra o link para escolher uma nova senha:

{!! $links[0]['url'] !!}
@else
Alguém pediu para redefinir a senha no site {!! $site !!}.

Este e-mail está em mais de um acesso. Use o link do usuário que você quer alterar:
@foreach ($links as $link)

{!! $link['username'] !!}:
{!! $link['url'] !!}
@endforeach
@endif

O link vale por {{ $expireMinutes }} minutos e só pode ser usado uma vez.

Se não foi você, ignore esta mensagem: a senha continua a mesma.

{!! $signature !!}
