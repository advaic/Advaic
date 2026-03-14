# Interner Commercial Access

Stand: 11. März 2026

## Ziel

Interne Test- und Owner-Accounts sollen Premium-Zugriff erhalten können, ohne dass im Produktcode eine feste Sonder-ID hinterlegt ist.

## Konfigurationsquellen

### Owner-Zugriff

Für Owner-geschützte Bereiche wie CRM oder interne Admin-Routen gelten nur diese Env-Variablen:

- `ADVAIC_OWNER_USER_IDS`
- `ADVAIC_OWNER_USER_ID`
- `ADMIN_DASHBOARD_USER_IDS`
- `ADMIN_DASHBOARD_USER_ID`

Mehrere IDs können komma-separiert gepflegt werden.

### Interner Premium-Zugriff

Für Billing-Gates und kommerzielle Produktfreischaltung gelten zusätzlich:

- `ADVAIC_INTERNAL_PREMIUM_USER_IDS`
- `ADVAIC_INTERNAL_PREMIUM_USER_ID`

Owner-IDs zählen automatisch ebenfalls als interne Premium-Accounts.

## Laufzeitverhalten

- Owner-Zugriff steuert geschützte interne Bereiche.
- Interner Premium-Zugriff behandelt einen Account kommerziell wie `paid_active`.
- In der Billing-UI wird das neutral als `Interner Zugriff` dargestellt.
- Es gibt keinen hart codierten Fallback-Owner und keine feste produktive Sonder-ID im Runtime-Code.

## Betroffene Codepfade

- [ownerAccess.ts](/Users/kilianziemann/Downloads/advaic-dashboard/lib/auth/ownerAccess.ts)
- [commercial-access.ts](/Users/kilianziemann/Downloads/advaic-dashboard/lib/billing/commercial-access.ts)
- [route.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/api/billing/summary/route.ts)
- [proxy.ts](/Users/kilianziemann/Downloads/advaic-dashboard/proxy.ts)
- [page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/konto/abo/page.tsx)

## Pflegehinweise

- Neue interne Premium-Accounts immer per Env konfigurieren.
- Wenn später eine Entitlement-Tabelle eingeführt wird, soll sie diese Env-Logik ersetzen, nicht ergänzen.
- Sichtbare UI-Texte sollen neutral bleiben und keine technische Sonderrolle wie `Owner-Override` zeigen.
