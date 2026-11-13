import Link from "next/link";
import {redirect} from "next/navigation";
import {supabaseServer} from "../../lib/supabase/server";
import Panel from "./panel";

export default async function Admin(){
  const s=await supabaseServer();

  const {data:{user}}=await s.auth.getUser();
  if(!user) redirect("/login");

  const {data:t}=await s.from("tournaments")
    .select("*")
    .eq("is_active",true)
    .maybeSingle();

  const {data:teams}=t
    ?await s.from("teams")
      .select("*")
      .eq("tournament_id",t.id)
      .order("name")
    :{data:[]};

  const {data:matches}=t
    ?await s.from("matches")
      .select("*")
      .eq("tournament_id",t.id)
      .order("matchday_number")
      .order("id")
    :{data:[]};

  const {data:members}=teams?.length
    ?await s.from("team_members")
      .select("*")
      .in("team_id",teams.map(team=>team.id))
      .order("created_at")
    :{data:[]};

  return (
    <main className="shell">
      <header>
        <b>☠ ADMIN · ONE PIECE FANTACALCIO</b>
        <Link href="/">Area pubblica</Link>
      </header>

      <section className="hero compact">
        <small>PANNELLO DI CONTROLLO</small>
        <h1>Gestione torneo</h1>
        <p>Configura squadre, componenti, calendario e punteggi.</p>
      </section>

      <Panel
        tournament={t}
        teams={teams||[]}
        matches={matches||[]}
        members={members||[]}
      />
    </main>
  );
}
