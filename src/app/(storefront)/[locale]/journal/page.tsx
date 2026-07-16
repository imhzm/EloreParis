import { notFound } from "next/navigation";
import { LocalizedJournalHub } from "@/components/localized-journal-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import { journalContent } from "@/lib/journal-content";
import { buildJournalMetadata, buildJournalSchema } from "@/lib/journal-page-data";
import { journalSlugs } from "@/lib/journal-routing";
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?buildJournalMetadata(locale):{};}
export default async function Page({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const records=journalSlugs.map((slug)=>journalContent[locale][slug]);return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(buildJournalSchema(locale,records))}}/><StorefrontShell activeHref="/journal" locale={locale} languageHref={`/${locale==="ar"?"en":"ar"}/journal`}><LocalizedJournalHub locale={locale} records={records}/></StorefrontShell></>;}
