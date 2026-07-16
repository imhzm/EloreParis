import { notFound } from "next/navigation";
import { LocalizedJournalArticle } from "@/components/localized-journal-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, locales } from "@/lib/i18n";
import { getJournalRecord, journalContent } from "@/lib/journal-content";
import { buildJournalMetadata, buildJournalSchema } from "@/lib/journal-page-data";
import { journalSlugs } from "@/lib/journal-routing";
type Props={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams(){return locales.flatMap((locale)=>journalSlugs.map((slug)=>({locale,slug})));}
export async function generateMetadata({params}:Props){const{locale,slug}=await params;if(!isLocale(locale))return{};const record=getJournalRecord(locale,slug);return record?buildJournalMetadata(locale,record):{};}
export default async function Page({params}:Props){const{locale,slug}=await params;if(!isLocale(locale))notFound();const record=getJournalRecord(locale,slug);if(!record)notFound();const records=journalSlugs.map((entry)=>journalContent[locale][entry]);const related=records.filter((entry)=>entry.slug!==record.slug).slice(0,2);return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(buildJournalSchema(locale,records,record))}}/><StorefrontShell activeHref="/journal" locale={locale} languageHref={`/${locale==="ar"?"en":"ar"}/journal/${slug}`}><LocalizedJournalArticle locale={locale} record={record} relatedArticles={related}/></StorefrontShell></>;}
