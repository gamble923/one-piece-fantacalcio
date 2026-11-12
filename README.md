# One Piece Fantacalcio — versione definitiva

Questa è la base completa per il deploy online con Next.js + Supabase.

## Funzioni
- un solo sito per utenti e admin
- area pubblica senza login
- pulsante Accedi
- login admin con Supabase Auth
- torneo da 8 o 10 squadre
- calendario automatico (7 o 9 giornate)
- punteggi inseriti manualmente
- classifica automatica 3/1/0
- database online

## Password admin
La password indicata dal proprietario NON è inclusa nel codice. Va impostata direttamente nell'account Supabase Auth.

## Avvio
1. Crea un progetto Supabase.
2. Esegui `supabase/schema.sql` nel SQL Editor.
3. Crea un utente amministratore in Authentication > Users e imposta la password scelta.
4. Copia `.env.example` in `.env.local` e inserisci URL e anon key.
5. `npm install`
6. `npm run dev`
7. Apri `http://localhost:3000`.

## Deploy
Collega il progetto a GitHub/Vercel e inserisci le stesse due variabili ambiente. Un dominio personalizzato è opzionale.

## Nota importante
Il calcolo dei bonus/malus dei singoli personaggi NON è dentro l'app: l'admin inserisce il punteggio finale della squadra, come richiesto.
Prima della messa in produzione definitiva conviene restringere ulteriormente le policy RLS a un ruolo admin se si prevedono più account autenticati.
