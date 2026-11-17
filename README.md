# MaktabaLink

MaktabaLink is a community library platform for discovering Kenyan books, managing a personal reading list, requesting copies, joining an availability waitlist, and booking study spaces. Librarians can maintain the catalogue and manage loans and bookings.

## Features

- Browse an illustrated catalogue featuring Kenyan authors, with title, author, genre, and ISBN search.
- Register and sign in as a patron; save titles and request available copies.
- Join a first-in-first-out waitlist for unavailable books, see your queue position, and request a copy when it is your turn.
- Reserve study spaces; the API rejects overlapping bookings.
- Librarian-only tools for catalogue management, loan status and fine review, and booking oversight.
- Responsive interface, locally hosted original illustrations, and accessible loading, error, and empty states.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB Atlas or another MongoDB replica set. Borrow and inventory updates use transactions.

## Run locally

1. Install dependencies and create your private environment file:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

2. Set `MONGODB_URI` to a **disposable development database** and replace `JWT_SECRET` with a private random value of at least 32 characters. Never commit `.env` or use a database that contains data you need to keep.
3. Seed the Kenyan catalogue and start the API and frontend:

   ```powershell
   npm run seed
   npm run dev
   ```

4. Open <http://localhost:5173>. The API listens on <http://localhost:4000>.

The seed replaces the `books` and `genres` collections and clears waitlist entries in the selected database. The sample catalogue includes original local SVG illustrations in `public/covers/`.

## Accounts and librarian demo

Register through the app to create a patron account. Public registration cannot assign a librarian role. To enable the librarian pages for a demo account, use a trusted MongoDB admin shell:

```javascript
db.users.updateOne(
  { username: "your-librarian-username" },
  { $set: { role: "librarian" } }
)
```

Sign out and back in to reload the role. The API independently enforces librarian permissions.

## Tests and build

```powershell
npm test
npm run build
```

The tests cover fine calculations, booking overlap/date rules, and FIFO waitlist eligibility and position.

## Suggested walkthrough

1. Register a patron and browse/search the Kenyan catalogue.
2. Save an available book and request a copy.
3. Join the waitlist for a checked-out title and inspect your position on **Waitlist**.
4. Reserve a study space, then try another time that partially overlaps.
5. Promote a demo account to librarian, sign in again, and demonstrate catalogue, loan, fine, and booking management.

## Waitlist API

All waitlist endpoints require a signed-in account. Queue order is determined by the server, and a later reader cannot borrow ahead of the first reader.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/waitlist` | View your queue positions and current availability |
| `POST` | `/api/waitlist/:bookId` | Join a checked-out title's queue |
| `DELETE` | `/api/waitlist/:bookId` | Leave your queue position |

## Security and configuration

Set `MONGODB_URI` and a private `JWT_SECRET` in `.env`; configure `FRONTEND_ORIGIN` to the exact browser origin when hosting the API. Never commit credentials or claim a deployment is live until both services have been deployed and verified.
