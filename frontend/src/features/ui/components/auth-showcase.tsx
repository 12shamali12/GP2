"use client";

import Image from "next/image";

export type AuthShowcaseSlide = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  chips: string[];
  footer: string;
};

type AuthShowcaseBackgroundProps = {
  activeIndex: number;
  lang: "en" | "ar";
  onChange: (index: number) => void;
  slides: AuthShowcaseSlide[];
};

export function getAuthShowcaseSlides(
  lang: "en" | "ar"
): AuthShowcaseSlide[] {
  const content: Record<"en" | "ar", AuthShowcaseSlide[]> = {
    en: [
      {
        eyebrow: "Supervised treatment",
        title: "Dental care guided inside a real teaching clinic",
        description:
          "Patients book sessions, students work on cases, and supervisors keep the treatment journey controlled and clear.",
        image: "/auth-showcase/girl1-having-dental-appoinment.jpg",
        alt: "Patient receiving a dental appointment consultation",
        chips: [
          "Free supervised care",
          "Clinic-based learning",
          "Patient follow-up",
        ],
        footer:
          "Designed for students, doctors, supervisors, and patients in one connected flow.",
      },
      {
        eyebrow: "Appointments and follow-up",
        title: "Bookings, approvals, and visits stay visible in one place",
        description:
          "The platform keeps reservations, appointment status, and service progress readable from the first booking to the report stage.",
        image: "/auth-showcase/girl2-having-appoinment.jpg",
        alt: "Patient during an appointment in a dental clinic",
        chips: [
          "Slot selection",
          "Approval-aware flow",
          "Mobile-friendly access",
        ],
        footer:
          "A calmer booking experience for patients and a cleaner review flow for the clinic team.",
      },
      {
        eyebrow: "Clinical workspace",
        title: "Doctor planning, reporting, and communication work together",
        description:
          "Doctors manage availability, respond to reservations, submit reports, and stay connected through direct and shared conversations.",
        image: "/auth-showcase/Bdoctor.jpg",
        alt: "Doctor in a professional dental setting",
        chips: [
          "Availability planning",
          "Appointment reports",
          "Chat and coordination",
        ],
        footer:
          "Built to support real clinic operations without losing clarity for students or patients.",
      },
      {
        eyebrow: "Student learning",
        title: "Students practice with supervision, structure, and clearer case flow",
        description:
          "The platform supports teaching-clinic work by keeping communication, schedules, and clinical steps easier to track.",
        image: "/auth-showcase/doctor.jpg",
        alt: "Dental student or doctor in a clinical setting",
        chips: ["Teaching clinic", "Case visibility", "Team guidance"],
        footer:
          "Built for the rhythm of students, supervisors, and patients working in the same system.",
      },
      {
        eyebrow: "Preventive care",
        title: "Families and first visits can move through the clinic with less confusion",
        description:
          "Profiles, booking, and reminders make early visits easier to manage for younger patients and their guardians.",
        image: "/auth-showcase/youngboy-checks-histeeth.jpg",
        alt: "Young boy smiling and checking his teeth",
        chips: ["Preventive visits", "Family clarity", "Simple reminders"],
        footer:
          "A gentler front door for patients while the clinic team keeps the workflow organized.",
      },
    ],
    ar: [
      {
        eyebrow: "العلاج تحت الإشراف",
        title: "رعاية أسنان داخل بيئة تعليمية حقيقية وتحت إشراف واضح",
        description:
          "يحجز المريض الموعد، يعمل الطلاب على الحالات، ويتابع المشرفون رحلة العلاج بشكل منظم وواضح.",
        image: "/auth-showcase/girl1-having-dental-appoinment.jpg",
        alt: "مريضة خلال موعد في عيادة أسنان",
        chips: ["رعاية مجانية", "تعلم سريري", "متابعة للمريض"],
        footer:
          "تجربة واحدة مترابطة للمرضى والطلاب والأطباء والمشرفين داخل منصة واحدة.",
      },
      {
        eyebrow: "الحجوزات والمتابعة",
        title: "المواعيد والطلبات وحالة الزيارة تبقى ظاهرة في مكان واحد",
        description:
          "المنصة تجعل الحجز والموافقة وتقدم الخدمة أوضح من أول موعد وحتى مرحلة التقرير.",
        image: "/auth-showcase/girl2-having-appoinment.jpg",
        alt: "مريضة خلال جلسة في عيادة الأسنان",
        chips: ["اختيار المواعيد", "تدفق موافقات واضح", "جاهز للجوال"],
        footer:
          "حجز أبسط للمريض ومسار مراجعة أهدأ لفريق العيادة داخل التجربة نفسها.",
      },
      {
        eyebrow: "مساحة العمل السريري",
        title: "التخطيط والتقارير والتواصل يعملون معاً للأطباء",
        description:
          "يستطيع الطبيب تنظيم التوفر ومراجعة الحجوزات وإرسال التقارير والبقاء على اتصال داخل المنصة.",
        image: "/auth-showcase/Bdoctor.jpg",
        alt: "طبيب داخل بيئة طبية احترافية",
        chips: ["تنظيم التوفر", "تقارير الموعد", "محادثات وتنسيق"],
        footer:
          "مصممة لدعم العمل الحقيقي داخل العيادة بدون إرباك للمرضى أو الطلاب.",
      },
      {
        eyebrow: "التدريب السريري",
        title: "الطلاب يتدرّبون بإشراف أوضح ومسار حالات أكثر تنظيماً",
        description:
          "تدعم المنصة العمل داخل العيادة التعليمية عبر تسهيل متابعة التواصل والمواعيد وخطوات الحالة.",
        image: "/auth-showcase/doctor.jpg",
        alt: "طالب أو طبيب داخل بيئة سريرية",
        chips: ["عيادة تعليمية", "وضوح الحالة", "إشراف الفريق"],
        footer:
          "مصممة لإيقاع العمل بين الطلاب والمشرفين والمرضى داخل نظام واحد.",
      },
      {
        eyebrow: "الرعاية الوقائية",
        title: "الزيارات الأولى والعائلات تمر عبر العيادة بوضوح وهدوء أكبر",
        description:
          "الملفات والحجز والتنبيهات تجعل متابعة الزيارات المبكرة أسهل للأطفال ومرافقيهم.",
        image: "/auth-showcase/youngboy-checks-histeeth.jpg",
        alt: "طفل يبتسم ويتفقد أسنانه",
        chips: ["زيارات وقائية", "وضوح للعائلة", "تنبيهات أبسط"],
        footer:
          "واجهة ألطف للمريض مع بقاء سير العمل منظماً لفريق العيادة.",
      },
    ],
  };

  return content[lang];
}

export function AuthShowcaseBackground({
  activeIndex,
  lang,
  onChange,
  slides,
}: AuthShowcaseBackgroundProps) {
  const next = (activeIndex + 1) % slides.length;

  return (
    <div
      className="auth-background-stage cursor-pointer"
      onClick={() => onChange(next)}
      role="button"
      aria-label={lang === "ar" ? "الشريحة التالية" : "Next slide"}
    >
      {slides.map((slide, index) => (
        <div
          key={`${lang}-${slide.title}`}
          className={`auth-background-media ${
            index === activeIndex ? "is-active" : ""
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div className="auth-background-overlay" />
      <div className="auth-background-noise" />

      <div className="auth-background-dots">
        {slides.map((slide, index) => (
          <button
            key={`${lang}-${slide.eyebrow}-${index}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange(index);
            }}
            className={`auth-background-dot ${
              index === activeIndex ? "is-active" : ""
            }`}
            aria-label={
              lang === "ar"
                ? `الذهاب إلى الشريحة ${index + 1}`
                : `Go to slide ${index + 1}`
            }
          />
        ))}
      </div>
    </div>
  );
}
