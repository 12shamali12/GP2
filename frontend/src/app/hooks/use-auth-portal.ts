"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ADMIN_EMAIL,
  ADMIN_USERNAME,
} from "@/features/admin/lib/admin-config";
import { clearAuthToken, setAuthToken } from "@/lib/api/auth";
import {
  getAuthShowcaseSlides,
  type AuthShowcaseSlide,
} from "@/features/ui/components/auth-showcase";

export type Role = "patient" | "doctor" | "supervisor";

export function useAuthPortal() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const router = useRouter();

  const parseApiResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    if (
      contentType.includes("text/html") ||
      /^\s*<!doctype/i.test(text) ||
      /^\s*<html/i.test(text)
    ) {
      throw new Error(
        `API returned HTML instead of JSON. Check NEXT_PUBLIC_API_URL (${apiUrl}) and make sure the backend is running.`,
      );
    }

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("API returned an invalid response.");
    }
  };

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("patient");
  const [contact, setContact] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDoctorId, setRegDoctorId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [semesterOptions, setSemesterOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [resendInfo, setResendInfo] = useState<
    { identifier: string; password: string; role: "supervisor" | "doctor" } | null
  >(null);

  const copy = {
    en: {
      title: "Free supervised dental care",
      subtitle: "Use email or phone with your password.",
      registerSubtitle:
        "Sign up and choose a role. Supervisors need approval.",
      location: "KAUH Irbid · King Abdullah University Hospital",
      fullName: "Full name",
      doctorId: "Doctor college ID",
      age: "Age",
      gender: "Gender",
      emailOrPhone: "Email or phone (login)",
      password: "Password",
      role: "Role",
      rolePatient: "Patient",
      roleDoctor: "Doctor",
      roleSupervisor: "Supervisor",
      login: "Login",
      register: "Register",
      welcome: "Welcome back",
      create: "Create your account",
      errors: {
        contactRequired: "Email or phone is required.",
        invalidEmail: "Enter a valid email.",
        invalidPhone: "Phone must start with 07 and be 10 digits.",
        doctorIdRequired: "Doctor ID is required for doctors.",
        semesterRequired: "Semester is required for doctors.",
        passLen: "Password must be at least 8 characters.",
        passNumber: "Password needs at least one number.",
        passUpper: "Password needs an uppercase letter.",
        passLower: "Password needs a lowercase letter.",
        passSpecial: "Password needs a special character.",
        nameRequired: "Name is required for registration.",
        ageValid: "Enter a valid age.",
        genderRequired: "Select male or female.",
      },
    },
    ar: {
      title: "رعاية أسنان مجانية تحت إشراف",
      subtitle: "استخدم البريد أو الهاتف مع كلمة المرور.",
      registerSubtitle: "سجل واختر الدور. المشرف يحتاج موافقة.",
      location: "مستشفى الملك عبدالله الجامعي - إربد",
      fullName: "الاسم الكامل",
      age: "العمر",
      gender: "الجنس",
      emailOrPhone: "بريد أو هاتف (تسجيل دخول)",
      password: "كلمة المرور",
      role: "الدور",
      rolePatient: "مريض",
      roleDoctor: "طبيب",
      roleSupervisor: "مشرف",
      login: "تسجيل الدخول",
      register: "تسجيل",
      welcome: "أهلاً بعودتك",
      create: "أنشئ حسابك",
      errors: {
        contactRequired: "البريد أو الهاتف مطلوب.",
        invalidEmail: "أدخل بريداً صحيحاً.",
        invalidPhone: "الهاتف يجب أن يبدأ بـ07 ويتكون من 10 أرقام.",
        doctorIdRequired: "???? ?????? ?????? ???????.",
        semesterRequired: "?????? ?????? ???????.",
        passLen: "كلمة المرور 8 أحرف على الأقل.",
        passNumber: "كلمة المرور تحتاج رقماً.",
        passUpper: "كلمة المرور تحتاج حرفاً كبيراً.",
        passLower: "كلمة المرور تحتاج حرفاً صغيراً.",
        passSpecial: "كلمة المرور تحتاج رمزاً خاصاً.",
        nameRequired: "الاسم مطلوب للتسجيل.",
        ageValid: "أدخل عمراً صحيحاً.",
        genderRequired: "اختر الجنس.",
      },
    },
  } as const;

  const t = copy[lang];

  const validateLoginIdentifier = () => {
    const trimmed = contact.trim();
    if (!trimmed) return t.errors.contactRequired;
    if (trimmed.includes("@")) {
      const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailPattern.test(trimmed)) return t.errors.invalidEmail;
    } else {
      const phonePattern = /^07\d{8}$/;
      if (!phonePattern.test(trimmed)) return t.errors.invalidPhone;
    }
    return null;
  };

  const validatePassword = () => {
    const rules = [
      { test: /.{8,}/, msg: t.errors.passLen },
      { test: /[0-9]/, msg: t.errors.passNumber },
      { test: /[A-Z]/, msg: t.errors.passUpper },
      { test: /[a-z]/, msg: t.errors.passLower },
      { test: /[^A-Za-z0-9]/, msg: t.errors.passSpecial },
    ];
    for (const rule of rules) {
      if (!rule.test.test(password)) return rule.msg;
    }
    return null;
  };

  const handleSubmit = async () => {
    setMessage(null);
    setResendInfo(null);

    if (mode === "login") {
      const loginErr = validateLoginIdentifier();
      if (loginErr) return setError(loginErr);
    }

    const passErr = validatePassword();
    if (passErr) return setError(passErr);
    if (mode === "register" && name.trim().length === 0) {
      return setError(t.errors.nameRequired);
    }
    if (mode === "register" && age.trim() && Number(age) <= 0) {
      return setError(t.errors.ageValid);
    }
    if (mode === "register" && !gender) {
      return setError(t.errors.genderRequired);
    }
    if (mode === "register") {
      const phonePattern = /^07\d{8}$/;
      if (!phonePattern.test(regPhone.trim())) {
        return setError(t.errors.invalidPhone);
      }
      if (role !== "patient") {
        if (!regEmail.trim()) {
          return setError("Email is required for doctors and supervisors.");
        }
        const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailPattern.test(regEmail.trim())) {
          return setError(t.errors.invalidEmail);
        }
        if (role === "doctor" && !regDoctorId.trim()) {
          return setError(t.errors.doctorIdRequired || "Doctor ID is required for doctors.");
        }
        if (role === "doctor" && !semesterId) {
          return setError(t.errors.semesterRequired || "Semester is required for doctors.");
        }
      } else if (regEmail.trim()) {
        const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailPattern.test(regEmail.trim())) {
          return setError(t.errors.invalidEmail);
        }
      }
    }

    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch(`${apiUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: regEmail.trim() || undefined,
            phone: regPhone.trim(),
            username: regEmail.trim() || regPhone.trim(),
            password,
            name,
            age: age ? Number(age) : undefined,
            gender,
            role: role.toUpperCase(),
            doctorIdNumber: role === "doctor" ? regDoctorId.trim() : undefined,
            semesterId: role === "doctor" ? semesterId || undefined : undefined,
          }),
        });
        const data = await parseApiResponse(res);
        if (!res.ok) {
          setError(data?.message || "Registration failed.");
        } else {
          setMessage(data?.message || "Registered.");
          setRegEmail("");
          setRegPhone("");
          const newUser = {
            name,
            email: regEmail.trim() || null,
            phone: regPhone.trim() || null,
            username: regEmail.trim() || regPhone.trim(),
            role: role.toUpperCase(),
            gender,
          };
          try {
            sessionStorage.setItem("currentUser", JSON.stringify(newUser));
          } catch {}
          if (role === "patient") {
            router.push("/patient");
            return;
          }
          if (role === "supervisor") {
            setMode("login");
          }
        }
      } else {
        const identifier = contact.trim();
        const res = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await parseApiResponse(res);
        if (!res.ok) {
          setError(data?.message || "Login failed.");
          const msg = (data?.message || "").toString().toLowerCase();
          const apiRole = (data?.user?.role || role).toString().toLowerCase();
          if (
            apiRole === "supervisor" ||
            role === "supervisor" ||
            msg.includes("supervisor")
          ) {
            setResendInfo({ identifier, password, role: "supervisor" });
          } else if (
            apiRole === "doctor" ||
            msg.includes("doctor") ||
            (role === "doctor" && msg.includes("reject"))
          ) {
            setResendInfo({ identifier, password, role: "doctor" });
          }
        } else {
          setResendInfo(null);
          if (typeof data?.token === "string" && data.token.length > 0) {
            setAuthToken(data.token);
          } else {
            clearAuthToken();
          }
          if (data?.user) {
            let mergedUser = data.user;
            try {
              const prev = localStorage.getItem("currentUser");
              if (prev) {
                const parsed = JSON.parse(prev);
                if (
                  !mergedUser.gender &&
                  parsed?.gender &&
                  parsed?.username === mergedUser.username
                ) {
                  mergedUser = { ...mergedUser, gender: parsed.gender };
                }
              }
            } catch {}
            try {
              sessionStorage.setItem("currentUser", JSON.stringify(mergedUser));
            } catch {}
          }
          const apiRole = (data?.user?.role || "").toString().toLowerCase();
          const normalizedIdentifier = identifier.toLowerCase();
          if (
            apiRole === "admin" ||
            normalizedIdentifier === ADMIN_EMAIL ||
            normalizedIdentifier === ADMIN_USERNAME
          ) {
            router.push("/admin");
            return;
          }
          const targetRole =
            apiRole === "patient" ||
            apiRole === "doctor" ||
            apiRole === "supervisor"
              ? apiRole
              : role;
          router.push(`/${targetRole}`);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendInfo) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const endpoint =
        resendInfo.role === "supervisor"
          ? "/auth/resend-supervisor-request"
          : "/auth/resend-doctor-request";
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: resendInfo.identifier,
          password: resendInfo.password,
        }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.message || "Could not resend request.");
      } else {
        setMessage(data?.message || "Request resent for approval.");
        setResendInfo(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const portalNote =
    lang === "ar"
      ? mode === "login"
        ? {
            label: "ملاحظة سريعة",
            text: "استخدم البريد أو الهاتف للدخول. وإذا كان طلب الطبيب أو المشرف ما زال قيد المراجعة يمكنك إعادة إرساله من هنا.",
          }
        : {
            label:
              role === "doctor"
                ? "تحقق الطبيب"
                : role === "supervisor"
                  ? "مراجعة المشرف"
                  : "دخول المريض",
            text:
              role === "doctor"
                ? "تسجيل الطبيب يحتاج رقم الكلية ثم ينتظر الموافقة قبل الدخول الكامل."
                : role === "supervisor"
                  ? "حساب المشرف يدخل إلى المراجعة بعد الإرسال ثم يصبح جاهزاً بعد الموافقة."
                  : "المريض يمكنه متابعة الدخول مباشرة بعد نجاح التسجيل.",
          }
      : mode === "login"
        ? {
            label: "Quick note",
            text: "Use email or phone to sign in. If a doctor or supervisor request is still pending, you can resend it from this panel.",
          }
        : {
            label:
              role === "doctor"
                ? "Doctor verification"
                : role === "supervisor"
                  ? "Supervisor review"
                  : "Patient access",
            text:
              role === "doctor"
                ? "Doctor registration needs a college ID and approval before full access."
                : role === "supervisor"
                  ? "Supervisor accounts enter review after submission and become active once approved."
                  : "Patients can continue directly after a successful registration.",
          };

  const slides = getAuthShowcaseSlides(lang);
  const activeSlide: AuthShowcaseSlide = slides[showcaseIndex] ?? slides[0];

  useEffect(() => {
    setShowcaseIndex(0);
  }, [lang]);

  useEffect(() => {
    const loadRegisterOptions = async () => {
      try {
        const res = await fetch(`${apiUrl}/auth/register-options`);
        const data = await parseApiResponse(res);
        if (!res.ok) return;
        setSemesterOptions(data?.semesters || []);
      } catch {
        // ignore register metadata failures for now
      }
    };
    void loadRegisterOptions();
  }, [apiUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setShowcaseIndex((current) => (current + 1) % slides.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return {
    lang,
    setLang,
    mode,
    setMode,
    role,
    setRole,
    contact,
    setContact,
    regEmail,
    setRegEmail,
    regPhone,
    setRegPhone,
    regDoctorId,
    setRegDoctorId,
    semesterId,
    setSemesterId,
    semesterOptions,
    password,
    setPassword,
    name,
    setName,
    age,
    setAge,
    gender,
    setGender,
    error,
    message,
    loading,
    showcaseIndex,
    setShowcaseIndex,
    resendInfo,
    copy,
    t,
    slides,
    activeSlide,
    portalNote,
    handleSubmit,
    handleResend,
  };
}
