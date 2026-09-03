# Privacy data map

Every piece of data this product touches, where it lives, and when it dies.

---

## 1. Storage tiers

| Tier | Survives a refresh | Survives closing the tab | Used for |
|------|--------------------|--------------------------|----------|
| memory | no | no | the in-flight quiz/session view state |
| `sessionStorage` | yes | **no** | item-level data that must not persist |
| `localStorage` | yes | yes | progress, results, pairings, lists, agenda |

All keys are namespaced `baynana:v1:`. Nothing is written outside that prefix.

---

## 2. localStorage keys

| Key | Contents | Written by |
|---|---|---|
| `baynana:v1:theme` | `"light"` / `"dark"` | theme toggle |
| `baynana:v1:nickname` | first name or nickname, ≤24 chars | assessment/alignment start |
| `baynana:v1:private-mode` | `"on"` when private mode is enabled | privacy page |
| `baynana:v1:progress:<assessmentId>` | in-progress answers, randomized option order, index | assessment quiz |
| `baynana:v1:result:<assessmentId>` | six dimension percentages, answers, derived indexes, safety level | assessment completion |
| `baynana:v1:pair:<assessmentId>` | the partner's decoded BN1 payload | pairing |
| `baynana:v1:pending:<assessmentId>` | a partner code received before the user answered | share link |
| `baynana:v1:align:progress:<mapId>` | in-progress alignment answers and importance marks | alignment map |
| `baynana:v1:align:result:<mapId>` | completed alignment answers and importance marks | alignment completion |
| `baynana:v1:align:pair:<mapId>` | the partner's decoded BNA1 **category aggregates** | two-device comparison |
| `baynana:v1:conversation:favorites` | question **IDs** only | conversation library |
| `baynana:v1:conversation:discussed` | question **IDs** only | conversation library |
| `baynana:v1:conversation:later` | question **IDs** only | conversation library |
| `baynana:v1:knowledge:summaries` | counts only: exact / close / different / excluded | explicit opt-in after a challenge |
| `baynana:v1:premarital:agenda` | topic IDs and labels the users explicitly added | agenda buttons |

Every read passes through a schema guard. Anything that fails validation is
dropped, and a wholly invalid record is removed rather than repaired.

**Private mode blocks every write in this table** except the theme and the
private-mode flag itself.

---

## 3. sessionStorage keys

| Key | Contents | Cleared when |
|---|---|---|
| `baynana:v1:session:align:<mapId>:a` | partner A's item-level alignment answers | comparison ends, quick exit, tab closes |
| `baynana:v1:session:align:<mapId>:b` | partner B's item-level alignment answers | same |
| `baynana:v1:session:align:<mapId>:mode` | which slot is currently answering | same |
| `baynana:v1:session:knowledge` | the entire challenge: answers, predictions, confidences, marks | challenge ends, quick exit, delete-all, tab closes |
| `baynana:v1:session:safety-check` | private safety self-check answers | explicit clear, quick exit, tab closes |

`sessionStorage` is authoritative for the knowledge challenge: if the record is
gone, the in-memory copy is dropped too, so cleared answers can never be resumed
from memory.

---

## 4. What is never stored anywhere

- Legal names, email addresses, phone numbers, postal addresses.
- Exact income, bank details, account numbers, passwords.
- Medical records or trauma narratives.
- Free-text answers of any kind — the product has no free-text answer field.
- Anything a user says out loud during a conversation session. The device does
  not record the conversation, and the UI says so.
- Item-level knowledge-challenge answers in `localStorage`. Enforced by
  `scripts/validate-knowledge.js` and by a smoke test that dumps every
  namespaced key and asserts no item ID appears.

---

## 5. Result codes

### BN1 — assessment codes (unchanged)

```text
[ version, assessmentId, nickname, [6 dimension percentages], derived, completedAt, checksum ]
```

### BNA1 — alignment codes (new)

```text
[ version, mapId, nickname, contentVersion, [category aggregates], completedAt, checksum ]
```

Each category aggregate is:

```text
{ id, p, n, o, u, s, e }

p  mean position across ANSWERED ORDERED items, 0..100, or null
n  how many ordered items contributed
o  how many ordered items the category has
u  how many items were "not yet discussed" or unanswered
s  how many items were kept private
e  how many items the sender marked "essential to discuss"
```

**No item-level answer and no free text is present.** Nominal items never
contribute to `p`, because averaging unordered categories is meaningless.

The decoder rejects: oversized input, malformed format, corrupted payloads,
checksum failures, unsupported versions, unknown modules, mismatched modules,
mismatched content versions, out-of-range aggregates, future timestamps, and a
code generated from the user's own saved result.

### Honest statements about codes

- Base64URL is **transport encoding, not encryption**. Anyone holding a code can
  read its aggregate contents.
- The FNV-1a checksum detects accidental corruption and casual tampering. It is
  **not** a signature and does not prove who produced a code.
- Codes live in the URL **hash**, never a query string, so they are not sent as
  part of a normal HTTP request.

### No code at all for the knowledge challenge

There is deliberately no share-code path for `قد إيه تعرفني؟`. The validator
fails the build if the knowledge modules reference any codec.

---

## 6. Network reality — stated accurately

The privacy page says the following, and does **not** say "nothing ever reaches a
server":

- Loading the page is a network request. The hosting provider receives ordinary
  request metadata: IP address, timestamp, user agent, requested path.
- Assessment answers are not intentionally transmitted to Baynana. There is no
  results server, no account system, and no analytics.
- Fragment identifiers (everything after `#`) are not sent as part of a normal
  HTTP request, which is why result codes live there.
- Copied links, screenshots, browser history, and clipboard history can still
  reveal activity regardless of anything this product does.
- Anyone with access to this device or browser profile can see locally stored
  progress.

No third-party runtime code exists: no fonts, CDNs, analytics, chat widgets,
tracking pixels, cookie banners, or remote API calls. The Content-Security-Policy
enforces this with `connect-src 'none'` and `default-src 'self'`.

---

## 7. User controls

Available from `#/privacy` unless noted:

| Control | Effect |
|---|---|
| Delete current progress | one assessment's in-progress answers (on the quiz view) |
| Restart one activity | one assessment or one alignment map, including its pairing |
| Delete one comparison | removes a stored partner code, keeps your own result |
| Delete conversation lists | favorites, discussed, later |
| Delete knowledge summaries | the opt-in aggregate counts |
| Delete the discussion agenda | all added topics |
| End the current work session | purges every namespaced sessionStorage key |
| Delete all Baynana data | every namespaced local and session key |
| Enter private mode | disables all persistent writes |
| Exit private mode | re-enables them, with an explicit warning first |

`Delete all Baynana data` is verified by a smoke test that enumerates every
namespaced key afterwards and asserts the list is empty.

---

## 8. Retention

There is no retention policy, because there is no retention: no server ever
receives the data. Local data lives until the user deletes it, clears site data,
or (for session data) closes the tab.
