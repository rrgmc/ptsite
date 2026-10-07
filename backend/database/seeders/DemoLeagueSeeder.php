<?php

namespace PTSite\Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PTSite\App\Actions\Nights\WriteNightResult;
use PTSite\App\Enums\PlayerImageKind;
use PTSite\App\Enums\Role;
use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\PlayerImage;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;
use PTSite\App\Support\PlayerPhotoMaker;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * An invented league for development, the end-to-end tests and the screenshots: places, players and four
 * seasons of finished nights. Every run gives the same data: the dates are fixed and the random numbers come
 * from a fixed seed. Never run in production.
 */
class DemoLeagueSeeder extends Seeder
{
    /**
     * The players are named after champions of the World Series of Poker Main Event: names anyone who plays
     * knows, and that cannot be taken for a member of a real league. Only their names are real. The results,
     * the dates and the drawn pictures here are invented.
     */
    private const PLAYERS = [
        // nickname, name, email, has a picture
        ['Aldemir', 'Koray Aldemir', 'aldemir@example.org', true],
        ['Blumstein', 'Scott Blumstein', null, false],
        ['Brunson', 'Doyle Brunson', 'brunson@example.org', true],
        ['Cada', 'Cada', null, true],
        ['Chan', 'Johnny Chan', null, false],
        ['Duhamel', 'Jonathan Duhamel', 'duhamel@example.org', true],
        ['Eastgate', null, null, false],
        ['Ensan', 'Hossein Ensan', null, true],
        ['Hachem', 'Joe Hachem', 'hachem@example.org', false],
        ['Heinz', 'Pius Heinz', null, false],
        ['Hellmuth', 'Phil Hellmuth', null, true],
        ['Jacobson', 'Martin Jacobson', 'jacobson@example.org', false],
        ['Merson', 'merson', null, false],
        ['Moneymaker', 'Chris Moneymaker', 'moneymaker@example.org', true],
        ['Nguyen', 'Qui Nguyen', null, false],
        ['Raymer', 'Greg Raymer', null, true],
        ['Ungar', 'Stu Ungar', null, false],
        ['Yang', 'Jerry Yang', null, false],
    ];

    /** Players who only played the first season and are on a break. */
    private const INACTIVE = ['Ungar', 'Yang'];

    /** Fridays of 2022 with no night: Carnival, Good Friday and the days after Tiradentes and Corpus Christi. */
    private const NO_NIGHT = ['2022-02-25', '2022-04-15', '2022-04-22', '2022-06-17'];

    private Randomizer $random;

    public function __construct(private readonly WriteNightResult $writeResult, private readonly PlayerPhotoMaker $photos) {}

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('The demo seeder does not run in production.');

            return;
        }

        $this->random = new Randomizer(new Mt19937(2026));

        DB::transaction(function () {
            $club = Place::query()->create(['name' => 'Clube Central', 'address' => 'Rua das Cartas, 100']);
            $hall = Place::query()->create(['name' => 'Salão Norte', 'address' => 'Avenida do Baralho, 21']);
            Place::query()->create(['name' => 'Casa Sul']);

            $players = $this->players();

            // The first night of all has a description written as HTML, as an older site could have left it.
            $this->season('Liga 2019', '2019-01-04', '21:00', 2, 26, $hall, array_slice($players, 0, 12), finished: true, firstDescription: '<p>Noite 9</p>');
            $this->season('Liga 2022', '2022-01-07', '21:30', 1, 24, $club, array_slice($players, 0, 14), finished: true);
            $this->season('Liga 2025', '2025-03-07', '21:30', 2, 20, $club, array_slice($players, 0, 16), finished: true);
            $this->season('Liga 2026-2027', '2026-04-10', '21:30', 2, 12, $club, array_slice($players, 0, 16), finished: false);

            // The first player of the list has a login of their own, as most players of a real league do.
            User::query()->create([
                'username' => 'aldemir', 'name' => 'Aldemir', 'password' => 'password', 'role' => Role::Player,
                'is_enabled' => true, 'player_id' => $players[0],
            ]);

            Player::query()->whereIn('nickname', self::INACTIVE)->update(['status' => 'inactive']);
            Player::query()->create(['nickname' => 'Duplicado', 'status' => 'inactive'])->forceFill(['archived_at' => now()])->save();
        });
    }

    /** @return list<int> player ids, in the order of the list above */
    private function players(): array
    {
        $ids = [];
        foreach (self::PLAYERS as $index => [$nickname, $name, $email, $hasPhoto]) {
            $player = Player::query()->create([
                'nickname' => $nickname,
                'name' => $name,
                'email' => $email,
                'birth_date' => sprintf('%d-%02d-%02d', 1970 + $index, 1 + $index % 12, 1 + ($index * 7) % 28),
                'memo' => $nickname === 'Moneymaker' ? 'Campeão do Main Event da WSOP de 2003.' : null,
                'status' => 'active',
            ]);
            if ($hasPhoto) {
                $this->photo($player, $index);
            }
            $ids[] = $player->id;
        }

        return $ids;
    }

    /** A drawn picture, not a photo of anyone: a colored background with a lighter circle and shoulders. */
    private function photo(Player $player, int $index): void
    {
        $picture = imagecreatetruecolor(300, 400);
        $hue = [[20, 83, 45], [30, 64, 175], [154, 52, 18], [91, 33, 182], [15, 118, 110], [159, 18, 57], [63, 98, 18], [55, 65, 81]][$index % 8];
        imagefill($picture, 0, 0, imagecolorallocate($picture, ...$hue));
        $light = imagecolorallocate($picture, 240, 240, 235);
        imagefilledellipse($picture, 150, 150, 130, 150, $light);
        imagefilledellipse($picture, 150, 400, 260, 300, $light);
        ob_start();
        imagepng($picture);
        $png = (string) ob_get_clean();

        foreach ($this->photos->make($png) as $kind => $image) {
            PlayerImage::query()->create(['player_id' => $player->id, 'kind' => $kind, 'mime_type' => 'image/jpeg', 'image' => $image]);
            $player->forceFill([PlayerImageKind::from($kind)->versionColumn() => substr(sha1($image), 0, 16)]);
        }
        $player->save();
    }

    /**
     * A season with all its nights finished, on Fridays.
     *
     * @param  list<int>  $players  the ids of those who play this season
     */
    private function season(string $name, string $startsOn, string $time, int $everyWeeks, int $nights, Place $place, array $players, bool $finished, ?string $firstDescription = null): void
    {
        $season = Season::query()->create([
            'name' => $name,
            'starts_on' => $startsOn,
            'default_place_id' => $place->id,
            'buy_in' => '50.00',
            'is_open' => ! $finished,
            'is_finished' => $finished,
            'schedule_weekday' => 5,
            'schedule_time' => $time,
            'schedule_every_weeks' => $everyWeeks,
            'rounds' => 26,
        ]);
        foreach ([1 => 38, 2 => 23, 3 => 15, 4 => 11, 5 => 8, 6 => 5] as $position => $percent) {
            $season->percentages()->create(['position' => $position, 'percent' => $percent]);
        }

        $day = CarbonImmutable::parse("{$startsOn} {$time}");
        for ($played = 0; $played < $nights; $day = $day->addWeeks($everyWeeks)) {
            if (in_array($day->toDateString(), self::NO_NIGHT, true)) {
                continue;
            }
            $night = Night::query()->create([
                'season_id' => $season->id,
                'starts_at' => $day,
                'place_id' => $place->id,
                'description' => $played === 0 ? $firstDescription : null,
                'status' => 'open',
            ]);
            $this->finish($night, $players);
            $played++;
        }
    }

    /** @param list<int> $players */
    private function finish(Night $night, array $players): void
    {
        $present = $this->random->getInt(8, count($players));
        $rebuys = $this->random->getInt(0, 6);
        $order = array_slice($this->random->shuffleArray($players), 0, 6);

        ($this->writeResult)(
            $night,
            pot: number_format(($present + $rebuys) * 50, 2, '.', ''),
            mainEventPot: number_format($present * 10, 2, '.', ''),
            timeChip: number_format($rebuys * 5, 2, '.', ''),
            playerByPosition: array_combine(range(1, 6), $order),
        );
    }
}
