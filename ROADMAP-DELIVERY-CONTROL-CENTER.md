# Roadmap Delivery Control Center

## 1) الهدف من الملف

هذا الملف هو **لوحة التحكم التنفيذية** للمشروع، وليس مجرد وصف.

يستخدم للمتابعة اليومية على:

- ماذا تم فعلا
- ماذا يتبقى فعلا
- نسبة الإنجاز الحقيقية
- من يعمل على ماذا
- ما هي خطوة التنفيذ التالية مباشرة

المرجع الاستراتيجي الأساسي يبقى: [roadmap.md](roadmap.md)

---

## 2) Snapshot الحالي

- تاريخ آخر تحديث: `2026-05-21`
- التصنيف: `Public-facing Ecommerce + Internal Ops`
- المرحلة الحالية: `Validation + Release Preparation`
- الباك النشط: `Priority 3 / Pack 06`
- الشريحة النشطة: `Launch and compliance closure (Pack 06)`
- حالة المحتوى: `provisional`
- حالة الحماية: `implementation-ready`
- نسبة الإنجاز الكلية (Roadmap-wide): `92.7%`
- جاهزية الإطلاق: `not launch-ready`

---

## 3) كيف تُحسب نسبة الإنجاز

النسبة لا تعتمد على عدد الصفحات، بل على Workstreams موزونة:

`overall = Σ(weight × progress) / 100`

### توزيع الإنجاز الحالي

| Workstream | الوزن | التقدم |
| --- | ---: | ---: |
| RW-01 Strategy/Positioning | 8% | 85% |
| RW-02 Legal/Trust/Compliance | 7% | 56% |
| RW-03 IA/Taxonomy/Public Routes | 10% | 92% |
| RW-04 Category/PDP/CRO | 10% | 100% |
| RW-05 Content/Commercial Copy | 12% | 100% |
| RW-06 Journal/Editorial Program | 8% | 100% |
| RW-07 SEO/Schema/Internal Linking | 12% | 100% |
| RW-08 Backend/Providers/Commerce Authority | 14% | 100% |
| RW-09 Admin/Dashboard/Ops Ownership | 9% | 100% |
| RW-10 Release/Deployment/Monitoring | 6% | 80% |
| RW-11 CRM/Growth Automation | 4% | 75% |

الناتج الحالي: `92.7%`

تمت إعادة ضبط الرقم الكلي على المعادلة المنشورة هنا بعد رفع `RW-01` إلى `85%` (إغلاق visual polish والجوال)، و`RW-03` إلى `92%` (إغلاق البحث والربط الداخلي)، و`RW-09` إلى `100%` (إغلاق dashboard بالكامل)، و`RW-10` إلى `80%` (تحسينات الأداء والـ health APIs)، و`RW-11` إلى `75%` (إغلاق newsletter/back-in-stock/analytics). المتبقي للإطلاق يقع بالكامل ضمن `Pack 06` (الإطلاق والاعتمادات الخارجية والبيانات الفعلية).

---

## 4) قواعد التنفيذ الإلزامية (تشغيل فعلي)

1. لا يتم اعتبار أي صفحة "done" لأنها موجودة فقط.
2. لا يتم رفع النسبة قبل Validation حقيقي.
3. التنفيذ يكون على Slices واضحة وقابلة للمراجعة.
4. لكل Slice: تعديل + تحقق + تحديث trackers في نفس الدورة.
5. لا يوجد "إغلاق نظري" بدون Evidence.

---

## 5) Definition of Done (حتى لا تكون صفحات فارغة)

أي Surface لا تُعتبر مكتملة إلا عند تحقق البنود التالية:

1. Intent واضح للصفحة (Audience + Decision).
2. محتوى فعلي غير Placeholder.
3. ربط داخلي مقصود (Concern/Ingredient/Routine/Product/Journal).
4. CTA أو Next Step واضح.
5. Metadata + Schema مناسبة للسياق.
6. Analytics events مرتبطة فعلا بالرحلة.
7. اجتياز التحقق الفني.

---

## 6) دورة التشغيل لكل Slice

### Step A: Scope Lock

- تحديد مخرجات الشريحة بدقة
- تحديد الملفات المتأثرة
- تحديد Acceptance Criteria

### Step B: Implementation

- تنفيذ التغيير الأدنى الصحيح
- منع التغييرات الجانبية غير المطلوبة

### Step C: Validation

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

ثم فحص runtime:

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3056/api/health
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3056/<changed-route>
```

### Step D: Tracking Update

تحديث الملفات التالية مباشرة بعد نجاح التحقق:

- [ROADMAP-EXECUTION-TRACKER.md](ROADMAP-EXECUTION-TRACKER.md)
- [ROADMAP-OPERATING-PLAYBOOK.md](ROADMAP-OPERATING-PLAYBOOK.md)
- [CONTENT-EXECUTION-MATRIX.md](CONTENT-EXECUTION-MATRIX.md)
- [JOURNAL-EDITORIAL-BACKLOG.md](JOURNAL-EDITORIAL-BACKLOG.md)
- هذا الملف

---

## 7) خطة التنفيذ المرحلية (Roadmap Router)

1. `Discovery`
2. `Design/Architecture`
3. `Implementation`
4. `Validation`
5. `Release`
6. `Growth/Automation`

الحالة الحالية:

- Discovery: مكتمل تشغيليا
- Design/Architecture: مستمر بتحسينات جزئية
- Implementation: الشق البرمجي الأساسي أُغلق عبر Public + Ops + Backend
- Validation: نشط على مستوى release candidate والـ trackers
- Release: نشط (blocked على live deployment + production provider credentials + legal/business approvals)
- Growth/Automation: جزئي بعد التثبيت التشغيلي

---

## 8) الآن ماذا نعمل بالضبط (Immediate Execution Queue)

### Closed: Pack 03 / Storefront Conversion Depth

هذا الباك أغلق تعميق التحويل داخل الـ storefront الفعلي بدون توسيع shell جديد:

تم إغلاق أول slice حقيقي في Pack 03 على:
- `/shop/skincare`
- `/shop/makeup`
- `/products/[slug]`

وتم إغلاق slice ثانية حقيقية على:
- `src/components/product-purchase-panel.tsx`
- `/cart`

وتم إغلاق slice ثالثة حقيقية على:
- `src/components/checkout-review.tsx`
- `/checkout`

وتم إغلاق slice رابعة حقيقية على:
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `/checkout/success`
- `/track-order`

وتم إغلاق slice خامسة حقيقية على:
- `src/app/shop/[slug]/page.tsx`
- `/shop/haircare`
- `/shop/bodycare`
- `/shop/tools`
- `/shop/beauty-sets`

وتم إغلاق slice سادسة حقيقية على:
- `src/app/shop/page.tsx`
- `src/app/concerns/page.tsx`
- `/shop`
- `/concerns`

وتم إغلاق slice سابعة حقيقية على:
- `src/components/product-purchase-panel.tsx`
- `src/components/checkout-review.tsx`
- `/products/[slug]`
- `/checkout`

وتم إغلاق slice ثامنة حقيقية على:
- `src/components/cart-surface.tsx`
- `/cart`

1. أُغلقت slice ثامنة حقيقية في Pack 03 على `/cart`.
2. route-level closure داخل Pack 03 أصبح مكتملًا فعليًا عبر PDP و`/cart` و`/checkout` و`/checkout/success` و`/track-order` وroutes المجموعات والهَبّات.
3. ما تبقى الآن انتقل من storefront decision depth إلى backend/providers/admin ownership، لا إلى مزيد من shell-level storefront edits.
4. owner-backed legal/business data داخل `/faq` و`/contact` و`/terms` و`/trust/[slug]` يظل بلوكر إطلاق مستقل.

### Closed: Priority 1 / RW-08 + RW-09 transition

The first validated `RW-08 transition` slice shipped on:
- `src/lib/ops-catalog.ts`
- `src/components/catalog-ops-surface.tsx`
- `/ops/catalog`

The second validated `RW-08 transition` slice shipped on:
- `src/lib/fulfillment.ts`
- `src/components/checkout-review.tsx`
- `src/components/orders-ops-surface.tsx`
- `/checkout`
- `/ops/orders`

The third validated `RW-08 transition` slice shipped on:
- `src/lib/provider-integration-contract.ts`
- `src/lib/release-packet.ts`
- `src/components/ops-release-surface.tsx`
- `scripts/smoke-check.mjs`
- `/ops/release`
- `/api/ops/release/packet`

The fourth validated `RW-08 transition` slice shipped on:
- `src/lib/release-readiness.ts`
- `src/lib/release-package.ts`
- `src/lib/release-package-types.ts`
- `scripts/smoke-check.mjs`
- `/api/ops/release/package`
- `/api/ops/release/packet`

The fifth validated `RW-08 transition` slice shipped on:
- `src/lib/orders.ts`
- `src/lib/order-authority.ts`
- `src/lib/fulfillment.ts`
- `src/lib/provider-runtime-config.ts`
- `src/app/api/ops/orders/[orderNumber]/provider/route.ts`
- `src/app/api/providers/payment/route.ts`
- `src/app/api/providers/shipping/route.ts`
- `src/components/orders-ops-surface.tsx`
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `scripts/smoke-check.mjs`

The sixth validated `RW-08 transition` slice shipped on:
- `src/lib/order-authority.ts`
- `src/app/api/orders/[orderNumber]/route.ts`
- `src/lib/provider-integration-contract.ts`
- `src/components/track-order-surface.tsx`
- `scripts/smoke-check.mjs`

The seventh validated `RW-08 transition` slice shipped on:
- `src/lib/orders.ts`
- `src/lib/order-authority.ts`
- `src/app/api/ops/orders/[orderNumber]/provider/route.ts`
- `src/app/api/providers/payment/route.ts`
- `src/app/api/providers/shipping/route.ts`
- `src/lib/provider-integration-contract.ts`
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `scripts/smoke-check.mjs`

The eighth validated `RW-08 transition` slice shipped on:
- `src/lib/order-authority.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[orderNumber]/route.ts`
- `src/components/customer-orders-surface.tsx`
- `src/app/account/orders/page.tsx`
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `scripts/smoke-check.mjs`

The ninth validated `RW-08 transition` slice shipped on:
- `src/lib/order-authority.ts`
- `src/app/account/access/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[orderNumber]/route.ts`
- `src/lib/order-authority-client.ts`
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `src/lib/provider-integration-contract.ts`
- `scripts/smoke-check.mjs`

The tenth validated `RW-08 transition` slice shipped on:
- `src/lib/order-authority.ts`
- `src/lib/provider-runtime-config.ts`
- `src/app/account/access/route.ts`
- `src/app/api/providers/auth/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[orderNumber]/route.ts`
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `src/components/customer-orders-surface.tsx`
- `scripts/smoke-check.mjs`

The eleventh validated `RW-08 transition` slice shipped on:
- `src/lib/orders.ts`
- `src/lib/order-authority.ts`
- `src/lib/notification-dispatch.ts`
- `src/lib/provider-gateway.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/ops/notifications/[notificationId]/route.ts`
- `src/components/order-confirmation.tsx`
- `src/components/track-order-surface.tsx`
- `src/components/customer-orders-surface.tsx`
- `scripts/mock-provider-server.mjs`
- `scripts/smoke-check.mjs`

1. Catalog truth is no longer treated as static admin inventory only; it now exposes authority lanes, live-demand linkage, pending units, and supplier watch state from the same runtime contract.
2. The second provider-handoff slice made `/checkout` and `/ops/orders` expose the same payment lane, shipping lane, provider state, next owner, and blocker logic instead of diverging.
3. The third slice makes `/ops/release` and `/api/ops/release/packet` expose ops auth, guest order access, payment routing, and shipping execution as explicit integration lanes instead of generic provider debt notes.
4. The fourth slice makes those same lanes survive inside `releaseReadiness`, release-package blocker trails, and the executive packet review flow instead of disappearing once packet publication and decision review begin.
5. The fifth slice now persists provider-binding state per order, adds protected ops mutations plus signed payment/shipping callback routes, threads payment and tracking references into customer tracking surfaces, and forces `scripts/smoke-check.mjs` to walk the real payment-link and shipping callback lifecycle before status transitions are accepted.
6. The sixth slice keeps successful customer tracking alive through a durable same-device order-access session, refreshes that session after trusted lookups, and forces smoke to prove the session-only customer-access path before cross-device verification falls back.
7. The seventh slice turns payment and shipping callbacks into stricter settlement and carrier-booking contracts that persist explicit settlement references, booking references, tracking numbers, and carrier event ids instead of treating callbacks as status toggles only.
8. The eighth slice upgrades customer continuity into a verified `/account/orders` hub backed by a signed customer-access session, so the authority can now expose all same-customer orders on the current device instead of stopping at one-order tracking only.
9. The ninth slice adds signed `/account/access` handoff links, reuses the same verified customer-access contract across `/api/orders/[orderNumber]`, and makes smoke prove cross-device customer continuity instead of leaving customer access device-bound only.
10. The tenth slice routes signed `/account/access` links through `/api/providers/auth`, exchanges the handoff into provider-signed customer-account authority plus refreshed customer/order access cookies, and makes smoke prove that `/account/orders` and tracked-order API reads survive the provider-backed auth handoff across devices without reopening phone-last-four.
11. The eleventh slice now creates payment links at order creation through the provider gateway, dispatches queued notifications through the same provider contract, routes ops notification resends through real provider delivery instead of local status toggles, and makes smoke prove payment, shipping, notification, and auth execution end-to-end against the mock provider server.
12. The completed Priority 1 closure now also covers customer auth recovery continuity plus ops provider-backed RBAC, so access and operator ownership no longer stop at the provider-handoff slice alone.
13. The completed Priority 1 closure now also covers catalog truth + supplier authority continuity, so supplier ownership survives order creation and later operational reads instead of drifting with live catalog remaps.
14. The completed Priority 1 closure now also covers release-packet/runtime secret alignment, so protected release packages, drift review, and executive review tokens now see runtime secret truth instead of keeping it as side commentary only.
15. `Pack 05` is now closed on the core-programming side across payment, shipping, notifications, and auth, while live credentials and production cutover stay as separate release blockers.
16. `Pack 04` is now closed on the core-programming side across `/ops`, `/ops/orders`, `/ops/fulfillment`, `/ops/catalog`, `/ops/notifications`, `/ops/audit`, and `/ops/release`, so dashboard ownership no longer sits behind an unfinished implementation gap.
17. The correct next slice is now `Priority 3 / Pack 06: Launch and compliance closure`.

### Closed: Priority 2 / Pack 04 + Pack 05

1. `Priority 1` داخل انتقال `RW-08 / RW-09` أُغلق بالكامل.
2. `Pack 05` أُغلق برمجيًا داخل الكود والـ smoke contract عبر payment/shipping/notification/auth provider-backed flows.
3. `Pack 04` أُغلق برمجيًا داخل مسارات `/ops` الأساسية، وأصبح dashboard/core-admin ownership خارج منطقة النقص البرمجي المباشر.

### Active Now: Priority 3 / Pack 06

1. التركيز الحالي ينتقل إلى launch/compliance/deployment closure بدل إعادة فتح backend/dashboard scope.
2. المطلوب التالي هو live deployment + monitoring + rollback sign-off + production provider credentials/cutover.
3. الشق البرمجي الأساسي للـ Backend والـ Dashboard لم يعد هو البلوكَر الرئيسي.

### Closed: RW-01 + RW-07 programming closure

1. `RW-01` أُغلق برمجياً على مستوى الواجهة العامة عبر تطبيق الاتجاه الإبداعي `Pearl Veil Atelier` في الألوان والطباعة والحركة.
2. `RW-07` أُغلق برمجياً على مستوى الـ technical SEO/schema عبر metadata controls وJSON-LD وظهور snippet/image-preview controls على المسارات العامة المستهدفة.
3. الشريحتان لم تعودا ضمن طابور التنفيذ البرمجي النشط؛ البلوكَر الصحيح الآن هو `Pack 06`.

### Copy Pack C / Support-Legal hardening

تم إغلاق أول slice حقيقية من Copy Pack C على:
- `src/app/faq/page.tsx`
- `src/app/contact/page.tsx`
- `/faq`
- `/contact`

تم إغلاق slice ثانية حقيقية من Copy Pack C على:
- `src/app/terms/page.tsx`
- `src/app/trust/[slug]/page.tsx`
- `/terms`
- `/trust/[slug]`

1. route-level hardening داخل Copy Pack C أصبح مكتملًا على الأسطح الأربعة المستهدفة.
2. عدم اختراع business/legal data غير معتمدة، مع إبقاء `/terms` و`/trust/[slug]` في وضع `provisional` حتى تأتي owner-backed inputs.
3. إبقاء البلوكرز القانونية والتشغيلية ظاهرة بدل إخفائها داخل الصياغة.

### Acceptance Criteria لـ Pack 03

- تعميق PLP/PDP على routes موجودة فقط.
- إضافة blocks أو logic تدعم proof hierarchy وconversion objections.
- أي bundles / cross-sell تظل مرتبطة بمسارات ومكونات حقيقية فقط.
- اجتياز `typecheck + lint + build + runtime checks`.
- تحديث نسبة التقدم والـ trackers بعد التحقق.

---

## 9) ما بعد Pack 03 مباشرة

### Priority 1: RW-08 / RW-09 transition `closed`

- [x] customer auth recovery / ops provider-backed RBAC
- [x] catalog truth + supplier authority continuity
- [x] release-packet/runtime secret alignment

### Priority 2: Pack 04 + Pack 05 `closed`

- [x] Dashboard ownership حقيقي
- [x] Providers integration (payment/shipping/notification/auth)

### Priority 3: Pack 06 `active now`

- Launch and compliance closure
- Live deployment / monitoring / rollback / credentials cutover

---

## 10) Dashboard متابعة يومية (Template)

استخدم هذا القالب بعد كل Slice:

```md
### Slice: <name>
- Date:
- Scope:
- Changed files:
- Validation:
  - tsc:
  - lint:
  - build:
  - runtime:
- Workstreams affected:
- % delta:
- New blockers:
- Next slice:
```

---

## 11) Blockers المفتوحة التي تمنع الإطلاق الحقيقي

1. اعتماد business/legal content النهائي.
2. اعتماد brand/editorial voice samples.
3. اعتماد production credentials/cutover النهائي للمزودات وربطه ببيئة الإطلاق.
4. Live deployment + monitoring + rollback sign-off.
5. الإغلاق التشغيلي النهائي لـ release/runbook/rollback ownership.

---

## 12) العلاقة بين هذا الملف وباقي trackers

- هذا الملف: **تشغيل يومي تنفيذي + queue + gates**
- [ROADMAP-EXECUTION-TRACKER.md](ROADMAP-EXECUTION-TRACKER.md): النسبة الكلية الموزونة
- [ROADMAP-OPERATING-PLAYBOOK.md](ROADMAP-OPERATING-PLAYBOOK.md): سياسة التشغيل المرحلية
- [CONTENT-EXECUTION-MATRIX.md](CONTENT-EXECUTION-MATRIX.md): حالة المحتوى لكل route
- [JOURNAL-EDITORIAL-BACKLOG.md](JOURNAL-EDITORIAL-BACKLOG.md): خطة وتقدم المدونة

---

## 13) الحالة الصريحة الحالية

المشروع **ليس هيكل صفحات فقط** حاليا، لكنه أيضا **ليس جاهز إطلاق** بعد.

القراءة الصحيحة:

- Foundation قوي
- Content/Editorial يتقدم بشكل فعلي
- الشق البرمجي الأساسي للـ Ops/Backend أُغلق، والمتبقي الآن إطلاق وتشغيل واعتمادات خارجية
- النسبة الحالية: `85.7%`
