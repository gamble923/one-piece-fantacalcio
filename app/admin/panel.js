"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {supabaseBrowser} from "../../lib/supabase/browser";
function calendar(ids){let a=[...ids],n=a.length,out=[];for(let r=1;r<n;r++){let g=[];for(let i=0;i<n/2;i++){let x=a[i],y=a[n-1-i];if(x&&y)g.push([x,y]);}out.push(g);a=[a[0],a[n-1],...a.slice(1,n-1)];}return out;}
export default function Panel({tournament,teams,matches,members}){
 const s=supabaseBrowser(),router=useRouter();
 const [count,setCount]=useState(teams.length||8),[name,setName]=useState(tournament?.name||"One Piece Fantacalcio"),[season,setSeason]=useState(tournament?.season||""),[names,setNames]=useState(Array.from({length:teams.length||8},(_,i)=>teams[i]?.name||`Squadra ${i+1}`)),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const [memberNames,setMemberNames]=useState(()=>Object.fromEntries((teams||[]).map(team=>[team.id,Array.from({length:5},(_,i)=>(members.filter(m=>m.team_id===team.id)[i]?.name||""))])))
 function setN(n){setCount(n);setNames(x=>Array.from({length:n},(_,i)=>x[i]||`Squadra ${i+1}`));}
 async function generate(){
   setBusy(true);setMsg("");
   if(!names.slice(0,count).every(x=>x.trim())){setMsg("Inserisci il nome di tutte le squadre.");setBusy(false);return;}
   let tid=tournament?.id;
   if(tid){await s.from("matches").delete().eq("tournament_id",tid);await s.from("matchdays").delete().eq("tournament_id",tid);await s.from("teams").delete().eq("tournament_id",tid);await s.from("tournaments").update({name,season,team_count:count}).eq("id",tid);}
   else{const q=await s.from("tournaments").insert({name,season,team_count:count,is_active:true}).select().single();if(q.error){setMsg(q.error.message);setBusy(false);return;}tid=q.data.id;}
   let ids=[];
   for(const nm of names.slice(0,count)){const q=await s.from("teams").insert({tournament_id:tid,name:nm.trim()}).select().single();if(q.error){setMsg(q.error.message);setBusy(false);return;}ids.push(q.data.id);}
   const cal=calendar(ids);
   for(let i=0;i<cal.length;i++){const md=await s.from("matchdays").insert({tournament_id:tid,number:i+1});if(md.error){setMsg(md.error.message);setBusy(false);return;}for(const [h,a] of cal[i]){const q=await s.from("matches").insert({tournament_id:tid,matchday_number:i+1,home_team_id:h,away_team_id:a});if(q.error){setMsg(q.error.message);setBusy(false);return;}}}
   setMsg("Torneo e calendario creati. Ora inserisci i 5 componenti per ogni squadra.");setBusy(false);router.refresh();
 }
 async function saveMembers(teamId){
   const list=(memberNames[teamId]||[]).map(x=>x.trim());
   if(list.length!==5||list.some(x=>!x)){setMsg("Ogni squadra deve avere esattamente 5 componenti compilati.");return;}
   setBusy(true);setMsg("");
   const del=await s.from("team_members").delete().eq("team_id",teamId); if(del.error){setMsg(del.error.message);setBusy(false);return;}
   const ins=await s.from("team_members").insert(list.map(n=>({team_id:teamId,name:n}))); if(ins.error){setMsg(ins.error.message);setBusy(false);return;}
   setMsg("Componenti salvati.");setBusy(false);router.refresh();
 }
 async function score(id,h,a){if(h!==""&&Number(h)<0||a!==""&&Number(a)<0){setMsg("I punteggi non possono essere negativi.");return;}await s.from("matches").update({home_score:h===""?null:+h,away_score:a===""?null:+a}).eq("id",id);router.refresh();}
 async function logout(){await s.auth.signOut();router.push("/");}
 return <>
 <section className="grid"><article className="card"><h2>Configurazione</h2><label>Nome torneo<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Stagione<input value={season} onChange={e=>setSeason(e.target.value)}/></label><label>Squadre<select value={count} onChange={e=>setN(+e.target.value)}><option value="8">8</option><option value="10">10</option></select></label>{names.slice(0,count).map((v,i)=><label key={i}>Squadra {i+1}<input value={v} onChange={e=>setNames(x=>x.map((z,j)=>j===i?e.target.value:z))}/></label>)}<button onClick={generate} disabled={busy}>{busy?"Salvataggio...":"Crea / rigenera torneo"}</button>{msg&&<p className="success">{msg}</p>}<p className="note">La rigenerazione cancella calendario, risultati e componenti del torneo corrente. Usala solo prima dell'inizio.</p></article><article className="card"><h2>Stato</h2><p>Squadre: <b>{teams.length}</b></p><p>Partite: <b>{matches.length}</b></p><p>Risultati inseriti: <b>{matches.filter(m=>m.home_score!=null&&m.away_score!=null).length}</b></p><button className="secondary" onClick={logout}>Esci</button></article></section>
 <article className="card"><h2>5 componenti per squadra</h2><p className="note">Inserisci i 5 componenti di ogni squadra. Il loro calcolo bonus/malus resta fuori dall'app: qui si registra solo il roster.</p>{teams.length===0?<p>Nessuna squadra configurata.</p>:teams.map(team=>{const values=memberNames[team.id]||Array(5).fill("");return <div className="member-box" key={team.id}><h3>{team.name}</h3>{values.map((v,i)=><input key={i} placeholder={`Componente ${i+1}`} value={v} onChange={e=>setMemberNames(x=>({...x,[team.id]:values.map((z,j)=>j===i?e.target.value:z)}))}/>}<button className="small full" onClick={()=>saveMembers(team.id)} disabled={busy}>Salva componenti</button></div>})}</article>
 <article className="card"><h2>Inserimento risultati</h2>{matches.length===0?<p>Nessuna partita configurata.</p>:matches.map(m=><Row key={m.id} m={m} teams={teams} save={score}/>)}</article></>
}
function Row({m,teams,save}){const hName=teams.find(t=>t.id===m.home_team_id)?.name||"Casa",aName=teams.find(t=>t.id===m.away_team_id)?.name||"Ospiti";const [h,setH]=useState(m.home_score??""),[a,setA]=useState(m.away_score??"");return <div className="score"><small>G{m.matchday_number}</small><span>{hName}</span><input type="number" min="0" step="0.1" value={h} onChange={e=>setH(e.target.value)}/><b>–</b><input type="number" min="0" step="0.1" value={a} onChange={e=>setA(e.target.value)}/><span>{aName}</span><button className="small" onClick={()=>save(m.id,h,a)}>Salva</button></div>}
