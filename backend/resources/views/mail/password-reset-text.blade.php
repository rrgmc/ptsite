@if (count($links) === 1)
{!! __('mail.password_reset.one_account', ['username' => $links[0]['username'], 'site' => $site]) !!}

{!! __('mail.password_reset.open_link') !!}

{!! $links[0]['url'] !!}
@else
{!! __('mail.password_reset.many_accounts', ['site' => $site]) !!}

{!! __('mail.password_reset.choose_account') !!}
@foreach ($links as $link)

{!! $link['username'] !!}:
{!! $link['url'] !!}
@endforeach
@endif

{!! __('mail.password_reset.expires', ['minutes' => $expireMinutes]) !!}

{!! __('mail.password_reset.ignore') !!}

{!! $signature !!}
