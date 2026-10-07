<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <title>{{ __('mail.password_reset.subject', ['site' => $site]) }}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a1a;">
@if (count($links) === 1)
    {{-- The values are escaped here, because the user's name goes in bold inside the sentence. --}}
    <p>{!! __('mail.password_reset.one_account', ['username' => '<strong>'.e($links[0]['username']).'</strong>', 'site' => e($site)]) !!}</p>
    <p>{{ __('mail.password_reset.open_link') }}</p>
    <p><a href="{{ $links[0]['url'] }}">{{ $links[0]['url'] }}</a></p>
@else
    <p>{{ __('mail.password_reset.many_accounts', ['site' => $site]) }}</p>
    <p>{{ __('mail.password_reset.choose_account') }}</p>
    @foreach ($links as $link)
        <p><strong>{{ $link['username'] }}</strong>:<br><a href="{{ $link['url'] }}">{{ $link['url'] }}</a></p>
    @endforeach
@endif
    <p>{{ __('mail.password_reset.expires', ['minutes' => $expireMinutes]) }}</p>
    <p>{{ __('mail.password_reset.ignore') }}</p>
    <p>{{ $signature }}</p>
</body>
</html>
