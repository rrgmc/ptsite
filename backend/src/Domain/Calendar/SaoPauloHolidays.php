<?php

namespace PTSite\Domain\Calendar;

use PTSite\Domain\Calendar\HolidayScope as Scope;

/**
 * A holiday preset: Brazil's national holidays plus those of the city and state of São Paulo, and Christmas Eve
 * and New Year's Eve, when a league usually does not play.
 */
final class SaoPauloHolidays implements HolidayPreset
{
    /** @return list<HolidayRule> each with a stable slug as its key */
    public static function rules(): array
    {
        return [
            HolidayRule::fixed('confraternizacao', 'Confraternização Universal', Scope::National, 1, 1),
            HolidayRule::fixed('aniversario-sao-paulo', 'Aniversário de São Paulo', Scope::City, 1, 25),
            HolidayRule::easter('carnaval-segunda', 'Carnaval (segunda-feira)', Scope::National, -48),
            HolidayRule::easter('carnaval-terca', 'Carnaval', Scope::National, -47),
            HolidayRule::easter('sexta-feira-santa', 'Sexta-feira Santa', Scope::National, -2),
            HolidayRule::fixed('tiradentes', 'Tiradentes', Scope::National, 4, 21),
            HolidayRule::fixed('dia-do-trabalho', 'Dia do Trabalho', Scope::National, 5, 1),
            HolidayRule::easter('corpus-christi', 'Corpus Christi', Scope::City, 60),
            HolidayRule::fixed('revolucao-constitucionalista', 'Revolução Constitucionalista', Scope::State, 7, 9),
            HolidayRule::fixed('independencia', 'Independência do Brasil', Scope::National, 9, 7),
            HolidayRule::fixed('nossa-senhora-aparecida', 'Nossa Senhora Aparecida', Scope::National, 10, 12),
            HolidayRule::fixed('finados', 'Finados', Scope::National, 11, 2),
            HolidayRule::fixed('proclamacao-da-republica', 'Proclamação da República', Scope::National, 11, 15),
            HolidayRule::fixed('consciencia-negra-sao-paulo', 'Consciência Negra', Scope::City, 11, 20, lastYear: 2023),
            HolidayRule::fixed('consciencia-negra', 'Consciência Negra', Scope::National, 11, 20, firstYear: 2024),
            // Not official holidays, but a league usually does not play on them.
            HolidayRule::fixed('vespera-de-natal', 'Véspera de Natal', Scope::National, 12, 24),
            HolidayRule::fixed('natal', 'Natal', Scope::National, 12, 25),
            HolidayRule::fixed('vespera-de-ano-novo', 'Véspera de Ano Novo', Scope::National, 12, 31),
        ];
    }
}
