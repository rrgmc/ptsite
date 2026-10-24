<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveSeasonRecapRequest extends FormRequest
{
    /** The longest text a recap may have, in characters. */
    public const int MAX_BODY = 4000;

    protected function creating(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            /** Plain text: line breaks are kept, nothing else is formatted. */
            'body' => [$this->creating() ? 'required' : 'sometimes', 'string', 'max:'.self::MAX_BODY],
            /** The finished night of this season the recap comes after, if it is about one. */
            'night_id' => ['sometimes', 'nullable', 'integer'],
            /** Published recaps are shown on the season page; a draft only to writers and admins. A new recap is published unless false is sent. */
            'published' => ['sometimes', 'boolean'],
        ];
    }
}
