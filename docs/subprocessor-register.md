# Unterauftragsverarbeiter-Verzeichnis

Stand: 25.02.2026  
Hinweis: Dieses Verzeichnis ist eine operative Übersicht und keine Rechtsberatung.

## Zweck
Dieses Dokument listet die eingesetzten Unterauftragsverarbeiter und Infrastrukturpartner, soweit sie für den Betrieb von Advaic relevant sind.

## Register
| Anbieter | Zweck | Datenkategorien | Region/Transfer | Rechtsgrundlage/Schutz |
|---|---|---|---|---|
| Supabase | Datenbank, Auth, Storage, Backend-Betrieb | Kontodaten, Konfigurationsdaten, Nachrichtenmetadaten, Dateien | EU oder außerhalb EU je Projekt-Setup | AVV, ggf. SCC bei Drittlandtransfer |
| Microsoft (Graph/Outlook) | E-Mail-Integration und Versand über angebundene Postfächer | E-Mail-Inhalte, Header, Thread-Metadaten | EU/EEA oder Drittland je Tenant | Microsoft Vertragsrahmen, ggf. SCC |
| Google (Gmail API) | E-Mail-Integration und Versand über angebundene Postfächer | E-Mail-Inhalte, Header, Thread-Metadaten | EU/EEA oder Drittland je Workspace | Google Vertragsrahmen, ggf. SCC |
| OpenAI (Azure OpenAI) | KI-Klassifikation, Entwurfs- und Qualitätslogik | Nachrichtenauszüge, Kontextdaten nach Prompt-Design | abhängig von Azure-Region | AVV/Vertragsrahmen, SCC bei Bedarf |
| Stripe | Abrechnung, Checkout, Rechnungs- und Zahlungsereignisse | Kundendaten, Abodaten, Zahlungsstatus | global, inklusive Drittland möglich | Stripe DPA, SCC/weitere Schutzmaßnahmen |
| Slack (optional) | Benachrichtigungen und Support-Workflows | Ereignisdaten, Metadaten, ggf. Nachrichtenauszüge | global, inkl. Drittland möglich | Vertragsrahmen + Konfigurationskontrolle |
| Resend (optional) | Versand von System-E-Mails | Empfängeradresse, Betreff, Systeminhalt | abhängig vom Anbieter-Setup | DPA/AVV, SCC bei Bedarf |

## Update-Prozess
1. Jede neue Integration wird vor Produktivschaltung im Register ergänzt.
2. Änderungen an Regionen/Transferbasis werden mit Datum nachgeführt.
3. Änderungen werden in Datenschutz- und Vertragsunterlagen gespiegelt.

## Versionierung
- Initiale Version: 25.02.2026
