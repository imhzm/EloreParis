"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TrackedLink } from "@/components/tracked-link";
import type { TrustPolicyRecord } from "@/lib/site-content";
import styles from "./cinematic-trust-experience.module.css";

type Route = { href: string; label: string; description: string; type: string };
type Props =
  | { mode: "hub"; policies: TrustPolicyRecord[]; supportRoutes: Route[] }
  | { mode: "detail"; policy: TrustPolicyRecord; siblings: TrustPolicyRecord[]; routes: Route[] };

const imageBySlug: Record<string, string> = {
  verification: "/brand-assets/product-01.jpg",
  privacy: "/brand-assets/product-06.jpg",
  shipping: "/brand-assets/product-04.jpg",
  returns: "/brand-assets/product-03.jpg",
  authenticity: "/brand-assets/product-05.jpg",
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function CinematicTrustExperience(props: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-trust-scene]"));
    let raf = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(rect.height - innerHeight, 1));
        const active = rect.top <= 0 && rect.bottom >= innerHeight;
        scene.dataset.state = rect.top > 0 ? "before" : rect.bottom < innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", String(progress));
        scene.querySelector<HTMLElement>("[data-trust-frame]")?.classList.toggle(styles.fixed, active);
      });
      raf = 0;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (props.mode === "hub") {
    return (
      <main ref={rootRef} className={styles.experience}>
        <section className={`${styles.scene} ${styles.hero}`} data-trust-scene>
          <div className={styles.frame} data-trust-frame>
            <div className={styles.seal} aria-hidden="true">
              <i />
              <b>COZMATEKS<br />TRUST</b>
            </div>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Trust center</p>
              <h1>الثقة تبدأ قبل الضغط على «شراء».</h1>
              <span>السياسات، التوثيق، والدعم في مكان واحد يوضح ما هو متاح الآن وما ينتظر الاعتماد.</span>
              <a href="#trust-layers">استعرضي الطبقات <b aria-hidden="true">↓</b></a>
            </div>
            <em className={styles.counter}>01 / 04</em>
          </div>
        </section>

        <section className={`${styles.scene} ${styles.manifesto}`} data-trust-scene>
          <div className={styles.frame} data-trust-frame>
            <div className={styles.rings} aria-hidden="true"><i /><i /></div>
            <div className={styles.centerCopy}>
              <p className={styles.eyebrow}>Operational honesty</p>
              <h2>لا أرقام شكلية.<br />لا وعود بلا تشغيل.</h2>
              <span>نعرض الهيكل كاملًا، لكن لا ننشر بيانات منشأة أو رسومًا أو مواعيد نهائية قبل التحقق منها واعتمادها.</span>
            </div>
            <em className={styles.counter}>02 / 04</em>
          </div>
        </section>

        <section className={`${styles.scene} ${styles.layers}`} data-trust-scene id="trust-layers">
          <div className={styles.frame} data-trust-frame>
            <header>
              <p className={styles.eyebrow}>طبقات الثقة</p>
              <h2>كل سياسة تجيب عن نوع مختلف من القلق.</h2>
            </header>
            <div className={styles.policyRail}>
              {props.policies.map((policy, index) => (
                <TrackedLink
                  key={policy.slug}
                  href={`/trust/${policy.slug}`}
                  analyticsLabel={`trust_hub_${policy.slug}`}
                  analyticsSurface="trust_cinematic_layers"
                  analyticsDestinationType="trust_policy"
                >
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <strong>{policy.title}</strong>
                  <span>{policy.summary}</span>
                  <b aria-hidden="true">↗</b>
                </TrackedLink>
              ))}
            </div>
            <em className={styles.counter}>03 / 04</em>
          </div>
        </section>

        <section className={`${styles.scene} ${styles.final}`} data-trust-scene>
          <div className={styles.frame} data-trust-frame>
            <div className={styles.finalCopy}>
              <p className={styles.eyebrow}>الدعم عندما تحتاجينه</p>
              <h2>السياسة توضّح.<br />الدعم يكمل.</h2>
            </div>
            <div className={styles.routeGrid}>
              {props.supportRoutes.map((route) => (
                <TrackedLink
                  key={route.href}
                  href={route.href}
                  analyticsLabel={`trust_support_${route.type}`}
                  analyticsSurface="trust_cinematic_support"
                  analyticsDestinationType={route.type}
                >
                  <small>{route.type}</small>
                  <strong>{route.label}</strong>
                  <span>{route.description}</span>
                  <b aria-hidden="true">↗</b>
                </TrackedLink>
              ))}
            </div>
            <em className={styles.counter}>04 / 04</em>
          </div>
        </section>
      </main>
    );
  }

  const { policy } = props;
  const image = imageBySlug[policy.slug] ?? "/brand-assets/product-02.jpg";

  return (
    <main ref={rootRef} className={styles.experience}>
      <section className={`${styles.scene} ${styles.policyHero}`} data-trust-scene>
        <div className={styles.frame} data-trust-frame>
          <div className={styles.policyImage} aria-hidden="true">
            <Image src={image} alt="" fill priority sizes="(max-width: 760px) 76vw, 36vw" />
          </div>
          <div className={styles.policyHeroCopy}>
            <p className={styles.eyebrow}>سياسة مرجعية</p>
            <h1>{policy.title}</h1>
            <span>{policy.summary}</span>
            <TrackedLink
              href="/trust"
              analyticsLabel={`trust_policy_${policy.slug}_back`}
              analyticsSurface="trust_policy_hero"
              analyticsDestinationType="trust"
            >
              مركز الثقة
            </TrackedLink>
          </div>
          <em className={styles.counter}>01 / 04</em>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.policyScope}`} data-trust-scene>
        <div className={styles.frame} data-trust-frame>
          <div className={styles.scopeCopy}>
            <p className={styles.eyebrow}>نطاق النسخة الحالية</p>
            <h2>{policy.body}</h2>
          </div>
          <div className={styles.points}>
            {policy.points.map((point, index) => (
              <article key={point}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <p>{point}</p>
              </article>
            ))}
          </div>
          <em className={styles.counter}>02 / 04</em>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.policySections}`} data-trust-scene>
        <div className={styles.frame} data-trust-frame>
          <header>
            <p className={styles.eyebrow}>تفاصيل السياسة</p>
            <h2>ما الذي يجب أن يكون واضحًا؟</h2>
          </header>
          <div className={styles.sectionStack}>
            {policy.sections.map((section, index) => (
              <article key={section.heading}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
          <em className={styles.counter}>03 / 04</em>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.policyFinal}`} data-trust-scene>
        <div className={styles.frame} data-trust-frame>
          <div className={styles.faq}>
            <p className={styles.eyebrow}>أسئلة شائعة</p>
            <h2>إجابات قبل الانتقال.</h2>
            {policy.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <div className={styles.related}>
            <p className={styles.eyebrow}>المسار التالي</p>
            {props.routes.map((route) => (
              <TrackedLink
                key={route.href}
                href={route.href}
                analyticsLabel={`trust_policy_${policy.slug}_${route.type}`}
                analyticsSurface="trust_policy_routes"
                analyticsDestinationType={route.type}
              >
                <small>{route.type}</small>
                <strong>{route.label}</strong>
                <span>{route.description}</span>
              </TrackedLink>
            ))}
            {props.siblings.slice(0, 3).map((item) => (
              <TrackedLink
                key={item.slug}
                href={`/trust/${item.slug}`}
                analyticsLabel={`trust_policy_${policy.slug}_sibling_${item.slug}`}
                analyticsSurface="trust_policy_siblings"
                analyticsDestinationType="trust_policy"
              >
                <small>سياسة مرتبطة</small>
                <strong>{item.title}</strong>
              </TrackedLink>
            ))}
          </div>
          <em className={styles.counter}>04 / 04</em>
        </div>
      </section>
    </main>
  );
}
