# ELORE Paris — Roadmap تنفيذ التصميم الجديد باستخدام Claude

**الإصدار:** 1.0  
**اللغة الأساسية:** العربية RTL مع دعم الإنجليزية LTR  
**المرجع البصري:** `reference/elore-home-concept.png`  
**نوع المشروع:** Luxury Beauty E-commerce Redesign  
**الأولوية:** جودة التجربة، وضوح التسلسل البصري، السرعة، وسهولة الشراء — وليس مجرد تقليد صورة ثابتة.

---

## 1) الهدف التنفيذي

إعادة بناء واجهة ELORE Paris بهوية أكثر تميزًا وفخامة مع الحفاظ على روح العلامة الحالية:

- Burgundy / Wine كلون أساسي.
- Warm Ivory / Sand للخلفيات.
- Gold accents بتوظيف محدود وراقي.
- صور Editorial تجمع بين الحجر، الحرير، الزجاج، الزهور والإضاءة الدافئة.
- تجربة عربية أصلية وليست نسخة معكوسة من الإنجليزية.
- واجهة سريعة، قابلة للتوسع، ومتصلة فعليًا ببيانات المنتجات والسلة والبحث.

النتيجة المطلوبة ليست “صفحة جميلة فقط”، بل **Design System + Component System + Commerce UX** يمكن استخدامه في الصفحة الرئيسية وباقي المتجر.

---

## 2) طريقة استخدام هذا الملف مع Claude

1. ضع هذا الملف في جذر المشروع باسم `CLAUDE.md`.
2. ضع الصورة المرجعية في المسار الموضح أعلاه أو ارفعها داخل جلسة Claude.
3. اطلب من Claude تنفيذ مرحلة واحدة فقط في كل مرة.
4. بعد كل مرحلة يجب تشغيل:
   - Lint
   - Type-check
   - Tests المتاحة
   - Production build
5. لا تنتقل إلى المرحلة التالية قبل إصلاح الأخطاء ومراجعة الشكل على Desktop وMobile.

> **قاعدة مهمة:** الصورة المرجعية هي Art Direction، وليست صورة يجب وضعها كخلفية أو تحويلها إلى صفحة واحدة غير قابلة للتفاعل. يجب إعادة بنائها باستخدام HTML/CSS/Components حقيقية.

---

## 3) نطاق العمل

### MVP — الإصدار الأول

- Header / Navigation / Mobile Menu.
- الصفحة الرئيسية كاملة.
- Collection listing.
- Product details.
- Search.
- Cart drawer / Cart page.
- Arabic + English.
- Responsive design.
- SEO وAccessibility أساسيان.
- ربط حقيقي ببيانات المنتجات الحالية.

### المرحلة التالية

- Ritual Builder / Quiz.
- Gift Finder.
- Wishlist.
- Customer account.
- Editorial Journal.
- Personalized recommendations.
- Advanced analytics and experimentation.

---

## 4) مبادئ التصميم غير القابلة للتفاوض

1. **Luxury does not mean clutter.** كل عنصر يجب أن يكون له سبب واضح.
2. لا تستخدم Gold في مساحات كبيرة؛ يقتصر على التفاصيل، الحدود، الأيقونات، والـ CTA الثانوي.
3. لا تستخدم أكثر من خطين أساسيين لكل لغة.
4. لا تضع نصوصًا مهمة داخل الصور.
5. يجب أن يكون كل عنصر تفاعلي قابلًا للاستخدام بالكيبورد.
6. استخدم CSS logical properties مثل `margin-inline` و`inset-inline-start` لدعم RTL/LTR.
7. لا تكرر نفس شكل البطاقة في كل الأقسام؛ استخدم نظامًا موحدًا مع Variants واضحة.
8. الأنيميشن يجب أن يكون هادئًا، قصيرًا، ويخدم الفهم.
9. لا تُخفِ الوظائف الأساسية خلف تأثيرات بصرية.
10. على Mobile يجب الحفاظ على هوية التصميم لا مجرد تصغير نسخة Desktop.

---

## 5) Phase 0 — فحص المشروع قبل كتابة الكود

على Claude تنفيذ Audit أولًا والإجابة بتقرير واضح يشمل:

- Framework الحالي وإصداره.
- نوع المتجر أو الـ Backend: Shopify / WooCommerce / Custom API / Static.
- أسلوب إدارة الـ CSS.
- نظام الـ Routing.
- مصدر بيانات المنتجات.
- نظام الترجمة الحالي.
- طريقة إدارة الصور والخطوط.
- مكونات Header, Product Card, Cart الحالية.
- نقاط الخطر قبل إعادة البناء.
- قائمة الملفات التي ستتغير في أول مرحلة.

### قرار المسار التقني

#### المسار A — Rebuild حديث

يفضّل عند السماح بإعادة البناء:

- Next.js + TypeScript.
- Tailwind CSS أو CSS Modules مع Design Tokens.
- Framer Motion للحركات المحدودة.
- Headless commerce API أو Storefront API.
- Server Components حيث تكون مناسبة.
- Client Components فقط للأجزاء التفاعلية.

#### المسار B — تطوير النظام الحالي

إذا كان المتجر قائمًا على Shopify Theme أو أي CMS تقليدي:

- الحفاظ على الـ Backend والـ Checkout الحاليين.
- تحويل التصميم إلى Sections / Snippets / Blocks قابلة للتحرير.
- عدم كسر Apps أو Tracking أو Schema الحالي.
- بناء Design Tokens مشتركة بدل CSS متناثر.

> لا يختار Claude المسار تلقائيًا قبل فحص المستودع.

---

## 6) خريطة الموقع المقترحة

```text
/ar
/en
├── shop / المتجر
│   ├── collections / المجموعات
│   ├── perfumes / العطور
│   ├── skincare / العناية بالبشرة
│   ├── makeup / المكياج
│   ├── body-care / العناية بالجسم
│   └── accessories / الإكسسوارات
├── collection/[slug]
├── product/[slug]
├── rituals / الطقوس
├── gifts / الهدايا
├── journal / المجلة
├── about / عن إيلوريه
├── search / البحث
├── cart / السلة
├── account / الحساب — لاحقًا
└── policies / السياسات
```

يجب أن يكون الـ Navigation مختصرًا؛ لا تُعرض كل الروابط في المستوى الأول.

---

## 7) بنية الصفحة الرئيسية

### 7.1 Header

**Desktop:**

- ارتفاع تقريبي: 76–88px.
- الشعار في المنتصف أو داخل منطقة واضحة بصريًا.
- روابط أساسية قليلة.
- اللغة والعملة في جهة، والبحث/الحساب/السلة في الجهة المقابلة.
- Sticky بعد بداية التمرير.
- خلفية Ivory مع Blur بسيط عند Scroll.
- Mega menu للمتجر فقط، وليس لكل رابط.

**Mobile:**

- Logo + Menu + Search + Cart.
- Drawer كامل الارتفاع.
- Accordion للفئات.
- زر اللغة ظاهر بدون إخفائه في عمق القائمة.

**Definition of Done:**

- لا يوجد Layout shift عند تثبيت الـ Header.
- الـ Focus states واضحة.
- السلة تعرض العدد الصحيح.
- الاتجاهات والأيقونات تنعكس بصورة صحيحة في RTL/LTR.

---

### 7.2 Hero — المشهد الرئيسي

المرجع يعتمد على Composition غير تقليدي:

- Brand rail داكن في الجانب.
- Product still-life في المنتصف.
- Headline كبير في منطقة Ivory.
- Burgundy ribbon يربط أجزاء المشهد.
- Pagination رأسي 01–04.
- CTA رئيسي واضح.
- Organic / curved shapes بدل مستطيل تقليدي.

**التنفيذ المطلوب:**

- Hero بارتفاع 75–88vh على Desktop، مع حد أدنى مناسب.
- استخدام `<picture>` أو image component محسّن.
- المحتوى النصي HTML حقيقي.
- Slide واحد ممتاز أفضل من Carousel ثقيل؛ استخدم Carousel فقط عند وجود محتوى حقيقي لأكثر من حملة.
- إذا استُخدم Carousel:
  - توقف الحركة عند Hover/Focus.
  - يدعم Swipe.
  - لا يبدأ Auto-play بسرعة مزعجة.
- CTA أساسي: استكشاف المجموعة.
- CTA ثانوي: اكتشاف الطقوس.

**Mobile adaptation:**

- تحويل المشهد إلى Stack مقصود:
  1. صورة المنتج.
  2. Headline + Copy.
  3. CTA.
- إخفاء الـ Brand rail أو تحويله إلى Label صغير.
- Pagination أفقي.
- تجنب ارتفاع Hero يتجاوز الشاشة بشكل مبالغ.

---

### 7.3 Bento Commerce Navigation

قسم متداخل جزئيًا مع نهاية الـ Hero داخل Container كبير بحواف ناعمة.

**الصف الأول:**

- Intro tile.
- العطور.
- العناية بالبشرة.
- المكياج.
- العناية بالجسم.
- الهدايا.

**الصف الثاني:**

- Ritual card بلون Burgundy.
- Editorial image card.
- Beauty journal / consultation card.
- Gifting story card.
- Brand quote card.

**سلوك البطاقات:**

- Hover: Zoom طفيف للصورة + انتقال السهم + رفع بسيط.
- لا تستخدم Shadow ثقيل.
- كل Card رابط كامل.
- Overlay متدرج يحافظ على القراءة.
- نسبة الصور موحدة داخل كل Variant.

**Mobile:**

- بطاقات الفئات تتحول إلى Horizontal snap rail أو Grid من عمودين.
- البطاقات التحريرية Stack بعرض كامل.
- لا تعتمد على Hover لإظهار معلومات أساسية.

---

### 7.4 Best Sellers

- عنوان مختصر + رابط “عرض الكل”.
- Product rail من 4 بطاقات Desktop، 2 Tablet، و1.2–1.4 Mobile.
- Quick add لا يظهر إلا عند توفر اختيار واحد مباشر.
- المنتج متعدد الخيارات يفتح اختيارًا واضحًا بدل إضافته بصورة خاطئة.
- عرض السعر، الاسم، الفئة، والحالة مثل New / Bestseller.

---

### 7.5 Ritual Builder

قسم Editorial يشرح أن المنتج جزء من طقس كامل، وليس عنصرًا منفصلًا.

- 3 خطوات بصرية: اكتشفي → خصّصي → ابدئي طقسك.
- CTA يبدأ Quiz قصير.
- يمكن إطلاق MVP كرابط إلى صفحة ثابتة، ثم تطوير Quiz لاحقًا.

---

### 7.6 Gifting

- Gift wrap imagery.
- خيارات: هدية جاهزة، بطاقة إهداء، اختيار حسب المناسبة.
- CTA واضح.
- لا تعرض وعودًا غير متوفرة في العمليات الحالية.

---

### 7.7 Trust / Service Strip

شريط Burgundy/Pill يعرض 4–5 مزايا حقيقية فقط، مثل:

- توصيل موثوق.
- تغليف فاخر.
- مكونات مختارة بعناية.
- دعم العملاء.
- إرجاع حسب السياسة الفعلية.

يجب ربط النص بالسياسات الحقيقية قبل النشر.

---

### 7.8 Brand Story + Social Proof

- فقرة قصيرة عن العلامة.
- اقتباس عميل أو Press mention موثّق.
- صور حقيقية أو UGC بموافقة الاستخدام.
- تجنب أرقام وهمية مثل “10,000 عميلة” ما لم تكن موثقة.

---

### 7.9 Newsletter + Footer

**Newsletter:**

- Value proposition واضح.
- حقل Email واحد.
- Consent text.
- Success / Error states.

**Footer:**

- Shop.
- Help.
- About.
- Policies.
- Social links.
- Country / Language.
- Payment and legal information عند الحاجة.

---

## 8) Design Tokens

### 8.1 Color Palette

تم اختيار القيم التالية لتقارب الصورة المرجعية، ثم يجب ضبطها بعد اختبار Contrast على المتصفح:

```css
:root {
  --color-wine-950: #120305;
  --color-wine-900: #25080C;
  --color-wine-800: #371319;
  --color-wine-700: #521A25;
  --color-wine-600: #6B2632;

  --color-ivory-50: #F8F5F2;
  --color-ivory-100: #F1E9E3;
  --color-sand-200: #E1D1C4;
  --color-sand-300: #CEB49F;
  --color-taupe-500: #A78A77;

  --color-gold-400: #C7A36D;
  --color-gold-500: #B8935E;
  --color-gold-600: #9C7646;

  --color-ink: #1C1011;
  --color-muted: #765F58;
  --color-white: #FFFFFF;
  --color-error: #A23A3A;
  --color-success: #386B52;
}
```

### 8.2 Typography

**اقتراح مجاني وآمن كبداية:**

- Arabic Display: `Noto Naskh Arabic` أو خط العلامة المرخّص.
- Arabic UI/Body: `IBM Plex Sans Arabic`.
- Latin Display: `Cormorant Garamond`.
- Latin UI/Body: `Inter` أو `Manrope`.

```css
--font-display-ar: "Noto Naskh Arabic", serif;
--font-body-ar: "IBM Plex Sans Arabic", sans-serif;
--font-display-en: "Cormorant Garamond", serif;
--font-body-en: "Inter", sans-serif;
```

**Scale مقترح:**

- Hero: `clamp(3rem, 6vw, 7.5rem)`.
- H2: `clamp(2rem, 4vw, 4.25rem)`.
- H3: `clamp(1.4rem, 2vw, 2.2rem)`.
- Body large: 18–20px.
- Body: 15–17px.
- Labels: 11–13px مع Letter spacing مناسب للإنجليزية فقط.

### 8.3 Spacing

استخدم مقياسًا ثابتًا:

```text
4, 8, 12, 16, 24, 32, 48, 64, 80, 112, 144
```

### 8.4 Radius

```css
--radius-sm: 12px;
--radius-md: 20px;
--radius-lg: 32px;
--radius-xl: 48px;
--radius-pill: 999px;
```

### 8.5 Borders and Shadows

- Border: لون Wine/Gold بشفافية 12–25%.
- Shadow: كبير وناعم جدًا، مع Opacity منخفضة.
- لا تستخدم Glow أو Drop shadow أسود قوي.

---

## 9) Responsive Specification

### Breakpoints إرشادية

```text
Mobile: 320–767
Tablet: 768–1023
Laptop: 1024–1439
Wide: 1440+
```

### قواعد عامة

- `max-width` رئيسي بين 1440 و1600 حسب المحتوى.
- Padding أفقي:
  - Mobile: 16–20px.
  - Tablet: 32px.
  - Desktop: 48–72px.
- لا تعتمد على Fixed heights إلا في المشاهد المصورة المحكومة.
- استخدم `aspect-ratio` للصور والبطاقات.
- اختبر العرض عند 390px و768px و1024px و1440px و1920px.

---

## 10) RTL وLocalization

- تحديد `dir="rtl"` للعربية و`dir="ltr"` للإنجليزية على عنصر `<html>`.
- استخدم dictionaries أو i18n framework، لا تكتب النصوص داخل المكونات مباشرة.
- صِغ العربية طبيعيًا، لا تعتمد على ترجمة حرفية.
- الأرقام والأسعار والعملة حسب Locale.
- الأسهم الاتجاهية يجب أن تنعكس.
- ترتيب Breadcrumbs وPagination يجب أن يتوافق مع الاتجاه.
- استخدم `text-align: start` بدل `left/right`.
- اختبر أسماء منتجات طويلة بالعربية والإنجليزية.

### نموذج مفاتيح ترجمة

```json
{
  "nav.home": "الرئيسية",
  "nav.shop": "المتجر",
  "nav.rituals": "الطقوس",
  "hero.eyebrow": "ÉLORE PARIS",
  "hero.title": "جمالٌ يروي تجربة.",
  "hero.body": "حوّلي لحظاتك اليومية إلى طقوس من الجمال والعناية.",
  "hero.primaryCta": "اكتشفي المجموعة",
  "hero.secondaryCta": "اكتشفي الطقوس"
}
```

---

## 11) Component Architecture

```text
components/
├── layout/
│   ├── SiteHeader
│   ├── DesktopNavigation
│   ├── MobileNavigationDrawer
│   ├── MegaMenu
│   ├── SearchDialog
│   ├── CartDrawer
│   └── SiteFooter
├── home/
│   ├── HeroStage
│   ├── HeroBrandRail
│   ├── HeroMedia
│   ├── HeroContent
│   ├── HeroPagination
│   ├── BentoCommerceGrid
│   ├── CategoryCard
│   ├── EditorialCard
│   ├── RitualFeature
│   ├── GiftFeature
│   ├── BestSellerRail
│   ├── TrustStrip
│   └── NewsletterPanel
├── commerce/
│   ├── ProductCard
│   ├── ProductPrice
│   ├── ProductBadge
│   ├── VariantSelector
│   ├── QuantitySelector
│   ├── AddToCartButton
│   └── CollectionFilters
├── ui/
│   ├── Button
│   ├── IconButton
│   ├── Container
│   ├── SectionHeading
│   ├── Badge
│   ├── Dialog
│   ├── Drawer
│   └── FormField
└── motion/
    ├── Reveal
    ├── ImageReveal
    └── ReducedMotionProvider
```

### قواعد المكونات

- كل Component له مسؤولية واحدة.
- Variants typed بدل Class strings عشوائية.
- لا تنسخ Product Card لكل صفحة.
- فصل بيانات المحتوى عن العرض.
- توحيد Empty, Loading, Error states.
- Icons بصيغة SVG Components موحدة.

---

## 12) Data Contracts

يجب أن يحدد Claude Interfaces واضحة، مثال:

```ts
interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  price: Money;
  compareAtPrice?: Money;
  images: ProductImage[];
  badge?: 'new' | 'bestseller' | 'limited';
  availableForSale: boolean;
  defaultVariantId?: string;
}

interface HomeCategoryCard {
  id: string;
  title: string;
  eyebrow?: string;
  href: string;
  image: ResponsiveImage;
  theme: 'light' | 'dark' | 'wine';
  size: 'standard' | 'wide' | 'editorial';
}
```

لا تربط المكونات مباشرة بشكل بيانات API خام؛ استخدم Adapter/Mapper layer.

---

## 13) Motion System

### مسموح

- Fade + Translate من 12–24px.
- Image scale من 1 إلى 1.03 على Hover.
- Clip-path reveal بسيط.
- Stagger محدود للبطاقات.
- Header blur transition.
- Ribbon parallax خفيف جدًا على Desktop فقط.

### غير مسموح

- Scroll hijacking.
- Animations طويلة تمنع التفاعل.
- حركة تلقائية مستمرة لكل العناصر.
- Parallax ثقيل على Mobile.
- تأخير ظهور المحتوى الأساسي.

### Durations

```text
Controls: 160–220ms
Cards: 240–360ms
Section reveals: 450–700ms
Page transitions: 300–450ms
```

احترم `prefers-reduced-motion` بالكامل.

---

## 14) Accessibility

- Heading hierarchy صحيح: H1 واحد.
- Landmark elements: header, nav, main, footer.
- Alt text يشرح الصورة عندما تكون ذات معنى.
- الصور الزخرفية `alt=""`.
- Focus ring واضح ولا يُحذف.
- Contrast مناسب للنصوص الصغيرة.
- Buttons ليست Divs.
- Dialogs وDrawers تحبس Focus وتعيده للعنصر السابق.
- Form errors مرتبطة بالحقول.
- لا تعتمد على اللون وحده لشرح الحالة.
- Carousel controls تحمل Labels واضحة.
- المنتج غير المتوفر يعرض حالة نصية مفهومة.

---

## 15) Performance

### أهداف القبول

- LCP ≤ 2.5s في اختبار مناسب.
- CLS ≤ 0.1.
- INP ≤ 200ms.
- Hero image optimized وResponsive.
- لا تُحمّل صور أسفل الصفحة مبكرًا.
- Preload للخطوط الضرورية فقط.
- تجنب تحميل مكتبات Animation كبيرة إذا لم تكن مطلوبة.
- تقليل Client JavaScript.
- Lazy-load للـ Mega Menu أو Dialogs الثقيلة عند الحاجة.

### الصور

- AVIF/WebP عند الدعم.
- `sizes` صحيح.
- أبعاد معروفة لمنع Layout shift.
- Mobile crops مستقلة للمشاهد الأساسية.
- لا تستخدم صورة Desktop ضخمة على الهاتف.

---

## 16) SEO وTracking

- Title وDescription لكل Route.
- Canonical URLs.
- `hreflang` للعربية والإنجليزية.
- Product / Breadcrumb / Organization structured data حسب البيانات الحقيقية.
- Open Graph images.
- Sitemap وRobots.
- Events أساسية:
  - view_item
  - select_item
  - add_to_cart
  - view_cart
  - begin_checkout
  - search
  - select_promotion
  - newsletter_signup

لا ترسل بيانات شخصية حساسة في Events.

---

## 17) Roadmap التنفيذية

### Milestone 0 — Audit & Architecture

**المدة التقديرية:** نصف يوم إلى يوم.

- [ ] فحص المستودع والمنصة.
- [ ] تحديد مسار التنفيذ.
- [ ] حصر المكونات القابلة لإعادة الاستخدام.
- [ ] تحديد مصدر المحتوى والصور.
- [ ] وضع قائمة مخاطر.
- [ ] اعتماد Folder structure.

**المخرج:** تقرير Architecture + خطة ملفات.

---

### Milestone 1 — Foundation & Design System

**المدة:** يوم.

- [ ] إضافة Tokens للألوان والمسافات والخطوط.
- [ ] ضبط RTL/LTR على مستوى التطبيق.
- [ ] بناء Container وButton وTypography primitives.
- [ ] تحميل الخطوط بطريقة محسّنة.
- [ ] إضافة Storybook أو صفحة `/style-guide` عند توفر الوقت.

**Definition of Done:**

- جميع الـ Tokens مركزية.
- لا توجد ألوان رئيسية Hard-coded داخل المكونات.
- أزرار Primary/Secondary/Ghost جاهزة.
- العربية والإنجليزية تعرضان بشكل صحيح.

---

### Milestone 2 — Header, Navigation, Search, Cart Shell

**المدة:** 1–1.5 يوم.

- [ ] Desktop Header.
- [ ] Mobile Drawer.
- [ ] Mega Menu.
- [ ] Search dialog.
- [ ] Cart drawer shell.
- [ ] Sticky behavior.
- [ ] Keyboard and focus behavior.

**Definition of Done:**

- يعمل على كل المقاسات.
- لا يوجد overflow أفقي.
- Drawer وDialog قابلان للاستخدام بالكيبورد.

---

### Milestone 3 — Hero Experience

**المدة:** 1–2 يوم.

- [ ] بناء الـ asymmetrical layout.
- [ ] Brand rail.
- [ ] Responsive image art direction.
- [ ] Headline and CTA.
- [ ] Pagination / slide state إن وُجد.
- [ ] Motion مع reduced-motion fallback.

**Definition of Done:**

- المشهد قريب من المرجع من حيث الإحساس والتوازن، وليس نسخًا حرفيًا.
- النص قابل للتحديد والقراءة.
- LCP image محسّنة.

---

### Milestone 4 — Bento Commerce Grid

**المدة:** 1.5–2 يوم.

- [ ] Category card variants.
- [ ] Editorial card variants.
- [ ] Responsive layout.
- [ ] Hover/focus states.
- [ ] CMS/API mapping.

**Definition of Done:**

- البطاقات تعمل كروابط كاملة.
- لا تعتمد المعلومات المهمة على Hover.
- الصور لا تتشوه.

---

### Milestone 5 — Homepage Commerce Sections

**المدة:** 1.5–2 يوم.

- [ ] Best sellers.
- [ ] Ritual builder teaser.
- [ ] Gifting section.
- [ ] Trust strip.
- [ ] Brand story/testimonial.
- [ ] Newsletter.
- [ ] Footer.

---

### Milestone 6 — Collection & Product Pages

**المدة:** 2–3 أيام.

- [ ] Collection header.
- [ ] Filtering and sorting.
- [ ] Product grid.
- [ ] Product gallery.
- [ ] Variant selection.
- [ ] Quantity and add to cart.
- [ ] Product details accordion.
- [ ] Related products.
- [ ] Sticky mobile purchase bar.

**Definition of Done:**

- اختيار الـ Variant صحيح.
- السعر والتوفر يتغيران حسب الاختيار.
- إضافة السلة تعمل مع الـ Backend الحقيقي.

---

### Milestone 7 — Localization, Responsive & Content QA

**المدة:** 1–1.5 يوم.

- [ ] مراجعة كل النصوص العربية.
- [ ] اختبار English LTR.
- [ ] اختبار أسماء طويلة.
- [ ] اختبار العملات.
- [ ] اختبار 390 / 768 / 1024 / 1440 / 1920.
- [ ] اختبار Landscape mobile.

---

### Milestone 8 — Performance, Accessibility & SEO

**المدة:** 1–1.5 يوم.

- [ ] Lighthouse / Web Vitals review.
- [ ] Keyboard-only QA.
- [ ] Screen-reader basics.
- [ ] Image optimization.
- [ ] Metadata and structured data.
- [ ] Remove unused JavaScript/CSS.

---

### Milestone 9 — Pre-launch QA & Release

**المدة:** يوم.

- [ ] Production build clean.
- [ ] No console errors.
- [ ] Broken link scan.
- [ ] Checkout smoke test.
- [ ] Analytics validation.
- [ ] Legal/policy links.
- [ ] Backup and rollback plan.
- [ ] Soft launch / staging approval.

### تقدير إجمالي

- Homepage فقط: تقريبًا 5–7 أيام عمل.
- MVP متجر متكامل: تقريبًا 11–15 يوم عمل.
- المدة تتغير حسب جودة الـ Backend، توفر الصور، وعدد الصفحات والمنتجات.

---

## 18) Definition of Done للمشروع

المشروع لا يُعتبر منتهيًا إلا عندما:

- [ ] الشكل متسق مع المرجع على Desktop دون استخدام الصورة كواجهة جاهزة.
- [ ] Mobile له Composition مخصص ومقنع.
- [ ] العربية والإنجليزية تعملان بالكامل.
- [ ] Header, Search, Cart, Collection, Product تعمل مع بيانات حقيقية.
- [ ] لا توجد نصوص Placeholder في Production.
- [ ] لا توجد صور مكسورة أو Layout shift ملحوظ.
- [ ] لا توجد أخطاء TypeScript أو Lint أو Build.
- [ ] جميع التفاعلات الأساسية قابلة للكيبورد.
- [ ] الأداء مقبول على شبكة وهاتف متوسطين.
- [ ] كل الادعاءات التسويقية والسياسات صحيحة.
- [ ] تم اختبار رحلة: Home → Collection → Product → Cart → Checkout.

---

## 19) بروتوكول عمل Claude

Claude يجب أن يعمل بالطريقة التالية في كل Milestone:

1. **Inspect:** اقرأ الملفات المرتبطة قبل التعديل.
2. **Plan:** اذكر الملفات التي ستُنشأ أو تتغير.
3. **Implement:** نفّذ المرحلة فقط، دون توسع غير مطلوب.
4. **Validate:** شغّل lint/typecheck/test/build.
5. **Review:** راجع RTL وMobile وAccessibility.
6. **Report:** اعرض ملخصًا، الملفات المتغيرة، وأي نقاط معلقة.

### محظورات

- لا تعِد كتابة المشروع بالكامل دون سبب.
- لا تغيّر API أو Checkout أو Tracking دون تنبيه.
- لا تستخدم مكتبة جديدة قبل توضيح الحاجة إليها.
- لا تضع بيانات منتجات وهمية في المسار النهائي.
- لا تستخدم `any` بلا ضرورة.
- لا تكرر CSS أو Components.
- لا تقرر نصوصًا تسويقية أو سياسات من عندك.
- لا تنفذ المرحلة التالية قبل نجاح Build الحالية.

---

## 20) Master Prompt جاهز لـ Claude

انسخ النص التالي إلى Claude بعد رفع المشروع والصورة المرجعية:

```text
أنت Senior Frontend Architect وLuxury E-commerce UI Engineer.

مهمتك تطوير موقع ELORE Paris اعتمادًا على ملف CLAUDE.md والصورة المرجعية المرفقة. اعتبر الصورة Art Direction وليست Screenshot يجب تحويلها إلى صورة خلفية. أعد بناء التجربة باستخدام مكونات حقيقية، HTML دلالي، CSS responsive، وبيانات التجارة الفعلية.

ابدأ فقط بمرحلة Milestone 0 — Audit & Architecture.

قبل كتابة أي كود:
1) افحص بنية المشروع والمنصة الحالية.
2) حدد Framework، نظام CSS، Routing، i18n، مصدر المنتجات، السلة والبحث.
3) حدد ما يمكن إعادة استخدامه وما يجب إعادة بنائه.
4) اقترح المسار التقني الأنسب بدون كسر Backend أو Checkout الحالي.
5) قدم قائمة الملفات التي ستتغير في Milestone 1.
6) اذكر المخاطر والأسئلة التي تمنع التنفيذ الصحيح.

لا تنفذ كودًا في هذه الخطوة. لا تفترض أن المشروع Next.js أو Shopify قبل الفحص.
```

---

## 21) Prompts المراحل

### بدء Milestone 1

```text
نفّذ Milestone 1 فقط من CLAUDE.md: Foundation & Design System.
ابدأ بذكر الملفات التي ستتغير، ثم نفّذ Tokens والخطوط وRTL/LTR وUI primitives.
بعد التنفيذ شغّل lint وtypecheck وbuild، وأصلح كل الأخطاء قبل التوقف.
لا تبدأ Header أو Hero بعد.
```

### بدء Milestone 2

```text
نفّذ Milestone 2 فقط: Header, Navigation, Search, Cart Shell.
حافظ على الوظائف الحالية للسلة والبحث. طبّق Desktop وMobile وKeyboard behavior.
اختبر RTL وLTR. شغّل التحقق الكامل ثم قدم ملخص الملفات والتغييرات.
```

### بدء Milestone 3

```text
نفّذ Milestone 3 فقط: Hero Experience.
استخدم الصورة المرجعية لتوجيه التكوين البصري: brand rail، product scene، ivory copy area، burgundy ribbon، CTA وpagination.
لا تستخدم الصورة المرجعية نفسها كخلفية للصفحة. استخدم أصول المشروع الحقيقية أو placeholders منفصلة قابلة للاستبدال.
نفّذ Desktop وMobile art direction، ثم اختبر الأداء وreduced motion.
```

### بدء Milestone 4

```text
نفّذ Milestone 4 فقط: Bento Commerce Grid.
ابنِ نظام Cards قابلًا لإعادة الاستخدام مع variants واضحة، واربطه ببيانات المحتوى بدل hardcoding داخل JSX.
اختبر hover/focus/mobile snap أو grid، ثم شغّل lint/typecheck/build.
```

### QA نهائي

```text
نفّذ مراجعة نهائية وفق Definition of Done في CLAUDE.md.
لا تضف Features جديدة. ابحث عن regressions، أخطاء RTL، overflow، مشاكل keyboard، CLS، صور غير محسنة، broken links، وأخطاء checkout/cart.
قدم تقرير Pass/Fail لكل بند، وأصلح البنود القابلة للإصلاح قبل إنهاء المهمة.
```

---

## 22) قائمة مراجعة بصرية دقيقة

### Desktop

- [ ] Header أبيض/عاجي هادئ مع توازن واضح.
- [ ] Logo غير مزدحم بالروابط.
- [ ] Hero غير متماثل ويملك نقطة تركيز واحدة.
- [ ] Burgundy ribbon يقود العين ولا يغطي المنتج أو النص.
- [ ] Headline كبير مع مساحة تنفس.
- [ ] CTA الرئيسي أوضح من الثانوي.
- [ ] Bento grid يتداخل مع Hero بطريقة منظمة.
- [ ] الحواف الكبيرة متسقة.
- [ ] Gold accents قليلة ومقصودة.

### Mobile

- [ ] لا يوجد نص أصغر من الحجم المقروء.
- [ ] Hero لا يتحول إلى صورة مقصوصة بلا معنى.
- [ ] CTA داخل أول شاشة أو قريب منها.
- [ ] Category cards سهلة اللمس.
- [ ] لا يوجد Hover-only content.
- [ ] Cart وMenu لا يتعارضان.
- [ ] لا يوجد horizontal overflow غير مقصود.

---

## 23) محتوى وأصول مطلوبة من صاحب المشروع

- Logo بصيغة SVG أصلية.
- صور Hero منفصلة Desktop/Mobile.
- صور الفئات.
- صور المنتجات بخلفية موحدة.
- خطوط العلامة وتراخيصها إن وُجدت.
- النص العربي والإنجليزي النهائي.
- سياسات التوصيل والاسترجاع.
- بيانات وسائل التواصل.
- تفاصيل التغليف والهدايا الفعلية.
- بيانات Analytics وPixels.
- اعتماد نهائي لألوان الطباعة والشاشة.

عند غياب أصل، يستخدم Claude Placeholder واضحًا ومسمى، ولا يخترع وعدًا تسويقيًا أو معلومة تجارية.

---

## 24) Backlog بعد الإطلاق

- Personalized ritual quiz.
- Gift finder حسب المناسبة والميزانية.
- Wishlist.
- Reviews وUGC.
- Journal متعدد اللغات.
- Subscription / replenishment للمنتجات المناسبة.
- Recommendation engine.
- A/B tests للـ Hero وCTA.
- Customer segmentation.
- Loyalty program.
- PWA enhancements إذا كانت مفيدة فعليًا.

---

## 25) القرار النهائي قبل البدء

ابدأ بـ **Audit → Design System → Header → Hero → Bento Grid**.  
لا تبدأ صفحات المنتجات قبل تثبيت الـ Tokens والمكونات الأساسية.  
لا تبدأ الأنيميشن قبل اكتمال Layout وResponsive behavior.  
لا تبدأ تحسينات ثانوية قبل نجاح رحلة الشراء الأساسية.
