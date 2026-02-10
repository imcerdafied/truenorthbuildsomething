# RLS Testing Checklist

Run these tests after applying the onboarding migration. Two phases:
1. SQL verification in Supabase Dashboard (SQL Editor)
2. Manual app testing with two accounts

---

## Phase 1: SQL Verification (Supabase Dashboard → SQL Editor)

### 1a. Confirm all policies exist

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

You should see policies for: organizations, profiles, user_roles, product_areas, domains, teams, okrs, key_results, check_ins, jira_links, okr_links.

Key policies to verify:
- organizations: SELECT (own org), INSERT (no org yet), UPDATE (admin)
- profiles: SELECT (own org + self), UPDATE (self), INSERT (self)
- user_roles: SELECT (own org), INSERT (own role)
- okrs: SELECT/INSERT/UPDATE (own org), DELETE (admin)
- key_results: SELECT/INSERT/UPDATE (own org via okr), DELETE (admin)
- check_ins: SELECT/INSERT/UPDATE (own org via okr), DELETE (admin)

### 1b. Confirm helper functions exist

```sql
-- Should return a UUID or NULL
SELECT public.get_user_organization_id('00000000-0000-0000-0000-000000000000');

-- Should return true or false
SELECT public.is_org_admin('00000000-0000-0000-0000-000000000000');
```

Both should execute without error (returning NULL/false for a fake user ID).

### 1c. Confirm the trigger that creates profiles on signup exists

```sql
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname LIKE '%profile%' OR tgname LIKE '%user%';
```

You should see a trigger on auth.users that inserts into profiles on new user creation.

---

## Phase 2: Manual App Testing (two browser sessions)

### Setup
1. Open Chrome (normal window) → go to truenorthos.build
2. Open Chrome (incognito window) → go to truenorthos.build
3. Sign up as User A: testuser-a@test.com (invite code: TRUENORTH2026)
4. Sign up as User B: testuser-b@test.com (invite code: TRUENORTH2026)

### Test 2a: Onboarding creates org correctly

**User A:**
1. Complete setup: Org="Alpha Corp", Product Area="Engineering", Domain="Platform", Team="Core API"
2. After setup, should redirect to Home page
3. Home should show team "Core API" with no OKRs yet

**User B:**
1. Complete setup: Org="Beta Inc", Product Area="Product", Domain="Growth", Team="Activation"
2. Same flow, should work independently

**Note:** Current app has a single-step setup (Org + Team only). Product Area/Domain are created as "Main" / "Default". Adjust test labels if your UI only shows Org and Team.

### Test 2b: Data isolation (most critical)

**User A (after setup):**
1. Create an OKR: "Reduce API latency to under 100ms" with 1 KR
2. Run a check-in on that OKR (confidence 70)
3. Go to OKRs page — should see 1 OKR
4. Go to Structure page — should see Alpha Corp's structure only

**User B (after setup):**
1. Go to OKRs page — should see 0 OKRs (NOT User A's OKR)
2. Go to Structure page — should see Beta Inc's structure only (NOT Alpha Corp)
3. Create an OKR: "Improve activation rate to 40%"
4. Run a check-in

**Back to User A:**
1. Refresh OKRs page — should still see only 1 OKR (their own)
2. Should NOT see User B's "Improve activation rate" OKR

### Test 2c: Direct API probing (advanced, optional)

Open browser console (F12) on User A's session and run:

```javascript
// Expose supabase client for probing (if not already on window)
// const supabase = ... from your app's client

// Try to read another org's data directly
const { data, error } = await window.supabase
  ?.from('organizations')
  .select('*');
console.log('Orgs visible:', data?.length, data);
// Should return exactly 1 (own org only)

// Try to read all OKRs
const { data: okrs } = await window.supabase
  ?.from('okrs')
  .select('*');
console.log('OKRs visible:', okrs?.length);
// Should return only own org's OKRs

// Try to read all profiles
const { data: profiles } = await window.supabase
  ?.from('profiles')
  .select('*');
console.log('Profiles visible:', profiles?.length);
// Should return only profiles in own org + self
```

If any query returns data from the other org, RLS is broken. (If `window.supabase` is not exposed, use your app's Supabase client from the console context where it's available.)

### Test 2d: Edge cases

1. **Unauthenticated access**: Log out, try navigating to /okrs — should redirect to login
2. **Demo mode isolation**: Go to truenorthos.build?demo=true — should show demo data, not real org data
3. **Double org creation**: After setup, try navigating to /setup directly — should either redirect or show "already has org" error

---

## Expected Results

| Test | Expected | If Fails |
|------|----------|----------|
| 2a | Both users complete onboarding | Check INSERT policies on organizations, user_roles |
| 2b | Zero cross-org data leakage | Check get_user_organization_id function, RLS on okrs/key_results/check_ins |
| 2c | Each query returns only own org data | Check SELECT policies on each table |
| 2d | No unauthenticated access | Check auth redirect in App.tsx |

---

## Cleanup

After testing, delete test accounts in Supabase Dashboard:
1. Auth → Users → delete testuser-a@test.com and testuser-b@test.com
2. SQL Editor: Run cleanup queries to remove orphaned data:

```sql
-- Find and delete test orgs
DELETE FROM organizations WHERE name IN ('Alpha Corp', 'Beta Inc');
-- Cascading deletes should clean up product_areas, domains, teams, okrs, etc.
```
