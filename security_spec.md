# GharKaExpert Firestore Security Specification

## 1. Data Invariants
1. **Identity Ownership**: `/users/{userId}` can only be created or updated where `userId == request.auth.uid` and `incoming().ownerId == request.auth.uid`.
2. **PII Isolation (Split Collection)**: Phone numbers and device IDs are never stored on `/users/{userId}` (public profile). They reside strictly in `/users/{userId}/private/{docId}` (`docId == 'account'`), readable and writable exclusively by `request.auth.uid == userId` with Master Gate verification that parent `/users/$(userId)` exists and belongs to `request.auth.uid`.
3. **Verified Identity**: All writes require either a verified phone token (`request.auth.token.phone_number`) or verified email (`request.auth.token.email_verified == true`).
4. **Immutable Core Fields**: `ownerId`, `role`, and `createdAt` cannot be mutated after creation.
5. **Temporal Integrity**: `createdAt` on create and `updatedAt` on update must equal `request.time`.
6. **Soft-Delete Enforcement**: Client hard deletes (`allow delete`) are strictly forbidden (`false`) across all collections.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection**: `{ ownerId: uid, name: "Ramesh", role: "worker", isSuperAdmin: true, ... }` -> Rejected by `hasOnly()`.
2. **Owner Spoofing on Create**: Authenticated as `uidA`, creating `/users/uidB` with `ownerId: "uidB"` -> Rejected by `userId == request.auth.uid`.
3. **Role Escalation on Update**: Updating `role` from `"customer"` to `"worker"` -> Rejected by `incoming().role == existing().role` and `affectedKeys().hasOnly()`.
4. **Unverified Email Spoof**: Token with `email: "user@example.com"`, `email_verified: false`, no `phone_number` -> Rejected by `isVerifiedAuth()`.
5. **Cross-User PII Read**: Authenticated as `uidB`, `get(/users/uidA/private/account)` -> Rejected by `request.auth.uid == userId`.
6. **Orphaned Private Subdocument**: Creating `/users/uidA/private/account` before `/users/uidA` exists -> Rejected by Master Gate `exists(/databases/$(database)/documents/users/$(userId))`.
7. **ID Poisoning**: Creating `/users/uidA/private/malicious_doc_id` -> Rejected by `docId == 'account'` & `isValidId(userId)`.
8. **1MB String Exhaustion**: Setting `bio` to a 50,000-character string -> Rejected by `data.bio.size() <= 500`.
9. **Client Timestamp Forgery**: Setting `createdAt` to `2020-01-01` -> Rejected by `incoming().createdAt == request.time`.
10. **CreatedAt Mutation**: Modifying `createdAt` during an update -> Rejected by `incoming().createdAt == existing().createdAt`.
11. **Blanket List Scraping of PII**: Querying `list` on `/users/{userId}/private` -> Rejected (`allow list: if false`).
12. **Client Hard Delete**: Calling `deleteDoc` on `/users/uidA` -> Rejected (`allow delete: if false`).
