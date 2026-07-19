import { notFound } from "next/navigation";
import { LocalizedJournalArticle } from "@/components/localized-journal-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, locales } from "@/lib/i18n";
import { getJournalRecord } from "@/lib/journal-content";
import { buildJournalMetadata, buildJournalSchema } from "@/lib/journal-page-data";
import { journalSlugs } from "@/lib/journal-routing";
import { serializeJsonLd } from "@/lib/site-content";
import { getEffectiveJournalContent } from "@/lib/site-content-authority";
type Props={params:Promise<{locale:string;slug:string}>};
export const dynamic="force-dynamic";
export function generateStaticParams(){return locales.flatMap((locale)=>journalSlugs.map((slug)=>({locale,slug})));}
export async function generateMetadata({params}:Props){const{locale,slug}=await params;if(!isLocale(locale)||!getJournalRecord(locale,slug))return{};const authority=getEffectiveJournalContent(locale);const record=journalSlugs.includes(slug as (typeof journalSlugs)[number])?authority.records[slug as (typeof journalSlugs)[number]]:null;return record?buildJournalMetadata(locale,record,authority.copy.hub):{};}
export default async function Page({params}:Props){const{locale,slug}=await params;if(!isLocale(locale)||!getJournalRecord(locale,slug))notFound();const authority=getEffectiveJournalContent(locale);const record=authority.records[slug as (typeof journalSlugs)[number]];if(!record)notFound();const records=journalSlugs.map((entry)=>authority.records[entry]);const related=records.filter((entry)=>entry.slug!==record.slug).slice(0,2);return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(buildJournalSchema(locale,records,record,authority.copy.hub))}}/><StorefrontShell activeHref="/journal" locale={locale} languageHref={`/${locale==="ar"?"en":"ar"}/journal/${slug}`}><LocalizedJournalArticle locale={locale} record={record} relatedArticles={related} copy={authority.copy.detail} interfaceCopy={authority.interfaceCopy.detail}/></StorefrontShell></>;}
