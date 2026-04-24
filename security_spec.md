# Security Specification - 错题举一反三打印机

## Data Invariants
- A `QuestionRecord` must belong to exactly one user (`userId`).
- A user can only read/write their own records.
- Each record must have exactly 3 analogous questions (enforced by size limits).
- Timestamps must be server-generated.
- ID path variables must be validated.

## The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Creating a record for `userId: "other_user"`.
2. **Unauthenticated Write**: Creating a record without being logged in.
3. **Data Poisoning (Size)**: `originalQuestion` string > 5000 characters.
4. **Data Poisoning (Keys)**: Adding `isPremium: true` to a record.
5. **Collection Creep**: Trying to create a record in `/users/` or other non-existent collections.
6. **Immutable Breach**: Attempting to change `userId` during an update.
7. **Temporal Fraud**: Setting `createdAt` to a future date instead of `request.time`.
8. **Relational Leak**: Listing questions where `userId == "target_user"`.
9. **Quantity Overflow**: `analogousQuestions` array containing 50 items.
10. **ID Injection**: Using a 2KB string as a document ID.
11. **PII Exposure**: Reading another user's question detail.
12. **State Locking Breach**: (Not applicable yet, but will lock `createdAt`).

## Test Runner (Logic)
The `firestore.rules` will be evaluated against these constraints. Every write will use `isValidQuestionRecord(incoming())`.
