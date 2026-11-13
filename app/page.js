function standings(teams,matches){
  const r=Object.fromEntries((teams||[]).map(t=>[
    t.id,{...t,points:0,scored:0,played:0}
  ]));

  for(const m of matches||[]){
    if(m.home_score==null||m.away_score==null) continue;
    const h=r[m.home_team_id],a=r[m.away_team_id];
    if(!h||!a) continue;

    const hs=Number(m.home_score),as=Number(m.away_score);
    h.played++;
    a.played++;
    h.scored+=hs;
    a.scored+=as;

    if(hs>as) h.points+=3;
    else if(hs<as) a.points+=3;
    else {h.points++;a.points++;}
  }

  const direct=new Map();
  for(const m of matches||[]){
    if(m.home_score==null||m.away_score==null) continue;
    const key=[m.home_team_id,m.away_team_id].sort().join("|");
    direct.set(key,m);
  }

  function fallback(a,b){
    return b.scored-a.scored||a.name.localeCompare(b.name,"it")||a.id.localeCompare(b.id);
  }

  const groups=new Map();
  for(const team of Object.values(r)){
    if(!groups.has(team.points)) groups.set(team.points,[]);
    groups.get(team.points).push(team);
  }

  const result=[];
  for(const points of [...groups.keys()].sort((a,b)=>b-a)){
    const group=groups.get(points);
    if(group.length===2){
      const [a,b]=group;
      const key=[a.id,b.id].sort().join("|");
      const m=direct.get(key);
      if(m){
        const hs=Number(m.home_score),as=Number(m.away_score);
        if(hs!==as){
          const winner=hs>as?m.home_team_id:m.away_team_id;
          group.sort((x,y)=>x.id===winner?-1:y.id===winner?1:0);
        }else{
          group.sort(fallback);
        }
      }else{
        group.sort(fallback);
      }
    }else{
      group.sort(fallback);
    }
    result.push(...group);
  }

  return result;
}
