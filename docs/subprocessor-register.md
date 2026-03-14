# Unterauftragsverarbeiter-Verzeichnis

Stand: 25.02.2026  
Hinweis: Dieses Verzeichnis ist eine operative Übersicht und keine Rechtsberatung.

## Zweck
Dieses Dokument listet die eingesetzten Unterauftragsverarbeiter und Infrastrukturpartner, soweit sie für den Betrieb von Advaic relevant sind.

## Register
| Anbieter | Zweck | Datenkategorien | Region/Transfer | Rechtsgrundlage/Schutz |
|---|---|---|---|---|
| Supabase | Datenbank, Auth, Storage, Backend-Betrieb | Kontodaten, Konfigurationsdaten, Nachrichtenmetadaten, Dateien | Für Advaic wird ein rein europäisches Projekt-Setup gewählt | AVV; europäische Serverregion bewusst gewählt, um den DSGVO-Betrieb ohne unnötigen Drittlandpfad aufzusetzen |
| Microsoft (Graph/Outlook) | E-Mail-Integration und Versand über angebundene Postfächer | E-Mail-Inhalte, Header, Thread-Metadaten | Advaic nutzt einen europäischen Tenant-/Serverpfad; bei kundenseitig angebundenen Microsoft-Postfächern bleibt die jeweilige Tenant-Region zusätzlich relevant | Vertragsrahmen; europäische Konfiguration wird bevorzugt, bei abweichendem Kundentenant sind zusätzliche Transferprüfungen möglich |
| Google (Gmail API) | E-Mail-Integration und Versand über angebundene Postfächer | E-Mail-Inhalte, Header, Thread-Metadaten | Advaic setzt auf einen europäischen Betriebsrahmen; bei kundenseitig angebundenen Google-Workspaces hängt die tatsächliche Region zusätzlich vom Workspace-Setup ab | Vertragsrahmen; europäische Konfiguration wird bevorzugt, bei abweichendem Workspace sind zusätzliche Transferprüfungen möglich |
| OpenAI (Azure OpenAI) | KI-Klassifikation, Entwurfs- und Qualitätslogik | Nachrichtenauszüge, Kontextdaten nach Prompt-Design | Für Advaic wird eine europäische Azure-Region gewählt | Vertragsrahmen; europäische Azure-Region bewusst gewählt, damit kein unnötiger außereuropäischer Hostingpfad entsteht |
| Stripe | Abrechnung, Checkout, Rechnungs- und Zahlungsereignisse | Kundendaten, Abodaten, Zahlungsstatus | Für Advaic wird ein europäischer Abrechnungsrahmen bevorzugt; Stripe bleibt als globaler Zahlungsanbieter dennoch ein potenzieller Transferfall | Stripe DPA; europäische Konfiguration wo steuerbar, bei globalem Zahlungsnetz zusätzlich Transferprüfung und Vertragsgarantien |
| Slack (optional) | Benachrichtigungen und Support-Workflows | Ereignisdaten, Metadaten, ggf. Nachrichtenauszüge | Wenn Slack genutzt wird, wird ein europäischer Workspace bevorzugt; der Dienst bleibt technisch ein globaler Anbieter | Vertragsrahmen; europäische Workspace-Wahl wo möglich, ansonsten gesonderte Transferprüfung |
| Resend (optional) | Versand von System-E-Mails | Empfängeradresse, Betreff, Systeminhalt | abhängig vom Anbieter-Setup | DPA/AVV, SCC bei Bedarf |

## Update-Prozess
1. Jede neue Integration wird vor Produktivschaltung im Register ergänzt.
2. Änderungen an Regionen/Transferbasis werden mit Datum nachgeführt.
3. Änderungen werden in Datenschutz- und Vertragsunterlagen gespiegelt.

## Versionierung
- Initiale Version: 25.02.2026
