import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";

function fieldOrFallback(value: string | undefined, fallback = "Nicht angegeben") {
  const v = String(value || "").trim();
  return v || fallback;
}

export default function ImpressumPage() {
  const companyName = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME, "Advaic");
  const legalForm = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_FORM);
  const representedBy = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_REPRESENTED_BY);
  const street = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_ADDRESS_STREET);
  const zipCity = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_ADDRESS_ZIP_CITY);
  const country = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_ADDRESS_COUNTRY, "Deutschland");
  const registerCourt = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_REGISTER_COURT);
  const registerNumber = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_REGISTER_NUMBER);
  const vatId = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_VAT_ID);
  const contactEmail = fieldOrFallback(
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL,
    "support@advaic.com",
  );
  const contactPhone = fieldOrFallback(process.env.NEXT_PUBLIC_LEGAL_CONTACT_PHONE);

  return (
    <PageShell>
      <PageIntro
        kicker="Impressum"
        title="Anbieterkennzeichnung gemäß § 5 DDG"
        description="Angaben zum Diensteanbieter und zur Kontaktaufnahme."
        actions={
          <>
            <Link href="/datenschutz" className="btn-secondary">
              Datenschutz
            </Link>
            <a href={`mailto:${contactEmail}`} className="btn-primary">
              Kontakt aufnehmen
            </a>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-8 md:p-10">
            <h2 className="h2">Diensteanbieter</h2>
            <div className="helper mt-4 space-y-1">
              <p>
                <strong>{companyName}</strong>
              </p>
              <p>{legalForm}</p>
              <p>Vertreten durch: {representedBy}</p>
              <p>{street}</p>
              <p>{zipCity}</p>
              <p>{country}</p>
            </div>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Registerangaben</h3>
            <div className="helper mt-4 space-y-1">
              <p>Registergericht: {registerCourt}</p>
              <p>Registernummer: {registerNumber}</p>
              <p>USt-IdNr.: {vatId}</p>
            </div>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Kontakt</h3>
            <div className="helper mt-4 space-y-1">
              <p>
                E-Mail:{" "}
                <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </p>
              <p>Telefon: {contactPhone}</p>
            </div>
            <p className="helper mt-5">
              Für datenschutzrechtliche Anfragen nutzen Sie bitte die Angaben auf der{" "}
              <Link href="/datenschutz" className="underline underline-offset-4">
                Datenschutz-Seite
              </Link>
              .
            </p>
          </article>
        </Container>
      </section>
    </PageShell>
  );
}
