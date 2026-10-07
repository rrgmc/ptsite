# 16. Player photos are cut and resized on the server

- Status: Proposed
- Date: 2026-10-04

## Context

A player has two images: a photo and a thumbnail, the small photo next to the nickname
([players.md](../specs/players.md), rule 9). Until now each was uploaded on its own, and the website cut and
resized the picture in the browser before sending it. The API stored the file as it came, so the server needed no
image software.

That had two problems:

- A player had to send the same picture twice, and the two images could show different pictures.
- The sizes were a rule of the website only. Another client of the API, such as a phone app
  ([0003](0003-api-first.md)), had to cut and resize by itself, and could store any size.

The rule is now: a player changes only the photo, and the thumbnail is made from it.

## Decision

- **The server makes both images from one uploaded picture.** `POST /players/{id}/photo` takes the picture, turns
  it upright, cuts it from the middle to 3 wide by 4 tall, and stores a photo of 600 × 800 pixels and a thumbnail
  of 180 × 240, both as JPEG. `DELETE /players/{id}/photo` removes both. There is no way to change the thumbnail
  alone.
- **Laravel's image component with Intervention Image 4** does the image work (`PTSite\App\Support\PlayerPhotoMaker`).
  The component is part of the framework; Intervention is the library it requires.
- **GD is the default driver**, chosen with `IMAGE_DRIVER` in `.env` (`gd` or `imagick`). The code uses only
  operations that both drivers have. PHP also needs `exif`, to turn a phone's picture upright.
- **Upload limits fit a picture straight from a phone's camera:** JPEG, PNG or WebP, at most 8 MB, and between 180
  and 4096 pixels a side. GD holds about 4 bytes for each pixel, so the pixel limit keeps a 12-megapixel picture
  within PHP's memory.
- **The website still shrinks the picture before sending it**, to at most 1600 pixels a side, without cutting it.
  This keeps the upload small on a phone connection. The cut and the two sizes belong to the server alone.
- **Images that came from an older site stay as they are** until a player sends a new photo. A player with only a thumbnail keeps it.

## Consequences

- The server now needs `gd` (or `imagick`) and `exif`, in development, in CI and on the host. The host must be
  checked before the first deploy with this change ([deployment.md](../architecture/deployment.md)).
- One more dependency, `intervention/image`.
- The two images of a player always show the same picture, and every client gets the same sizes.
- The backend tests make real pictures, so they need `gd` too.
- An upload does image work in the request. A 12-megapixel picture takes well under a second and about 100 MB of
  memory.
- Letting the player choose which part of the picture is kept (an open question in the spec) would now be a
  change to the API: the cut would be sent with the picture.

## Alternatives considered

- **Keep cutting in the browser, and send both sizes in one request.** No image software on the server, but the
  sizes stay a rule that each client must follow, and the server cannot check that the two images show the same
  picture.
- **Keep the two uploads and hide one in the website.** The smallest change, but the API would still let the
  thumbnail change alone, and a failure between the two requests would leave the images out of step.
- **Imagick as the default.** It is often missing on development machines, and has no ready build for PHP on
  Windows. It stays available through `IMAGE_DRIVER`.
- **Plain GD calls, without a library.** Less to install, but turning a picture upright, reading three formats and
  cutting would be our own code to test.
- **Send the raw camera picture, with no shrinking in the browser.** Simpler website code, but uploads of several
  megabytes on a phone connection, and more memory on the server.
