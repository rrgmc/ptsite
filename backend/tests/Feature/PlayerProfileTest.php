<?php

/*
 * A player's own profile and the players' images, following docs/specs/players.md (rules 9 and 10).
 */

use Illuminate\Http\UploadedFile;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Enums\PlayerImageKind;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;

/** A picture of the given size, grey unless $paint draws on it. */
function pictureUpload(int $width, int $height, ?callable $paint = null, string $format = 'jpeg'): UploadedFile
{
    $picture = imagecreatetruecolor($width, $height);
    imagefill($picture, 0, 0, 0x808080);
    if ($paint) {
        $paint($picture);
    }
    ob_start();
    $format === 'png' ? imagepng($picture) : imagejpeg($picture, null, 95);

    return UploadedFile::fake()->createWithContent("foto.{$format}", (string) ob_get_clean());
}

function uploadPhoto(Player $player, UploadedFile $picture): TestResponse
{
    return test()->post("/api/v1/players/{$player->id}/photo", ['image' => $picture], ['Accept' => 'application/json']);
}

/** The width, height and type of the image the API serves. */
function servedSize(Player $player, string $kind): array
{
    $size = getimagesizefromstring(test()->get("/api/v1/players/{$player->id}/{$kind}")->assertOk()->getContent());

    return [$size[0], $size[1], $size['mime']];
}

/** The name of the colour at one point of the image the API serves. JPEG changes colours a little. */
function servedColour(Player $player, string $kind, int $x, int $y): string
{
    $image = imagecreatefromstring(test()->get("/api/v1/players/{$player->id}/{$kind}")->assertOk()->getContent());
    $rgb = imagecolorat($image, $x, $y);
    $bright = fn (int $shift) => (($rgb >> $shift) & 0xFF) > 127 ? '1' : '0';

    return ['100' => 'red', '010' => 'green', '001' => 'blue', '111' => 'white', '000' => 'black'][$bright(16).$bright(8).$bright(0)] ?? 'other';
}

/** A real PNG of the given size, all black, made by hand: it costs no memory, whatever its size. */
function pngUpload(int $width, int $height, string $name = 'foto.png'): UploadedFile
{
    $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
    // One bit per pixel, all black: each row is a filter byte and the pixels.
    $rows = str_repeat("\0".str_repeat("\0", intdiv($width + 7, 8)), $height);
    $png = "\x89PNG\r\n\x1a\n"
        .$chunk('IHDR', pack('NNCCCCC', $width, $height, 1, 0, 0, 0, 0))
        .$chunk('IDAT', gzcompress($rows))
        .$chunk('IEND', '');

    return UploadedFile::fake()->createWithContent($name, $png);
}

function playerWithLogin(string $nickname): array
{
    $player = Player::factory()->create(['nickname' => $nickname]);

    return [$player, User::factory()->create(['player_id' => $player->id])];
}

it('lets a player change their own nickname, name, email and birthday', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    $this->patchJson("/api/v1/players/{$ana->id}", [
        'nickname' => 'Aninha', 'name' => 'Ana Souza', 'email' => 'ana@example.com', 'birth_date' => '1990-05-17',
    ])->assertOk()
        ->assertJsonPath('data.nickname', 'Aninha')
        ->assertJsonPath('data.name', 'Ana Souza')
        ->assertJsonPath('data.email', 'ana@example.com')
        ->assertJsonPath('data.birth_date', '1990-05-17');

    expect(AuditLog::query()->where('action', 'player.updated')->where('user_id', $login->id)->count())->toBe(1);
});

it('does not let a player take a nickname that is in use', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Player::factory()->create(['nickname' => 'Breno']);
    Sanctum::actingAs($login);

    $this->patchJson("/api/v1/players/{$ana->id}", ['nickname' => 'breno'])
        ->assertStatus(422)->assertJsonPath('rule', 'player.nickname_taken');
});

it('does not let a player change their own status or archive themself', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    $this->patchJson("/api/v1/players/{$ana->id}", ['status' => 'inactive'])->assertForbidden();
    $this->patchJson("/api/v1/players/{$ana->id}", ['archived' => true])->assertForbidden();
    // Nothing is saved when a forbidden field comes with allowed ones.
    $this->patchJson("/api/v1/players/{$ana->id}", ['name' => 'Ana Souza', 'status' => 'inactive'])->assertForbidden();
    expect($ana->refresh()->name)->not->toBe('Ana Souza');
});

it('does not let a player write their own memo', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    $this->patchJson("/api/v1/players/{$ana->id}", ['memo' => 'A melhor da mesa.'])->assertForbidden();
    $this->patchJson("/api/v1/players/{$ana->id}", ['name' => 'Ana Souza', 'memo' => 'A melhor da mesa.'])->assertForbidden();
    expect($ana->refresh()->memo)->toBeNull()
        ->and($ana->name)->not->toBe('Ana Souza');
});

it('does not let a player change another player', function () {
    [, $login] = playerWithLogin('Ana');
    $breno = Player::factory()->create(['nickname' => 'Breno']);
    Sanctum::actingAs($login);

    $this->patchJson("/api/v1/players/{$breno->id}", ['name' => 'Outro'])->assertForbidden();
    $this->post("/api/v1/players/{$breno->id}/photo", ['image' => pngUpload(600, 800)], ['Accept' => 'application/json'])->assertForbidden();
    $this->deleteJson("/api/v1/players/{$breno->id}/photo")->assertForbidden();
});

it('makes the photo and the thumbnail from one uploaded picture', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    $first = uploadPhoto($ana, pictureUpload(1200, 1600))->assertOk()->json('data');
    expect($first['photo_version'])->toBeString()
        ->and($first['thumbnail_version'])->toBeString()
        ->and($ana->images()->count())->toBe(2);

    $this->get("/api/v1/players/{$ana->id}/photo?v={$first['photo_version']}")->assertOk()->assertHeader('Content-Type', 'image/jpeg');
    expect(servedSize($ana, 'photo'))->toBe([600, 800, 'image/jpeg'])
        ->and(servedSize($ana, 'thumbnail'))->toBe([180, 240, 'image/jpeg']);

    // Another picture gives other versions, so browsers ask for the images again.
    $second = uploadPhoto($ana, pictureUpload(1200, 1600, fn ($picture) => imagefill($picture, 0, 0, 0x336699)))->assertOk()->json('data');
    expect($second['photo_version'])->not->toBe($first['photo_version'])
        ->and($second['thumbnail_version'])->not->toBe($first['thumbnail_version'])
        ->and($ana->images()->count())->toBe(2);

    // One log entry for each upload, with both versions.
    $saved = AuditLog::query()->where('action', 'player.image_saved')->orderBy('id')->get();
    $versions = fn (array $data) => ['thumbnail_version' => $data['thumbnail_version'], 'photo_version' => $data['photo_version']];
    expect($saved)->toHaveCount(2)
        ->and($saved[0]->before)->toEqual(['thumbnail_version' => null, 'photo_version' => null])
        ->and($saved[1]->before)->toEqual($versions($first))
        ->and($saved[1]->after)->toEqual($versions($second));
});

it('keeps the middle of a picture of another shape', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    // Red, green and blue bands side by side: a 3 by 4 cut from the middle is 600 pixels wide, all of it green.
    uploadPhoto($ana, pictureUpload(1600, 800, function ($picture) {
        imagefilledrectangle($picture, 0, 0, 499, 799, 0xFF0000);
        imagefilledrectangle($picture, 500, 0, 1099, 799, 0x00FF00);
        imagefilledrectangle($picture, 1100, 0, 1599, 799, 0x0000FF);
    }))->assertOk();

    expect(servedSize($ana, 'photo'))->toBe([600, 800, 'image/jpeg']);
    foreach ([[10, 400], [300, 400], [590, 400]] as [$x, $y]) {
        expect(servedColour($ana, 'photo', $x, $y))->toBe('green');
    }
    expect(servedColour($ana, 'thumbnail', 5, 120))->toBe('green')
        ->and(servedColour($ana, 'thumbnail', 175, 120))->toBe('green');
});

it('turns a picture upright before cutting it', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    // A phone held upright stores the picture lying down, and says so: its top band is the right side of the photo.
    $lyingDown = pictureUpload(800, 600, function ($picture) {
        imagefill($picture, 0, 0, 0x0000FF);
        imagefilledrectangle($picture, 0, 0, 799, 199, 0xFF0000);
    })->getContent();
    $orientation = "Exif\0\0MM\0\x2A\0\0\0\x08\0\x01\x01\x12\0\x03\0\0\0\x01\0\x06\0\0\0\0\0\0";
    $upright = substr($lyingDown, 0, 2)."\xFF\xE1".pack('n', strlen($orientation) + 2).$orientation.substr($lyingDown, 2);

    uploadPhoto($ana, UploadedFile::fake()->createWithContent('celular.jpg', $upright))->assertOk();

    expect(servedSize($ana, 'photo'))->toBe([600, 800, 'image/jpeg'])
        ->and(servedColour($ana, 'photo', 590, 400))->toBe('red')
        ->and(servedColour($ana, 'photo', 10, 400))->toBe('blue');
});

it('enlarges a small picture, and makes see-through parts white', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    uploadPhoto($ana, pictureUpload(206, 274, format: 'png'))->assertOk();
    expect(servedSize($ana, 'photo'))->toBe([600, 800, 'image/jpeg'])
        ->and(servedSize($ana, 'thumbnail'))->toBe([180, 240, 'image/jpeg']);

    uploadPhoto($ana, pictureUpload(300, 400, function ($picture) {
        imagealphablending($picture, false);
        imagesavealpha($picture, true);
        imagefill($picture, 0, 0, imagecolorallocatealpha($picture, 0, 0, 0, 127));
    }, 'png'))->assertOk();
    expect(servedColour($ana, 'photo', 300, 400))->toBe('white');
});

it('removes the photo and the thumbnail together', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);
    $versions = uploadPhoto($ana, pictureUpload(600, 800))->assertOk()->json('data');

    $this->deleteJson("/api/v1/players/{$ana->id}/photo")->assertOk()
        ->assertJsonPath('data.photo_version', null)->assertJsonPath('data.thumbnail_version', null);
    $this->getJson("/api/v1/players/{$ana->id}/photo")->assertNotFound();
    $this->getJson("/api/v1/players/{$ana->id}/thumbnail")->assertNotFound();
    expect($ana->images()->count())->toBe(0);

    // Removing images that are not there changes nothing.
    $this->deleteJson("/api/v1/players/{$ana->id}/photo")->assertOk();
    $removed = AuditLog::query()->where('action', 'player.image_removed')->get();
    expect($removed)->toHaveCount(1)
        ->and($removed[0]->before)->toEqual(['thumbnail_version' => $versions['thumbnail_version'], 'photo_version' => $versions['photo_version']])
        ->and($removed[0]->after)->toEqual(['thumbnail_version' => null, 'photo_version' => null]);
});

it('replaces or removes an imported thumbnail that has no photo', function () {
    $withOldThumbnail = function (string $nickname): array {
        [$player, $login] = playerWithLogin($nickname);
        $old = pictureUpload(46, 60, format: 'png')->getContent();
        $player->images()->create(['kind' => PlayerImageKind::Thumbnail, 'mime_type' => 'image/png', 'image' => $old]);
        $player->forceFill(['thumbnail_version' => 'imported'])->save();

        return [$player, $login];
    };

    [$ana, $anaLogin] = $withOldThumbnail('Ana');
    Sanctum::actingAs($anaLogin);
    uploadPhoto($ana, pictureUpload(600, 800))->assertOk();
    expect($ana->images()->count())->toBe(2)
        ->and(servedSize($ana, 'thumbnail'))->toBe([180, 240, 'image/jpeg']);

    [$breno, $brenoLogin] = $withOldThumbnail('Breno');
    Sanctum::actingAs($brenoLogin);
    $this->deleteJson("/api/v1/players/{$breno->id}/photo")->assertOk()->assertJsonPath('data.thumbnail_version', null);
    expect($breno->images()->count())->toBe(0);
});

it('lets an admin upload and remove any player\'s photo', function () {
    $breno = Player::factory()->create(['nickname' => 'Breno']);
    Sanctum::actingAs(User::factory()->admin()->create());

    uploadPhoto($breno, pictureUpload(600, 800))->assertOk();
    $this->deleteJson("/api/v1/players/{$breno->id}/photo")->assertOk()->assertJsonPath('data.photo_version', null);
});

it('refuses uploads that are not pictures, or are too large or too small', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    uploadPhoto($ana, UploadedFile::fake()->createWithContent('notas.txt', 'not an image'))
        ->assertStatus(422)->assertJsonPath('errors.image.0', 'A imagem deve ser um arquivo do tipo: jpg, jpeg, png, webp.');
    foreach ([pngUpload(4100, 200), pngUpload(200, 100)] as $wrongSize) {
        uploadPhoto($ana, $wrongSize)
            ->assertStatus(422)->assertJsonPath('errors.image.0', 'A imagem deve ter entre 180 e 4096 pixels de cada lado.');
    }
    uploadPhoto($ana, UploadedFile::fake()->createWithContent('grande.png', pngUpload(600, 800)->getContent().str_repeat('x', 8200 * 1024)))
        ->assertStatus(422)->assertJsonPath('errors.image.0', 'A imagem não pode ter mais de 8192 kB.');
    $this->postJson("/api/v1/players/{$ana->id}/photo", [])->assertStatus(422);

    // A file that says it is a PNG of the right size, but holds no picture.
    $broken = pngUpload(600, 800)->getContent();
    $broken = substr($broken, 0, 41).str_repeat('x', 20).substr($broken, 61);
    uploadPhoto($ana, UploadedFile::fake()->createWithContent('quebrada.png', $broken))
        ->assertStatus(422)->assertJsonPath('rule', 'player.photo.unreadable')
        ->assertJsonPath('errors.image.0', 'Não foi possível ler esta imagem. Envie outra foto em JPEG, PNG ou WebP.');

    expect($ana->refresh()->photo_version)->toBeNull()
        ->and($ana->images()->count())->toBe(0);
});

it('has no way to change the thumbnail alone', function () {
    [$ana, $login] = playerWithLogin('Ana');
    Sanctum::actingAs($login);

    $this->post("/api/v1/players/{$ana->id}/thumbnail", ['image' => pngUpload(180, 240)], ['Accept' => 'application/json'])->assertStatus(405);
    $this->deleteJson("/api/v1/players/{$ana->id}/thumbnail")->assertStatus(405);
});
