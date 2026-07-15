import { notFound } from "next/navigation";
import { LocalizedTrustSupportDetail } from "@/components/localized-trust-support-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import { buildTrustSupportMetadata, buildTrustSupportSchema } from "@/lib/trust-support-page-data";
import { supportContent } from "@/lib/trust-support-content";
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?buildTrustSupportMetadata(locale,"/terms",supportContent[locale].terms):{};}
export default async function Page({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const record=supportContent[locale].terms;return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(buildTrustSupportSchema(locale,"/terms",record))}}/><StorefrontShell activeHref="/terms" locale={locale} languageHref={`/${locale==="ar"?"en":"ar"}/terms`}><LocalizedTrustSupportDetail locale={locale} record={record} parentHref="/trust"/></StorefrontShell></>;}
