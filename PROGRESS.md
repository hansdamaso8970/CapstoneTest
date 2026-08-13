# PROGRESS.md

This file gives anyone reading it the context needed to work on this project without re-explaining it from scratch.
Always change this file for any further changes, and document it.

## Project

**AssetSync** — an IoT-based smart asset management system built for DLSU-D's AAMO (Asset and Materials Office) warehouse. Assets in the warehouse are tagged with Ntag215 NFC tags; an ESP32 fitted with a PN532 NFC module reads a tag when an item is checked in or out, and the reading is logged so staff can see what's in the warehouse, what's on loan, and what's overdue.

Full intended stack: ESP32 + PN532 (hardware reader) → ASP.NET Core MVC backend → MongoDB Atlas (data store) → a BYOD (bring-your-own-device) web interface staff and faculty use from any browser.

The Register page is now connected to a live MongoDB Atlas database. The Scan page and the rest of the app still run on mock data.

## Current architecture

This is a Visual Studio ASP.NET Core MVC project, built and run through Visual Studio rather than as a static site.

```
AssetSync/
└── AssetSync/
    └── CapstoneFrontend/
        ├── Controllers/
        │   ├── AssetController.cs        ← Register(), Scan(), CheckTag(), SaveAsset()
        │   └── HomeController.cs         ← Index(), Privacy(), Error()
        ├── Models/
        │   ├── Asset.cs                  ← MongoDB document shape: TagId, ProductName, Category, DateAcquired, Status
        │   ├── ErrorViewModel.cs
        │   └── MongoDBSettings.cs        ← binds the MongoDB config section (ConnectionString, DatabaseName)
        ├── Services/
        │   └── AssetService.cs           ← talks to the Assets collection: GetByTagIdAsync(), InsertAsync()
        ├── Views/
        │   ├── Asset/
        │   │   ├── Register.cshtml       ← Fig 6, asset registration — now calls the real API
        │   │   └── Scan.cshtml           ← Fig 5, scan & evaluate — still mock data
        │   ├── Home/
        │   │   ├── Index.cshtml          ← dashboard + report generator
        │   │   └── Privacy.cshtml
        │   ├── Shared/
        │   │   ├── _Layout.cshtml        ← header/sidebar/main shell
        │   │   ├── _ValidationScriptsPartial.cshtml
        │   │   └── Error.cshtml
        │   ├── _ViewImports.cshtml
        │   └── _ViewStart.cshtml
        ├── wwwroot/
        │   ├── css/
        │   │   └── site.css              ← design system: vars, cards, forms, workflow panels
        │   ├── js/
        │   │   └── site.js
        │   ├── favicon.ico
        │   └── lib/                      ← bootstrap, jquery, jquery-validation (not yet used by any view)
        ├── appsettings.json               ← documents the MongoDB config shape, no real credentials
        ├── secrets.json (User Secrets)    ← holds the real Atlas connection string, not committed to Git
        └── Program.cs                    ← app startup, routing, MongoDB service registration
```

Routing is convention-based MVC, not a single-page app: `HomeController` serves `/` (dashboard) and `/Home/Privacy`; `AssetController` serves `/Asset/Register`, `/Asset/Scan`, plus the two new JSON endpoints `/Asset/CheckTag` and `/Asset/SaveAsset`.

## MongoDB Atlas setup (done)

- Created an Atlas account and a project named **AssetSync**.
- Created a free-tier (M0) cluster, also named **AssetSync**, using Automate Security Setup (which created a database user and whitelisted the local IP automatically).
- Retrieved the connection string from Atlas: Database → Clusters → Connect → Drivers → C#/.NET.
- Connection string format:
  ```
  mongodb+srv://<username>:<password>@assetsync.p4zdicr.mongodb.net/?appName=AssetSync
  ```
  The `<username>` and `<password>` placeholders (angle brackets included) must be replaced with the real credentials — leaving the brackets in was the cause of the first connection failure (see Troubleshooting below).
- Installed the `MongoDB.Driver` NuGet package in `CapstoneFrontend`.
- Stored the real connection string in **User Secrets** (`secrets.json`, outside the project folder, never committed to Git):
  ```json
  {
    "MongoDB": {
      "ConnectionString": "mongodb+srv://<real-username>:<real-password>@assetsync.p4zdicr.mongodb.net/?appName=AssetSync",
      "DatabaseName": "AssetSync"
    }
  }
  ```
- Added a matching placeholder (empty `ConnectionString`) to `appsettings.json` so the config shape is documented for anyone else on the project.

## Code changes (done)

1. **`Models/MongoDBSettings.cs`** — new class, binds the `MongoDB` config section (`ConnectionString`, `DatabaseName`).
2. **`Models/Asset.cs`** — new class, the MongoDB document shape: `Id`, `TagId`, `ProductName`, `Category`, `DateAcquired`, `Status` (defaults to `"Registered"`).
3. **`Services/AssetService.cs`** — new class. Opens a `MongoClient` using the bound settings, gets the `AssetSync` database, and exposes `GetByTagIdAsync(tagId)` and `InsertAsync(asset)` against the `Assets` collection. MongoDB creates the collection automatically on first insert.
4. **`Program.cs`** — registered the settings and service:
   ```csharp
   builder.Services.Configure<MongoDBSettings>(
       builder.Configuration.GetSection("MongoDB"));
   builder.Services.AddSingleton<AssetService>();
   ```
5. **`Controllers/AssetController.cs`** — added a constructor that injects `AssetService`, plus two endpoints:
   - `CheckTag(string tagId)` (GET) — returns `{ exists: true/false }`.
   - `SaveAsset(Asset asset)` (POST) — inserts the asset and returns `{ success: true }`.
   `Register()` and `Scan()` are unchanged, they still just return their views.
6. **`Views/Asset/Register.cshtml`** — replaced the mock `existingTags` array and mock `db` object with real `fetch()` calls to `/Asset/CheckTag` and `/Asset/SaveAsset`. Added `id` attributes (`asset-name`, `asset-category`, `date-acquired`) to the three detail inputs so the script can read their values. Added a guard so clicking "Verify Tag" with an empty field shows a message instead of sending a blank request.

## Troubleshooting log

- **`MongoDB.Driver.MongoAuthenticationException: Unable to authenticate using sasl protocol mechanism SCRAM-SHA-1`** — hit this on the first test of the Register page. Cause: the connection string in `secrets.json` still had the literal placeholder text `<new-user>:<password123>`, angle brackets included, instead of the real Atlas username and password. Fix: remove the angle brackets and use the real credentials, e.g. `new-user:password123`. After fixing and fully restarting the app (User Secrets are only read on startup, not on hot reload), the Register page authenticated successfully and wrote a test document to the `Assets` collection.

## Known gaps / not yet built

1. **Scan & Evaluate still runs on mock data.** `Scan.cshtml` hasn't been wired to `AssetService` yet — same pattern as Register, just not done.
2. **No real NFC integration.** Both the scan and register pages simulate a read with a text input; the actual ESP32/PN532 event stream isn't wired in.
3. **No Assets list, Reports, or Users & Admin views yet.** Only the dashboard, Register, and Scan pages exist.
4. **No auth/login screen yet.** Every visitor currently sees every view and all data, with no session or role gate.
5. **`_Layout.cshtml` duplicates `wwwroot/css/site.css`.** The layout has its own inline `<style>` block that repeats variables and rules already in `site.css`. Still worth removing.
6. **Bootstrap and jQuery are present but unused.** `wwwroot/lib` includes bootstrap, jquery, and jquery-validation, but no view references them yet.
7. **No responsive testing done yet.**
8. **No try/catch around the MongoDB calls yet.** `CheckTag` and `SaveAsset` will currently throw an unhandled exception (as seen during the SCRAM-SHA-1 debugging) if the database call fails for any reason, rather than returning a clean error to the page.
9. **Small race condition in Register.** `CheckTag` and `SaveAsset` are separate calls, so two people registering the same tag at the same moment could both pass the check before either saves. Fine for a capstone demo, worth a note if written up.

## Not yet decided

- Whether the project keeps this multi-page MVC shape or adds more views per role (Admin vs Warehouse Staff vs Faculty Requester) once auth is added.
- Exact MongoDB schema for `users` and `activity` — `Asset` is defined and live, but the other two collections aren't designed yet.
- Whether reports need a real charting library once there's live data volume, or a simpler approach is enough for the capstone's scope.
- Field naming convention for MongoDB documents. The driver currently serializes C# property names as-is (`TagId`, not `tagId`) unless `[BsonElement]` attributes are added — worth locking this down against the Chapter 3 data model before more collections are built.

## Next steps (planned order)

1. ~~Scaffold the ASP.NET Core MVC project: controllers, dashboard, Register and Scan views~~ — **done**.
2. ~~Connect the Register page to MongoDB Atlas~~ — **done**.
3. Wire `Scan.cshtml` to `AssetService` the same way Register was done: replace the mock `db` lookup with a call to `GetByTagIdAsync`, and add a controller endpoint to log the safekeeping/transfer/disposal outcome.
4. Add try/catch handling around the MongoDB calls in `AssetController` so a connection or query failure returns a clean JSON error instead of an unhandled exception.
5. Clean up `_Layout.cshtml` to remove the duplicate inline styles and rely on `site.css`.
6. Design MongoDB Atlas schema for `users` and `activity` (align with the capstone's data model docs / Chapter 3 write-up).
7. Add the missing views: Assets list, standalone Reports, Users & Admin.
8. Connect the ESP32 + PN532 reader — define the event payload it pushes on a scan, replace the scan/register mock lookups with a live listener (WebSocket or short-poll).
9. Add auth (login screen + session) and gate views by role (Admin / Warehouse Staff / Faculty Requester).

## Working conventions

- Keep controller logic thin — actions return views or JSON; business logic and data access belong in service classes like `AssetService`, not the controller itself.
- Store any real credentials (connection strings, API keys) in User Secrets, never in `appsettings.json` or committed files. `appsettings.json` should only document the expected shape with empty values.
- Any new user-facing text should stay consistent with the existing status/label vocabulary used in the Register and Scan views, rather than introducing new ad hoc labels.
- New views should follow the existing pattern: add a `.cshtml` file under the right controller's `Views/` folder, a controller action that returns it, and a sidebar link in `_Layout.cshtml`.
- New MongoDB-backed features should follow the Register pattern: a model in `Models/`, a method on the relevant service in `Services/`, a JSON endpoint on the controller, and a `fetch()` call from the view's script block.


## Database Access

Username: new-user
password: sX4FuBUmfp8AGr2v

mongodb+srv://<db_username>:<db_password>@assetsync.p4zdicr.mongodb.net/?appName=AssetSync

