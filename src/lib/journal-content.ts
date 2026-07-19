import type { Locale } from "./i18n";
import { journalSlugs, type JournalSlug } from "./journal-routing";
export type JournalRecord = {
  slug: JournalSlug;
  category: string;
  eyebrow: string;
  title: string;
  summary: string;
  answer: string;
  readingLabel: string;
  image: string;
  imageAlt: string;
  sections: Array<{ title: string; body: string }>;
  takeaways: string[];
  faqs: Array<[string, string]>;
  related: Array<{ title: string; body: string; href: string }>;
};

const assets = {
  skin: "/elore-assets/editorial-skin-light-concept-1122w.avif",
  serum: "/elore-assets/texture-skincare-serum-concept-1536w.avif",
  makeup: "/elore-assets/texture-makeup-pigment-concept-1536w.avif",
  haircare: "/elore-assets/haircare-ribbon-editorial-concept-1122x1402.avif",
  bodycare: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif",
  ingredient: "/elore-assets/ingredient-botanical-lab-concept-1536x1024.avif",
  silk: "/elore-assets/hero-silk-champagne-concept-1672w.avif",
  satin: "/elore-assets/transition-burgundy-satin-concept-1672w.avif",
} as const;

export const journalCopy = {
  ar: {
    hub: { eyebrow: "THE BEAUTY EDIT", title: "ملاحظات جمال،\nبلا ضجيج.", intro: "ستة أدلة مختصرة لفهم القوام والمكوّن وترتيب الروتين في سياق الحياة بالسعودية.", open: "اقرئي الدليل", directory: "الإصدار الأول", directoryTitle: "ستة أسئلة.\nإجابات أقرب.", methodTitle: "كيف نكتب\nما يستحق وقتك؟", methodBody: "نبدأ من السؤال، نفصل المعلومة عن الوعد، ونربط كل إجابة بمسار فهم واضح داخل الموقع.", closeTitle: "الفهم أولًا.\nثم اختيار يناسبك.", closeCta: "استكشفي الروتينات", notice: "إرشادات عامة لفهم القوام وترتيب الروتين؛ اتبعي دائمًا ملصق المنتج واستشيري مختصًا عند استمرار أي مشكلة." },
    detail: { answer: "الإجابة المختصرة", chapters: "الدليل خطوة بخطوة", takeaways: "ما يستحق التذكر", related: "واصلي الفهم", questions: "أسئلة مباشرة", back: "العودة إلى المجلة", disclaimer: "معلومات عامة وليست تشخيصًا أو علاجًا. اتبعي ملصق المنتج، واختبريه موضعيًا عند الحاجة، وأوقفي الاستخدام عند التهيج. استشيري مختصًا للحالات المستمرة." },
  },
  en: {
    hub: { eyebrow: "THE BEAUTY EDIT", title: "Beauty notes,\nwithout the noise.", intro: "Six concise guides to texture, ingredients and ritual order in the context of life in Saudi Arabia.", open: "Read the guide", directory: "Edition one", directoryTitle: "Six questions.\nClearer answers.", methodTitle: "How do we write\nwhat deserves your time?", methodBody: "We begin with the question, separate information from promise, and connect each answer to a clear learning route.", closeTitle: "Understanding first.\nThen a choice that fits.", closeCta: "Explore rituals", notice: "General guidance on texture and ritual order; always follow the product label and seek qualified advice for persistent concerns." },
    detail: { answer: "The short answer", chapters: "The guide, step by step", takeaways: "What to remember", related: "Continue learning", questions: "Direct questions", back: "Back to the journal", disclaimer: "General information, not diagnosis or treatment. Follow the product label, patch test where appropriate, stop use if irritation occurs, and seek professional advice for persistent concerns." },
  },
} as const;

// Interface-only copy that was previously embedded in the presentation
// component. Keeping it beside the editorial records preserves the approved
// Arabic/English wording while the compact magazine layout remains data-led.
export const journalInterfaceCopy = {
  ar: {
    lensesEyebrow: "EDITORIAL LENSES",
    laneBody: "ابدئي من السؤال، ثم ضيّقي القرار.",
    lanes: [
      { number: "01", label: "المشكلة", href: "/concerns" },
      { number: "02", label: "الروتين", href: "/routines" },
      { number: "03", label: "المكوّن", href: "/ingredients" },
    ],
    detail: {
      guideTitle: "ثلاث نقاط، بترتيب واضح.",
      relatedTitle: "المعلومة طريق، لا نهاية.",
      faqTitle: "إجابة بلا وعد زائد.",
    },
  },
  en: {
    lensesEyebrow: "EDITORIAL LENSES",
    laneBody: "Begin with the question, then narrow the decision.",
    lanes: [
      { number: "01", label: "Concern", href: "/concerns" },
      { number: "02", label: "Ritual", href: "/routines" },
      { number: "03", label: "Ingredient", href: "/ingredients" },
    ],
    detail: {
      guideTitle: "Three points, in a clear order.",
      relatedTitle: "Information is a path, not an end.",
      faqTitle: "An answer without an extra promise.",
    },
  },
} as const;

export const journalContent: Record<Locale, Record<JournalSlug, JournalRecord>> = {
  ar: {
    "morning-ritual-for-hot-weather": {
      slug: "morning-ritual-for-hot-weather", category: "روتينات يومية", eyebrow: "MORNING / HEAT", title: "روتين صباحي أخف\nللأيام الحارة.", summary: "خطوات قليلة، وأدوار أوضح، وإيقاع أسهل للاستمرار في الأجواء الحارة.", answer: "ابدئي بالأساس، اختاري خطوة مركزة واحدة عند الحاجة، وأنهي الروتين وفق تعليمات الحماية اليومية المناسبة لك. لا يحتاج كل صباح إلى العدد نفسه من الخطوات.", readingLabel: "دليل مختصر · 4 دقائق", image: assets.silk, imageAlt: "حرير بلون شمبانيا كدراسة مفاهيمية لخفة القوام", sections: [
        { title: "ابدئي من إحساس البشرة اليوم", body: "راقبي القوام الذي يبدو مريحًا لك، وابدئي بتنظيف لطيف وترطيب يناسب اللحظة بدل تكرار ترتيب ثابت بلا مراجعة." },
        { title: "اجعلي لكل خطوة سببًا واحدًا", body: "إذا اخترتِ خطوة مركزة، فليكن دورها مفهومًا وأدخليها تدريجيًا. إضافة عدة خطوات جديدة معًا تجعل معرفة ما يلائمك أصعب." },
        { title: "اختتمي بتعليمات واضحة", body: "الحماية اليومية جزء مستقل من قرار الصباح. اتبعي ملصق المنتج المعتمد في الكمية وإعادة التطبيق؛ هذا الدليل لا يبدل تعليماته." },
      ], takeaways: ["الروتين الأقصر قد يكون أوضح.", "أدخلي خطوة جديدة واحدة في كل مرة.", "ملصق المنتج هو مرجع الحماية والاستخدام."], faqs: [["هل تحتاج البشرة الدهنية إلى الاستغناء عن الترطيب؟", "لا توجد قاعدة واحدة للجميع. اختاري قوامًا يناسب إحساس بشرتك ووقت الاستخدام."], ["هل يجب تنفيذ الخطوات نفسها كل صباح؟", "يمكن التبسيط بحسب الحاجة، مع الحفاظ على ترتيب مفهوم وعدم تغيير عدة عناصر معًا."]], related: [{ title: "روتين صباحي للبشرة الدهنية", body: "رتبي الخطوات في مسار عملي.", href: "/routines/morning-routine-oily-skin" }, { title: "فهم فيتامين C", body: "اقرئي المكوّن داخل سياقه.", href: "/ingredients/vitamin-c" }],
    },
    "uneven-tone-without-overcomplication": {
      slug: "uneven-tone-without-overcomplication", category: "فهم المشكلة", eyebrow: "UNEVEN TONE", title: "تفاوت لون البشرة،\nدون روتين مزدحم.", summary: "قراءة هادئة تساعدك على فصل الملاحظة عن التشخيص وبناء مسار قابل للمراجعة من دون وعود نتائج.", answer: "صفي ما ترينه من دون تشخيص السبب، ثبتي روتينًا بسيطًا، ثم أضيفي خطوة واحدة مفهومة عند الحاجة. التغير المفاجئ أو التهيج المستمر يحتاج تقييمًا مؤهلًا.", readingLabel: "دليل مختصر · 5 دقائق", image: assets.skin, imageAlt: "صورة تحريرية مفاهيمية للبشرة والضوء؛ ليست ادعاء نتيجة", sections: [
        { title: "صفي ما ترينه، ولا تشخّصي السبب", body: "تفاوت اللون وصف بصري واسع وقد يرتبط بسياقات مختلفة. استخدميه لتنظيم أسئلتك، لا كتشخيص ذاتي." },
        { title: "ثبتي الأساس قبل التوسع", body: "ابدئي بروتين بسيط يمكن تكراره، ثم أضيفي خطوة واحدة مفهومة. ثبات الترتيب يجعل ملاحظة الملاءمة أسهل." },
        { title: "اعرفي متى يتوقف دور الدليل", body: "المحتوى العام لا يحدد سبب تغير اللون ولا يعالجه. اطلبي تقييمًا مؤهلًا عند تغير مفاجئ أو تهيج مستمر أو قلق واضح." },
      ], takeaways: ["الوصف المرئي ليس تشخيصًا.", "الأساس الثابت أوضح من تكديس المكونات.", "التغير المستمر أو المقلق يحتاج تقييمًا مؤهلًا."], faqs: [["هل أحتاج عدة مكونات في الوقت نفسه؟", "ليس بالضرورة. إدخال خطوة واحدة وفهم دورها يمنحك مسارًا أوضح."], ["هل هذا المقال يعالج التصبغات؟", "لا. هو محتوى تعليمي عام ولا يشخّص أو يعالج أي حالة."]], related: [{ title: "مسار التصبغات", body: "ابدئي من السؤال قبل المكوّن.", href: "/concerns/pigmentation" }, { title: "فهم النياسيناميد", body: "اقرئي المكوّن بلا مبالغة.", href: "/ingredients/niacinamide" }],
    },
    "makeup-longevity-without-heavy-layers": {
      slug: "makeup-longevity-without-heavy-layers", category: "المكياج", eyebrow: "MAKEUP / LONGEVITY", title: "ثبات المكياج،\nدون طبقات ثقيلة.", summary: "رتّبي التحضير والتغطية والتثبيت بحسب اليوم، لا بحسب وعد عام بالثبات.", answer: "حددي النتيجة ووقت الاستخدام، ابني التغطية تدريجيًا، واختبري توافق التحضير والقاعدة والتثبيت قبل المناسبة. لا يوجد ترتيب يضمن عددًا محددًا من الساعات.", readingLabel: "دليل مختصر · 5 دقائق", image: assets.makeup, imageAlt: "دراسة مفاهيمية لأصباغ المكياج؛ ليست سواتش منتج معتمد", sections: [
        { title: "ابدئي بالنتيجة التي تريدينها", body: "حددي المظهر والتغطية ووقت الاستخدام قبل عدد الخطوات. كلمة طويل الثبات وحدها لا تشرح القوام أو الراحة." },
        { title: "ابني التغطية تدريجيًا", body: "طبقة خفيفة ثم إضافة محدودة حيث تحتاجين تمنحك قراءة أوضح من بدء التطبيق بطبقة كثيفة يصعب تعديلها." },
        { title: "اختبري الترتيب قبل المناسبة", body: "جرّبي توافق التحضير والقاعدة والتثبيت في يوم عادي. النتيجة تختلف باختلاف التركيبة والتطبيق والظروف." },
      ], takeaways: ["الثبات لا يساوي تغطية أثقل.", "التدرج يجعل تعديل القاعدة أسهل.", "اختبار توافق الطبقات أهم من افتراض نتيجة."], faqs: [["هل البرايمر خطوة إلزامية؟", "لا. أضيفيه فقط إذا خدم النتيجة المطلوبة وتوافق مع بقية القوام."], ["هل يضمن هذا الترتيب ثباتًا طوال اليوم؟", "لا. المقال يشرح منطق التطبيق ولا يقدم مدة أو نتيجة مضمونة."]], related: [{ title: "مسار ثبات المكياج", body: "افهمي العوامل قبل المنتج.", href: "/concerns/makeup-longwear" }, { title: "روتين قاعدة المناسبات", body: "رتبي التحضير والتطبيق.", href: "/routines/occasion-base-routine" }],
    },
    "post-wash-hair-rhythm-in-humidity": {
      slug: "post-wash-hair-rhythm-in-humidity", category: "العناية بالشعر", eyebrow: "HAIR / HUMIDITY", title: "إيقاع أبسط للشعر\nبعد الغسيل في الرطوبة.", summary: "افصلي احتياج الفروة عن الأطراف، ثم اختاري أقل عدد من الخطوات من دون وعد بمنع الهيشان.", answer: "حددي موضع الثقل أو الانزعاج، استخدمي كمية محدودة، وراجعي القوام والترتيب قبل استبدال الروتين كله. أعراض الفروة المستمرة تحتاج تقييمًا مؤهلًا.", readingLabel: "دليل مختصر · 4 دقائق", image: assets.haircare, imageAlt: "تكوين تحريري مفاهيمي يستلهم حركة الشعر والحرير", sections: [
        { title: "قسّمي السؤال إلى فروة وأطراف", body: "قد لا تحتاج الجذور والأطراف إلى القوام نفسه. حددي موضع الانزعاج أو الثقل قبل إضافة خطوة على الشعر كله." },
        { title: "اختاري القوام بحسب طريقة استخدامك", body: "استخدمي كمية محدودة وراقبي كيف ينسجم القوام مع شعرك وتصفيفك. اسم المكوّن وحده لا يحدد النتيجة." },
        { title: "اتركي مساحة لتغير الطقس", body: "الرطوبة قد تغير إحساس الشعر، فراجعي الكمية والترتيب أولًا. الأعراض المستمرة أو المؤلمة تحتاج تقييمًا مؤهلًا." },
      ], takeaways: ["الفروة والأطراف قد تحتاجان قرارين مختلفين.", "التركيبة أهم من اسم مكوّن منفرد.", "هذا المسار لا يعد بمنع الهيشان."], faqs: [["هل يمنع هذا الروتين الهيشان؟", "لا. هو إطار عام لترتيب الخطوات ولا يقدم نتيجة مطلقة."], ["متى أحتاج إلى مختص؟", "عند وجود أعراض مستمرة أو مؤلمة أو مقلقة في الفروة."]], related: [{ title: "روتين ما بعد الغسيل", body: "رتبي العناية في الأجواء الرطبة.", href: "/routines/humidity-proof-hair-routine" }, { title: "فهم البانثينول", body: "اقرئي دوره ضمن تركيبة كاملة.", href: "/ingredients/panthenol" }],
    },
    "after-shower-bodycare-by-texture": {
      slug: "after-shower-bodycare-by-texture", category: "العناية بالجسم", eyebrow: "BODY / TEXTURE", title: "عناية الجسم بعد الاستحمام\nتبدأ من القوام.", summary: "اختاري اللحظة والمناطق أولًا، ثم قرري إن كان القوام الخفيف أو الأغنى أنسب.", answer: "اربطي القوام بوقت الاستخدام والمناطق التي تلاحظينها، وابدئي بكمية محدودة. لا يعني القوام الأغنى أنه أفضل تلقائيًا، ولا يحول الجفاف إلى تشخيص.", readingLabel: "دليل مختصر · 4 دقائق", image: assets.bodycare, imageAlt: "مشهد تحريري مفاهيمي لطقس العناية بالجسم بعد الاستحمام", sections: [
        { title: "اختاري اللحظة قبل المكوّن", body: "قوام سريع قد يلائم صباحًا عمليًا، بينما يفضل بعض الناس قوامًا أغنى في وقت آخر. القرار يرتبط بالتركيبة الكاملة." },
        { title: "ركزي على المناطق التي تلاحظينها", body: "بدل روتين متطابق للجسم كله، راقبي المناطق التي قد تحتاج قوامًا مختلفًا وابدئي بكمية محدودة." },
        { title: "راجعي الملاءمة تدريجيًا", body: "اختبري أي تركيبة جديدة تدريجيًا واتبعي الملصق. أوقفي الاستخدام عند انزعاج واضح واطلبي نصيحة مؤهلة إذا استمر." },
      ], takeaways: ["اختيار القوام يبدأ من اللحظة وطريقة الاستخدام.", "لا تحتاج كل مناطق الجسم إلى القرار نفسه.", "المحتوى يشرح القوام ولا يعالج حالة جلدية."], faqs: [["هل القوام الأغنى أفضل دائمًا؟", "لا. الملاءمة تعتمد على التركيبة والطقس والوقت والتفضيل الفردي."], ["هل زبدة الشيا تعالج الجفاف؟", "لا نقدم هذا الادعاء. صفحة المكوّن تشرح القوام والسياق فقط."]], related: [{ title: "روتين الجسم بعد الاستحمام", body: "رتبي الخطوات حسب القوام.", href: "/routines/after-shower-body-routine" }, { title: "فهم زبدة الشيا", body: "اقرئي المكوّن دون وعد علاجي.", href: "/ingredients/shea-butter" }],
    },
    "read-an-ingredient-before-you-choose": {
      slug: "read-an-ingredient-before-you-choose", category: "مكوّنات بلا تعقيد", eyebrow: "INGREDIENT / CONTEXT", title: "اقرئي المكوّن\nقبل أن يتحول إلى قرار.", summary: "اسم المكوّن بداية للفهم، لا دليلًا منفردًا على الجودة أو الملاءمة.", answer: "ابدئي بدور المكوّن داخل المنتج، ثم اقرئي التركيبة والقوام والتوقيت والتعليمات معًا. غيّري عنصرًا واحدًا في كل مرة ولا تستنتجي الفعالية من الاسم أو التركيز وحدهما.", readingLabel: "دليل مختصر · 5 دقائق", image: assets.ingredient, imageAlt: "مشهد مختبري نباتي مفاهيمي لفهم المكوّن؛ ليس دليل فعالية", sections: [
        { title: "ابدئي بالدور لا بالشهرة", body: "اسألي لماذا يوجد المكوّن داخل هذا النوع من الروتين، ثم راجعي التركيبة الكاملة وطريقة الاستخدام." },
        { title: "اقرئي القوام والتوقيت معًا", body: "المكوّن نفسه قد يظهر في تركيبات وقوامات مختلفة، لذلك لا يمكن توقع الإحساس من الاسم وحده." },
        { title: "أدخلي الجديد بطريقة قابلة للملاحظة", body: "غيّري عنصرًا واحدًا واتّبعي الملصق. لا تخلطي مكونات اعتمادًا على قائمة عامة بدل تعليمات المنتج." },
      ], takeaways: ["اسم المكوّن لا يساوي جودة المنتج.", "التركيبة والقوام والتوقيت تصنع السياق.", "تغيير واحد أوضح من تغييرات متعددة."], faqs: [["هل يمكن ترتيب المكونات من الأفضل إلى الأقل؟", "لا بصورة عامة؛ الملاءمة ترتبط بالتركيبة وطريقة الاستخدام والاحتياج الفردي."], ["هل ارتفاع التركيز يعني نتيجة أفضل؟", "لا يمكن استنتاج ذلك من رقم منفرد. المرجع هو بيانات المنتج وتعليماته."]], related: [{ title: "فهم النياسيناميد", body: "مثال لمكوّن شائع داخل سياقه.", href: "/ingredients/niacinamide" }, { title: "فهم فيتامين C", body: "اقرئي الأشكال والتعليمات.", href: "/ingredients/vitamin-c" }, { title: "فهم الهيالورونيك أسيد", body: "افصلي الاسم عن الوعد.", href: "/ingredients/hyaluronic-acid" }],
    },
  },
  en: {
    "morning-ritual-for-hot-weather": {
      slug: "morning-ritual-for-hot-weather", category: "Daily rituals", eyebrow: "MORNING / HEAT", title: "A lighter morning ritual\nfor hot days.", summary: "Fewer steps, clearer roles and an easier rhythm to sustain in warm weather.", answer: "Begin with the essentials, choose one focused step when relevant, and finish according to daily protection directions. Not every morning needs the same number of steps.", readingLabel: "Concise guide · 4 minutes", image: assets.silk, imageAlt: "Champagne silk concept representing light texture", sections: [
        { title: "Begin with how skin feels today", body: "Notice which textures feel comfortable, then begin with gentle cleansing and hydration suited to the moment rather than repeating an unchecked order." },
        { title: "Give every step one clear reason", body: "If you choose a focused step, understand its role and introduce it gradually. Several new steps together are harder to read." },
        { title: "Finish with clear directions", body: "Daily protection is its own decision. Follow the approved product label for amount and reapplication; this guide cannot replace it." },
      ], takeaways: ["A shorter ritual can be clearer.", "Introduce one new step at a time.", "The product label governs protection and use."], faqs: [["Should oily skin always skip hydration?", "No single rule suits everyone. Choose a texture that fits your skin and moment of use."], ["Must the same steps be repeated every morning?", "You can simplify according to need while keeping the order legible and avoiding several changes at once."]], related: [{ title: "Morning ritual for oily skin", body: "Arrange the steps in a practical path.", href: "/routines/morning-routine-oily-skin" }, { title: "Understanding vitamin C", body: "Read the ingredient in context.", href: "/ingredients/vitamin-c" }],
    },
    "uneven-tone-without-overcomplication": {
      slug: "uneven-tone-without-overcomplication", category: "Understanding a concern", eyebrow: "UNEVEN TONE", title: "Read uneven tone\nwithout crowding the ritual.", summary: "A considered guide that separates observation from diagnosis and supports a reviewable path without outcome promises.", answer: "Describe what you see without diagnosing its cause, establish a simple ritual, then add one understood step if relevant. Sudden change or persistent irritation needs qualified assessment.", readingLabel: "Concise guide · 5 minutes", image: assets.skin, imageAlt: "Editorial concept of skin and light; not an outcome claim", sections: [
        { title: "Describe; do not diagnose", body: "Uneven tone is a broad visual description with different contexts. Use it to organise questions, not as a self-diagnosis." },
        { title: "Set the foundation before expanding", body: "Begin with a simple repeatable ritual, then introduce one understood step. A stable order makes fit easier to observe." },
        { title: "Know where this guide ends", body: "General content cannot identify or treat the cause. Seek qualified assessment for sudden change, persistent irritation or a clear concern." },
      ], takeaways: ["A visual observation is not a diagnosis.", "A stable foundation is clearer than stacked ingredients.", "Persistent or concerning change needs qualified assessment."], faqs: [["Do I need several ingredients at once?", "Not necessarily. One understood step creates a clearer path."], ["Does this article treat pigmentation?", "No. It is general educational content and does not diagnose or treat a condition."]], related: [{ title: "Uneven tone path", body: "Begin with the concern before the ingredient.", href: "/concerns/pigmentation" }, { title: "Understanding niacinamide", body: "Read the ingredient without exaggeration.", href: "/ingredients/niacinamide" }],
    },
    "makeup-longevity-without-heavy-layers": {
      slug: "makeup-longevity-without-heavy-layers", category: "Makeup", eyebrow: "MAKEUP / LONGEVITY", title: "Makeup longevity,\nwithout heavy layers.", summary: "Order preparation, coverage and setting around the day, not a general wear promise.", answer: "Define finish and moment of use, build coverage gradually, and test preparation, base and setting before the occasion. No order guarantees a fixed number of hours.", readingLabel: "Concise guide · 5 minutes", image: assets.makeup, imageAlt: "Concept makeup pigment study; not an approved product swatch", sections: [
        { title: "Begin with the result", body: "Define finish, coverage and moment of use before deciding on step count. The word longwear does not explain texture or comfort." },
        { title: "Build coverage gradually", body: "A light layer followed by limited additions where needed is easier to read and adjust than dense coverage." },
        { title: "Test the order before the occasion", body: "Try preparation, base and setting together on an ordinary day. Outcomes vary by formula, application and conditions." },
      ], takeaways: ["Longevity does not mean heavier coverage.", "Gradual application is easier to adjust.", "Testing compatibility matters more than assuming a result."], faqs: [["Is primer always required?", "No. Add it only when it serves the intended result and works with the other textures."], ["Does this order guarantee all-day wear?", "No. The article explains application logic and makes no duration promise."]], related: [{ title: "Makeup longevity path", body: "Understand the factors before products.", href: "/concerns/makeup-longwear" }, { title: "Occasion base ritual", body: "Arrange preparation and application.", href: "/routines/occasion-base-routine" }],
    },
    "post-wash-hair-rhythm-in-humidity": {
      slug: "post-wash-hair-rhythm-in-humidity", category: "Haircare", eyebrow: "HAIR / HUMIDITY", title: "A simpler post-wash rhythm\nin humidity.", summary: "Separate scalp and ends, then choose the fewest useful steps without promising frizz prevention.", answer: "Identify where weight or discomfort appears, use a limited amount, and review texture and order before replacing the whole ritual. Persistent scalp symptoms need qualified assessment.", readingLabel: "Concise guide · 4 minutes", image: assets.haircare, imageAlt: "Conceptual editorial composition inspired by hair movement and silk", sections: [
        { title: "Separate scalp and ends", body: "Roots and ends may not need the same texture. Identify where discomfort or weight appears before applying a step everywhere." },
        { title: "Choose texture around use", body: "Use a limited amount and observe how texture fits your hair and styling. An ingredient name alone cannot determine outcome." },
        { title: "Leave room for weather", body: "Humidity can change how hair feels, so review amount and order first. Persistent or painful symptoms need qualified assessment." },
      ], takeaways: ["Scalp and ends may need different decisions.", "The full formula matters more than one ingredient.", "This path does not promise frizz prevention."], faqs: [["Will this ritual prevent frizz?", "No. It is a general framework for ordering steps and makes no absolute claim."], ["When should I seek qualified advice?", "For persistent, painful or concerning scalp symptoms."]], related: [{ title: "Post-wash ritual", body: "Arrange haircare in humid weather.", href: "/routines/humidity-proof-hair-routine" }, { title: "Understanding panthenol", body: "Read its role within a complete formula.", href: "/ingredients/panthenol" }],
    },
    "after-shower-bodycare-by-texture": {
      slug: "after-shower-bodycare-by-texture", category: "Bodycare", eyebrow: "BODY / TEXTURE", title: "After-shower bodycare\nbegins with texture.", summary: "Choose the moment and areas first, then decide whether lighter or richer feels more suitable.", answer: "Connect texture to the moment and areas you notice, beginning with a limited amount. Richer is not automatically better, and dryness is not a diagnosis.", readingLabel: "Concise guide · 4 minutes", image: assets.bodycare, imageAlt: "Conceptual editorial scene for an after-shower body ritual", sections: [
        { title: "Choose the moment before the ingredient", body: "A quick texture may suit a practical morning, while some prefer richer texture later. The complete formula shapes the decision." },
        { title: "Focus on the areas you notice", body: "Instead of one identical ritual everywhere, observe which areas may need a different texture and begin with a limited amount." },
        { title: "Review fit gradually", body: "Introduce a new formula gradually and follow its label. Stop if clear discomfort appears and seek qualified advice if it persists." },
      ], takeaways: ["Texture choice begins with moment and use.", "Different areas may need different decisions.", "This content explains texture and does not treat a condition."], faqs: [["Is richer texture always better?", "No. Fit depends on formula, climate, moment and individual preference."], ["Does shea butter treat dryness?", "We make no such claim. The ingredient page explains texture and context only."]], related: [{ title: "After-shower body ritual", body: "Arrange steps around texture.", href: "/routines/after-shower-body-routine" }, { title: "Understanding shea butter", body: "Read the ingredient without a treatment promise.", href: "/ingredients/shea-butter" }],
    },
    "read-an-ingredient-before-you-choose": {
      slug: "read-an-ingredient-before-you-choose", category: "Ingredients, simplified", eyebrow: "INGREDIENT / CONTEXT", title: "Read an ingredient\nbefore it becomes a decision.", summary: "An ingredient name begins the research; it never proves quality or fit on its own.", answer: "Begin with the ingredient's role, then read the formula, texture, timing and directions together. Change one element at a time and never infer efficacy from name or concentration alone.", readingLabel: "Concise guide · 5 minutes", image: assets.ingredient, imageAlt: "Conceptual botanical laboratory scene for ingredient context; not efficacy evidence", sections: [
        { title: "Begin with role, not popularity", body: "Ask why the ingredient appears in this kind of ritual, then review the full formula and directions." },
        { title: "Read texture and timing together", body: "The same ingredient can appear in different formulas and textures, so feel cannot be predicted from the name alone." },
        { title: "Introduce change observably", body: "Change one element and follow its label. Do not combine ingredients from a generic list instead of product directions." },
      ], takeaways: ["An ingredient name does not prove quality.", "Formula, texture and timing create context.", "One change is clearer than several together."], faqs: [["Can ingredients be ranked best to worst?", "Not in general; fit depends on formula, use and individual context."], ["Does higher concentration mean a better result?", "That cannot be inferred from one number. Use approved product data and directions."]], related: [{ title: "Understanding niacinamide", body: "A familiar ingredient read in context.", href: "/ingredients/niacinamide" }, { title: "Understanding vitamin C", body: "Read forms and directions.", href: "/ingredients/vitamin-c" }, { title: "Understanding hyaluronic acid", body: "Separate the name from the promise.", href: "/ingredients/hyaluronic-acid" }],
    },
  },
};

export function getJournalRecord(locale: Locale, slug: string) {
  return journalSlugs.includes(slug as JournalSlug) ? journalContent[locale][slug as JournalSlug] : null;
}
