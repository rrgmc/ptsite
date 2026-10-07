<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

/**
 * A picture for a player's photo, sent as multipart/form-data in the field `image`. The limits fit a picture
 * straight from a phone's camera, and keep the image software within the server's memory.
 */
class SavePlayerPhotoRequest extends FormRequest
{
    public const MAX_KILOBYTES = 8 * 1024;

    public const MIN_SIDE = 180;

    public const MAX_SIDE = 4096;

    public function rules(): array
    {
        return [
            'image' => [
                'required',
                File::types(['jpg', 'jpeg', 'png', 'webp'])->max(self::MAX_KILOBYTES),
                Rule::dimensions()
                    ->minWidth(self::MIN_SIDE)->minHeight(self::MIN_SIDE)
                    ->maxWidth(self::MAX_SIDE)->maxHeight(self::MAX_SIDE),
            ],
        ];
    }
}
