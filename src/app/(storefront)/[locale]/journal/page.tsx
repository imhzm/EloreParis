import { notFound } from "next/navigation";
import { LocalizedJournalHub } from "@/components/localized-journal-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import { buildJournalMetadata, buildJournalSchema } from "@/lib/journal-page-data";
import { journalSlugs } from "@/lib/journal-routing";
import { serializeJsonLd } from "@/lib/site-content";
import { getEffectiveJournalContent } from "@/lib/site-content-authority";
type Props={params:Promise<{locale:string}>};
export const dynamic="force-dynamic";
export async function generateMetadata({params}:Props){const{locale}=await params;if(!isLocale(locale))return{};const authority=getEffectiveJournalContent(locale);return buildJournalMetadata(locale,undefined,authority.copy.hub);}
export default async function Page({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const authority=getEffectiveJournalContent(locale);const records=journalSlugs.map((slug)=>authority.records[slug]);return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(buildJournalSchema(locale,records,undefined,authority.copy.hub))}}/><StorefrontShell activeHref="/journal" locale={locale} languageHref={`/${locale==="ar"?"en":"ar"}/journal`}><LocalizedJournalHub locale={locale} records={records} copy={authority.copy.hub} interfaceCopy={authority.interfaceCopy} heroImage={authority.heroImage}/></StorefrontShell></>;}
