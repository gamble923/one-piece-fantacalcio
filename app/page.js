import Link from "next/link";
import {supabaseServer} from "../lib/supabase/server";

function standings(teams,matches){
  const r=Object.fromEntries((teams||[]).map(t=>[t.id,{...t,points:0,scored:0,played:0}]));
  for(const m of matches||[]){
    if(m.home_score==null||m.away_score==null) continue;
    const h=r[m.home_team_id],a=r[m.away_team_id]; if(!h||!a) continue;
    h.played++;a.played++;h.scored+=+m.home_score;a.scored+=+m.away_score;
    if(+m.home_score>+m.away_score) h.points+=3;
    else if(+m.home_score<+m.away_score) a.points+=3;
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
  const rows=standings(teams,matches);
  return <main className="shell">
    <header><b>☠ ONE PIECE FANTACALCIO</b><Link href="/login">Accedi</Link></header>
    <section className="hero"><small>STAGIONE {t.season||""}</small><h1>{t.name}</h1><p>Calendario, risultati e classifica.</p></section>
    <section className="grid">
      <article className="card"><h2>Classifica</h2><table><thead><tr><th>#</th><th>Squadra</th><th>PG</th><th>Pt</th><th>Totale</th></tr></thead><tbody>
      {rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td><b>{r.name}</b></td><td>{r.played}</td><td><b>{r.points}</b></td><td>{r.scored}</td></tr>)}</tbody></table>
      <p className="note">Regola: punti → scontro diretto → totale cumulativo → nome squadra come ultimo criterio tecnico.</p></article>
      <article className="card"><h2>Squadre</h2>{(teams||[]).map(t=><div className="team" key={t.id}>{t.name}</div>)}</article>
    </section>
    <article className="card"><h2>Calendario e risultati</h2>{Array.from(new Set((matches||[]).map(m=>m.matchday_number))).map(n=><div className="round" key={n}><h3>Giornata {n}</h3>{matches.filter(m=>m.matchday_number===n).map(m=><div className="match" key={m.id}><span>{teams.find(t=>t.id===m.home_team_id)?.name}</span><b>{m.home_score==null?"—":`${m.home_score} - ${m.away_score}`}</b><span>{teams.find(t=>t.id===m.away_team_id)?.name}</span></div>)}</div>)}</article>
  </main>;
}
