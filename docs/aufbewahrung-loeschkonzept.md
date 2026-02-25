# Aufbewahrungs- und Löschkonzept

Stand: 25.02.2026

## Ziel
Daten nur so lange speichern, wie es für Betrieb, Vertrag und rechtliche Pflichten erforderlich ist.

## Datenklassen (operativer Rahmen)
| Datenklasse | Zweck | Standardlöschung | Trigger |
|---|---|---|---|
| Nachrichten- und Verlaufseinträge | Anfragebearbeitung, Nachvollziehbarkeit | bei Kontolöschung oder Ablauf definierter Fristen | Account-Delete, Retention-Job |
| Integrationsdaten (OAuth, Verknüpfungen) | Provider-Anbindung | bei Trennung der Integration oder Kontolöschung | Disconnect/Account-Delete |
| Dateien/Anhänge/Bilder | Arbeitsmaterial, Objektbezug | bei Kontolöschung, Objektlöschung oder Fristablauf | Delete-Flow + Purge |
| Billing-Daten | Vertrags- und Abrechnungszwecke | gemäß gesetzlichen Aufbewahrungspflichten | gesetzliche Fristen |
| Betriebs- und Alert-Logs | Stabilität, Sicherheit, Incident-Analyse | nach intern definierter Frist | Retention-Job |

## Technischer Ist-Stand
- Kontolöschung und Storage-Purge sind im Delete-Flow umgesetzt:
  - [app/api/account/delete/route.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/api/account/delete/route.ts)

## Offene organisatorische Festlegung
- Verbindliche Fristen je Tabelle/Bucket in Tagen/Monaten.
- Automatischer Retention-Job mit Audit-Log.

## Review
- Halbjährliche Prüfung der Fristen.
- Sofortreview bei neuen Datenkategorien.
