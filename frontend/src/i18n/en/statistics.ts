import type { Messages } from '..'

export const statistics: Messages['statistics'] = {
  title: 'Statistics',
  noSeason: 'No seasons yet.',
  allSeasons: 'All seasons',
  noNights: 'No finished nights yet.',

  // Top ten lists
  totalPoints: 'Total Points',
  totalPointsCaption: 'Players by total points',
  nightsScored: 'Nights Scored',
  nightsScoredCaption: 'Players by nights where they scored',
  biggestPots: 'Biggest Pots',
  biggestPotsCaption: 'Nights by pot',
  places: 'Places',
  noPlaces: 'No nights with a place.',
  placesCaption: 'Places by number of nights',
  positionTitle: ({ position }) => `Position: ${position}`,
  positionCaption: ({ position }) => `Players by times finishing ${position}`,
  times: 'Times',

  // The Main Events of every season, on a site that has the Main Event
  mainEventTitles: 'Main Event: Titles',
  mainEventTitlesCaption: 'Players by Main Events won',
  mainEventPodiums: 'Main Event: Podiums',
  mainEventPodiumsCaption: 'Players by times in the first three of a Main Event',
  mainEventAppearances: 'Main Event: Appearances',
  mainEventAppearancesCaption: 'Players by Main Events played',

  // Charts
  pointsProgress: 'Accumulated points',
  viewTable: 'View data as a table',
  legend: 'Legend',
  wins: 'Wins',
  others: 'Others',
  othersCount: ({ count }) => `Others: ${count}`,
  winsByPlayer: 'Wins by player',
  pointsProgressDescription: ({ count, perSeason, leader }) =>
    `Line chart: accumulated points of the ${count} players with most points, by ${perSeason ? 'season' : 'night'}.${leader ? ` ${leader} leads.` : ''} The numbers are in the table below.`,
  pointsProgressCaption: ({ perSeason }) => `Accumulated points by ${perSeason ? 'season' : 'night'}`,
  winsDescription: ({ top }) =>
    `Bar chart: wins by player.${top ? ` ${top.nickname} has the most: ${top.wins}.` : ''} The numbers are in the table below.`,

  // One player's charts
  positions: 'Positions',
  playerPointsDescription: ({ nickname, perSeason, total }) =>
    `Line chart: accumulated points of ${nickname}, by ${perSeason ? 'season' : 'night'}.${total ? ` Reaches ${total}.` : ''} The numbers are in the table below.`,
  playerPointsCaption: ({ nickname, perSeason }) => `Accumulated points of ${nickname} by ${perSeason ? 'season' : 'night'}`,
  playerPositionsDescription: ({ nickname, best }) =>
    `Bar chart: times ${nickname} finished in each position.${best ? ` The most frequent is ${best.label}: ${best.count}.` : ''} The numbers are in the table below.`,
  playerPositionsCaption: ({ nickname }) => `Times ${nickname} finished in each position`,
}
