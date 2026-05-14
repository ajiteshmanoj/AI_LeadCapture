// Permissive Supabase typing stub. The Supabase v2 client requires a
// `Database` generic to give `.from()` and `.rpc()` typed results — without
// it, every chained call collapses to `never`. We don't generate types via
// `supabase gen types typescript` yet, so this stub keeps things working.
//
// When/if we wire up generated types, replace `Database = any` with the
// generated interface and tighten as needed.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
