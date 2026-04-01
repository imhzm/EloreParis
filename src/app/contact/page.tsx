import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl } from "@/lib/site-content";
import {
  contactChannels,
  contactFaq,
  contactPreparation,
  contactUseCases,
} from "@/lib/support-content";
import styles from "../trust/trust-detail.module.css";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "صفحة دعم احترافية توضّح متى يستخدم الزائر التواصل المباشر، وما البدائل الأسرع داخل تجربة Cozmateks.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        name: "تواصل معنا",
        description:
          "صفحة توضح متى يجب استخدام التواصل المباشر، وماذا يجب تحضيره قبل المراسلة، وما البدائل الأسرع داخل الواجهة.",
        inLanguage: "ar-SA",
        url: absoluteUrl("/contact"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "الرئيسية",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "تواصل معنا",
            item: absoluteUrl("/contact"),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: contactFaq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/contact">
        <div className={styles.page}>
          <section className={styles.hero}>
            <article className={styles.heroPanel}>
              <p className={styles.eyebrow}>Contact</p>
              <h1>تواصلي معنا عندما تحتاج الحالة فعلًا إلى تدخل بشري واضح</h1>
              <p className={styles.summary}>
                صفحة التواصل هنا لا تبدأ من نشر قناة فقط، بل من شرح متى يكون التواصل
                هو القرار الصحيح، وما الذي يجب تحضيره، وما الصفحات التي قد تحل السؤال أسرع.
              </p>
            </article>

            <aside className={styles.statusCard}>
              <p className={styles.eyebrow}>Publication note</p>
              <h2>القنوات النهائية لا تُعرض إلا بعد اعتمادها تشغيليًا</h2>
              <ul className={styles.statusList}>
                <li>لا يتم نشر بريد أو رقم أو قناة خدمة قبل تحديد المالك التشغيلي لها.</li>
                <li>كل قناة نهائية يجب أن ترتبط بوقت رد متوقع ومسار متابعة واضح.</li>
                <li>حتى ذلك الحين، تبقى هذه الصفحة إطارًا احترافيًا للنشر لا ادعاءً بجهوزية غير موجودة.</li>
              </ul>
            </aside>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>When to contact</p>
                <h2>الحالات التي تستحق التواصل المباشر</h2>
                <ul className={styles.pointList}>
                  {contactUseCases.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>Support paths</p>
                <h2>أفضل مسار لكل نوع من الأسئلة</h2>
                <div className={styles.sectionList}>
                  {contactChannels.map((channel) => (
                    <section key={channel.title} className={styles.sectionBlock}>
                      <h3>{channel.title}</h3>
                      <p>{channel.body}</p>
                      <p>{channel.note}</p>
                      <TrackedLink
                        href={channel.href}
                        analyticsLabel={`contact_channel_${channel.href.replaceAll("/", "_").replace(/^_+/, "")}`}
                        analyticsSurface="contact_channels"
                        analyticsDestinationType={channel.destinationType}
                      >
                        {channel.label}
                      </TrackedLink>
                    </section>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.linkCard}>
                <p className={styles.eyebrow}>Before you reach out</p>
                <h2>معلومات تسرّع الفرز والرد</h2>
                <ul className={styles.pointList}>
                  {contactPreparation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className={styles.linkCard}>
                <p className={styles.eyebrow}>Fast alternatives</p>
                <h2>بدائل قد تكون أسرع من التواصل العام</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/faq"
                    analyticsLabel="contact_to_faq"
                    analyticsSurface="contact_sidebar"
                    analyticsDestinationType="faq"
                  >
                    <span>الأسئلة الشائعة</span>
                    <span>لأكثر الأسئلة تكرارًا</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/track-order"
                    analyticsLabel="contact_to_track_order"
                    analyticsSurface="contact_sidebar"
                    analyticsDestinationType="order_tracking"
                  >
                    <span>تتبع الطلب</span>
                    <span>للطلبات القائمة</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/trust"
                    analyticsLabel="contact_to_trust"
                    analyticsSurface="contact_sidebar"
                    analyticsDestinationType="trust"
                  >
                    <span>مركز الثقة والسياسات</span>
                    <span>للسياسات والبيانات المرجعية</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>Contact FAQ</p>
            <h2>أسئلة متكررة حول صفحة التواصل نفسها</h2>
            <div className={styles.faqList}>
              {contactFaq.map((item) => (
                <article key={item.question} className={styles.faqItem}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
