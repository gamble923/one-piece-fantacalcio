import Link from "next/link";
import {supabaseServer} from "../lib/supabase/server";

function standings(teams,matches){
  const r=Object.fromEntries((teams||[]).map(t=>[t.id,{...t,points:0,scored:0,played:0}]));
  for(const m of matches||[]){
    if(m.home_score==null||m.away_score==null) continue;
    const h=r[m.home_team_id],a=r[m.away_team_id];
    if(!h||!a) continue;
    h.played++;a.played++;
    h.scored+=Number(m.home_score);
    a.scored+=Number(m.away_score);
    if(Number(m.home_score)>Number(m.away_score)) h.points+=3;
    else if(Number(m.home_score)<Number(m.away_score)) a.points+=3;
    else {h.points++;a.points++;}
  }
  return Object.values(r).sort((a,b)=>b.points-a.points||b.scored-a.scored||a.name.localeCompare(b.name,"it"));
}

export default async function Home(){
  const s=await supabaseServer();
  const {data:t}=await s.from("tournaments").select("*").eq("is_active",true).maybeSingle();
  if(!t) return <main className="shell"><header><b>☠ ONE PIECE FANTACALCIO</b><Link href="/login">Accedi</Link></header><section className="hero"><small>TORNEO ONLINE</small><h1>One Piece Fantacalcio</h1><p>Il torneo non è ancora configurato.</p></section></main>;

  const [{data:teams},{data:matches}]=await Promise.all([
    s.from("teams").select("*").eq("tournament_id",t.id).order("name"),
    s.from("matches").select("*").eq("tournament_id",t.id).order("matchday_number").order("id")
  ]);
  const teamList=teams||[];
  const matchList=matches||[];
  const {data:members}=teamList.length
    ?await s.from("team_members").select("*").in("team_id",teamList.map(team=>team.id)).order("created_at")
    :{data:[]};
  const membersByTeam=Object.fromEntries(teamList.map(team=>[
    team.id,(members||[]).filter(member=>member.team_id===team.id)
  ]));
  const rows=standings(teamList,matchList);

  return <main className="shell">
    <header><b>☠ ONE PIECE FANTACALCIO</b><Link href="/login">Accedi</Link></header>
    <section className="hero"><small>STAGIONE {t.season||""}</small><h1>{t.name}</h1><p>Calendario, risultati, classifica e componenti delle squadre.</p></section>
    <section className="grid">
      <article className="card"><h2>Classifica</h2><table><thead><tr><th>#</th><th>Squadra</th><th>PG</th><th>Pt</th><th>Totale</th></tr></thead><tbody>
      {rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td><b>{r.name}</b></td><td>{r.played}</td><td><b>{r.points}</b></td><td>{r.scored}</td></tr>)}</tbody></table>
      <p className="note">Classifica provvisoria: punti → totale cumulativo → nome squadra. Il criterio dello scontro diretto sarà aggiunto nel prossimo aggiornamento.</p></article>
      <article className="card"><h2>Squadre e componenti</h2>
        {teamList.map(team=><div className="team" key={team.id} style={{display:"block",marginBottom:"1rem"}}>
          <b>{team.name}</b>
          {membersByTeam[team.id].length>0
            ?<ol style={{margin:"0.5rem 0 0",paddingLeft:"1.5rem"}}>{membersByTeam[team.id].map(member=><li key={member.id}>{member.name}</li>)}</ol>
            :<p className="note" style={{marginTop:"0.5rem"}}>Componenti non ancora inseriti.</p>}
        </div>)}
      </article>
    </section>
    <article className="card"><h2>Calendario e risultati</h2>{Array.from(new Set(matchList.map(m=>m.matchday_number))).map(n=><div className="round" key={n}><h3>Giornata {n}</h3>{matchList.filter(m=>m.matchday_number===n).map(m=><div className="match" key={m.id}><span>{teamList.find(t=>t.id===m.home_team_id)?.name}</span><b>{m.home_score==null||m.away_score==null?"—":`${m.home_score} - ${m.away_score}`}</b><span>{teamList.find(t=>t.id===m.away_team_id)?.name}</span></div>)}</div>)}</article>
  </main>;
}
