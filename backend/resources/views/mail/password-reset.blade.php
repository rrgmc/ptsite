<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>{{ $site }}: redefinir a senha</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a1a;">
@if (count($links) === 1)
    <p>Alguém pediu para redefinir a senha do usuário <strong>{{ $links[0]['username'] }}</strong> no site {{ $site }}.</p>
    <p>Abra o link para escolher uma nova senha:</p>
    <p><a href="{{ $links[0]['url'] }}">{{ $links[0]['url'] }}</a></p>
@else
    <p>Alguém pediu para redefinir a senha no site {{ $site }}.</p>
    <p>Este e-mail está em mais de um acesso. Use o link do usuário que você quer alterar:</p>
    @foreach ($links as $link)
        <p><strong>{{ $link['username'] }}</strong>:<br><a href="{{ $link['url'] }}">{{ $link['url'] }}</a></p>
    @endforeach
@endif
    <p>O link vale por {{ $expireMinutes }} minutos e só pode ser usado uma vez.</p>
    <p>Se não foi você, ignore esta mensagem: a senha continua a mesma.</p>
    <p>{{ $signature }}</p>
</body>
</html>
