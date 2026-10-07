<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use PTSite\App\Actions\Places\SavePlace;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\SavePlaceRequest;
use PTSite\App\Http\Requests\UpdatePlaceRequest;
use PTSite\App\Http\Resources\PlaceResource;
use PTSite\App\Models\Place;
use PTSite\App\Queries\SortByName;

class PlaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return PlaceResource::collection(SortByName::sort(Place::query()
            ->when(! ($request->boolean('archived') && $request->user()->isAdmin()), fn ($q) => $q->notArchived())
            ->get(), fn (Place $p) => $p->name));
    }

    public function store(SavePlaceRequest $request, SavePlace $save): JsonResponse
    {
        return (new PlaceResource($save($request->user(), null, $request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdatePlaceRequest $request, Place $place, SavePlace $save): PlaceResource
    {
        return new PlaceResource($save($request->user(), $place, $request->validated()));
    }
}
