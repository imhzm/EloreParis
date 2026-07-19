import { notFound } from "next/navigation";
import { LocalizedTrustSupportDetail } from "@/components/localized-trust-support-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/site-content";
import { buildTrustSupportMetadata, buildTrustSupportSchema } from "@/lib/trust-support-page-data";
import { getEffectiveTrustSupportRecord } from "@/lib/site-content-authority";
type Props={params:Promise<{locale:string}>};
export const dynamic="force-dynamic";
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?buildTrustSupportMetadata(locale,"/terms",getEffectiveTrustSupportRecord(locale,"terms")):{};}
export default async function Page({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const record=getEffectiveTrustSupportRecord(locale,"terms");return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(buildTrustSupportSchema(locale,"/terms",record))}}/><StorefrontShell activeHref="/terms" locale={locale} languageHref={`/${locale==="ar"?"en":"ar"}/terms`}><LocalizedTrustSupportDetail locale={locale} record={record} parentHref="/trust"/></StorefrontShell></>;}
