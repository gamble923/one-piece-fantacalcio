"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {supabaseBrowser} from "../../lib/supabase/browser";
export default function Login(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const router=useRouter();
 async function submit(e){e.preventDefault();setBusy(true);setError("");const {error}=await supabaseBrowser().auth.signInWithPassword({email,password});if(error)setError("Credenziali non valide.");else router.push("/admin");setBusy(false);}
 return <main className="shell"><header><b>☠ ONE PIECE FANTACALCIO</b></header><section className="login"><small>AREA PRIVATA</small><h1>Accedi</h1><p>Accesso riservato all'amministratore.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="error">{error}</div>}<button disabled={busy}>{busy?"Accesso...":"Accedi"}</button></form></section></main>
}
