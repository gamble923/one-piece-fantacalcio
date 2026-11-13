
import Link from "next/link";
import {supabaseServer} from "../lib/supabase/server";

function standings(teams, matches) {
  const table = Object.fromEntries(
    teams.map(team => [
      team.id,
      {...team, points: 0, scored: 0, played: 0}
    ])
  );

  const directMatches = new Map();

  for (const match of matches) {
    if (match.home_score == null || match.away_score == null) {
      continue;
    }

    const home = table[match.home_team_id];
    const away = table[match.away_team_id];

    if (!home || !away) continue;

    const homeScore = Number(match.home_score);
    const awayScore = Number(match.away_score);

    home.played++;
    away.played++;
    home.scored += homeScore;
    away.scored += awayScore;

    if (homeScore > awayScore) {
      home.points += 3;
    } else if (awayScore > homeScore) {
      away.points += 3;
    } else {
      home.points++;
      away.points++;
    }

    const key = [home.id, away.id].sort().join("|");
    directMatches.set(key, match);
  }

  function fallback(a, b) {
    return (
      b.scored - a.scored ||
      a.name.localeCompare(b.name, "it") ||
      a.id.localeCompare(b.id)
    );
  }

  const groups = new Map();

  for (const team of Object.values(table)) {
    if (!groups.has(team.points)) {
      groups.set(team.points, []);
    }
    groups.get(team.points).push(team);
  }

  const result = [];

  for (const points of [...groups.keys()].sort((a, b) => b - a)) {
    const group = groups.get(points);

    if (group.length === 2) {
      const [a, b] = group;
      const key = [a.id, b.id].sort().join("|");
      const match = directMatches.get(key);

      if (match) {
        const homeScore = Number(match.home_score);
        const awayScore = Number(match.away_score);

        if (homeScore !== awayScore) {
          const winnerId =
            homeScore > awayScore
              ? match.home_team_id
              : match.away_team_id;

          group.sort((x, y) => {
            if (x.id === winnerId) return -1;
            if (y.id === winnerId) return 1;
            return 0;
          });
        } else {
          group.sort(fallback);
        }
      } else {
        group.sort(fallback);
      }
    } else {
      group.sort(fallback);
    }

    result.push(...group);
  }

  return result;
}

export default async function Home() {
  const s = await supabaseServer();

  const {data: tournament} = await s
    .from("tournaments")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (!tournament) {
    return (
      <main className="shell">
        <header>
          <b>☠ ONE PIECE FANTACALCIO</b>
          <Link href="/login">Accedi</Link>
        </header>
        <section className="hero">
          <small>TORNEO ONLINE</small>
          <h1>One Piece Fantacalcio</h1>
          <p>Il torneo non è ancora configurato.</p>
        </section>
      </main>
    );
  }

  const [
    {data: teamsData},
    {data: matchesData}
  ] = await Promise.all([
    s.from("teams")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("name"),

    s.from("matches")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("matchday_number")
      .order("id")
  ]);

  const teams = teamsData || [];
  const matches = matchesData || [];

  const {data: membersData} = teams.length
    ? await s.from("team_members")
        .select("*")
        .in("team_id", teams.map(team => team.id))
        .order("created_at")
    : {data: []};

  const members = membersData || [];

  const membersByTeam = Object.fromEntries(
    teams.map(team => [
      team.id,
      members.filter(member => member.team_id === team.id)
    ])
  );

  const rows = standings(teams, matches);

  const matchdays = [
    ...new Set(matches.map(match => match.matchday_number))
  ].sort((a, b) => a - b);

  return (
    <main className="shell">
      <header>
        <b>☠ ONE PIECE FANTACALCIO</b>
        <Link href="/login">Accedi</Link>
      </header>

      <section className="hero">
        <small>STAGIONE {tournament.season || ""}</small>
        <h1>{tournament.name}</h1>
        <p>
          Calendario, risultati, classifica e componenti delle squadre.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Classifica</h2>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Squadra</th>
                <th>PG</th>
                <th>Pt</th>
                <th>Totale</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team, index) => (
                <tr key={team.id}>
                  <td>{index + 1}</td>
                  <td><b>{team.name}</b></td>
                  <td>{team.played}</td>
                  <td><b>{team.points}</b></td>
                  <td>{team.scored}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="note">
            Classifica: punti, scontro diretto tra due squadre
            a pari punti, totale cumulativo e nome squadra.
            Se lo scontro diretto non è ancora stato giocato,
            si usa provvisoriamente il totale cumulativo.
            Per parità tra tre o più squadre si usa
            provvisoriamente il totale cumulativo.
          </p>
        </article>

        <article className="card">
          <h2>Squadre e componenti</h2>

          {teams.map(team => (
            <div
              className="team"
              key={team.id}
              style={{display: "block", marginBottom: "1rem"}}
            >
              <b>{team.name}</b>

              {membersByTeam[team.id].length > 0 ? (
                <ol
                  style={{
                    margin: "0.5rem 0 0",
                    paddingLeft: "1.5rem"
                  }}
                >
                  {membersByTeam[team.id].map(member => (
                    <li key={member.id}>{member.name}</li>
                  ))}
                </ol>
              ) : (
                <p className="note" style={{marginTop: "0.5rem"}}>
                  Componenti non ancora inseriti.
                </p>
              )}
            </div>
          ))}
        </article>
      </section>

      <article className="card">
        <h2>Calendario e risultati</h2>

        {matchdays.map(number => (
          <div className="round" key={number}>
            <h3>Giornata {number}</h3>

            {matches
              .filter(match => match.matchday_number === number)
              .map(match => {
                const homeName = teams.find(
                  team => team.id === match.home_team_id
                )?.name || "Casa";

                const awayName = teams.find(
                  team => team.id === match.away_team_id
                )?.name || "Ospiti";

                const score =
                  match.home_score == null ||
                  match.away_score == null
                    ? "—"
                    : `${match.home_score} - ${match.away_score}`;

                return (
                  <div className="match" key={match.id}>
                    <span>{homeName}</span>
                    <b>{score}</b>
                    <span>{awayName}</span>
                  </div>
                );
              })}
          </div>
        ))}
      </article>
    </main>
  );
}
