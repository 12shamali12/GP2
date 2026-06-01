"""
DentyHub - Omar's individual reflection report (expanded).

Produces a single .docx file. Run:
    python individual_report_generator.py
"""

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Cm, Pt, RGBColor


def new_doc():
    doc = Document()
    BODY_FONT = "Cambria"
    for style_name in ("Normal", "Heading 2", "Heading 3"):
        st = doc.styles[style_name]
        st.font.name = BODY_FONT
    doc.styles["Normal"].font.size = Pt(11)
    doc.styles["Heading 2"].font.size = Pt(16)
    doc.styles["Heading 2"].font.bold = True
    doc.styles["Heading 3"].font.size = Pt(13)
    doc.styles["Heading 3"].font.bold = True
    for section in doc.sections:
        section.top_margin = Cm(2.4)
        section.bottom_margin = Cm(2.4)
        section.left_margin = Cm(2.6)
        section.right_margin = Cm(2.6)
    return doc


def H2(doc, text):
    doc.add_paragraph(text, style="Heading 2")


def H3(doc, text):
    doc.add_paragraph(text, style="Heading 3")


def P(doc, text, bold=False, italic=False, align=None, size=None):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = bold
    r.italic = italic
    if size is not None:
        r.font.size = Pt(size)
    if align is not None:
        p.alignment = align


def B(doc, items):
    for it in items:
        doc.add_paragraph(it, style="List Bullet")


def TABLE(doc, headers, rows, col_widths_cm=None):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    head = t.rows[0]
    for i, h in enumerate(headers):
        cell = head.cells[i]
        cell.text = ""
        para = cell.paragraphs[0]
        run = para.add_run(h)
        run.bold = True
        run.font.size = Pt(10.5)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        tc_pr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), "E7EEF2")
        tc_pr.append(shd)
    for r_idx, row in enumerate(rows, start=1):
        row_cells = t.rows[r_idx].cells
        for c_idx, val in enumerate(row):
            cell = row_cells[c_idx]
            cell.text = ""
            para = cell.paragraphs[0]
            run = para.add_run(str(val))
            run.font.size = Pt(10.5)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    if col_widths_cm is not None and len(col_widths_cm) == len(headers):
        for row in t.rows:
            for i, w in enumerate(col_widths_cm):
                row.cells[i].width = Cm(w)
    doc.add_paragraph("")


def PAGEBREAK(doc):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)


def TITLE_PAGE(doc, student_name, student_id):
    for line in [
        "Jordan University of Science and Technology",
        "College of Computer Sciences & Information Technology",
        "Department of Software Engineering",
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(line)
        r.bold = True
        r.font.size = Pt(13)
    for _ in range(3):
        doc.add_paragraph("")
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    trun = title.add_run("DentyHub")
    trun.bold = True
    trun.font.size = Pt(26)
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    srun = sub.add_run(
        "A Supervised Dental Training Platform Connecting Patients, "
        "Student Doctors, Clinical Supervisors and Administrators"
    )
    srun.italic = True
    srun.font.size = Pt(12)
    doc.add_paragraph("")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pr = p.add_run("Graduation Project Individual Reflection Report")
    pr.bold = True
    pr.font.size = Pt(15)
    for _ in range(2):
        doc.add_paragraph("")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("By").italic = True
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(f"{student_name} ({student_id})")
    r.font.size = Pt(13)
    doc.add_paragraph("")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Supervised by").italic = True
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Dr. Zakarea M. Al Shara'a").font.size = Pt(12)
    for _ in range(2):
        doc.add_paragraph("")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("May 2026").bold = True
    PAGEBREAK(doc)


def UNDERTAKING(doc, student_name):
    H2(doc, "Undertaking")
    P(doc,
        "This is to declare that the project titled \"DentyHub - A "
        "Supervised Dental Training Platform\" is an original work done "
        "by the undersigned team, in partial fulfillment of the "
        "requirements for the Bachelor's degree in Software Engineering "
        "at the Department of Software Engineering, Jordan University "
        "of Science and Technology, Irbid, Jordan.")
    P(doc,
        "The reflections, lessons learned and individual contributions "
        "described in this report represent my own honest assessment of "
        "the part I personally played in the project. The literature "
        "and any external libraries we relied on are cited in the group "
        "report's References section. This individual report has not "
        "been submitted, in whole or in part, to any other university "
        "or academic institution.")
    doc.add_paragraph("")
    doc.add_paragraph("")
    P(doc, "Student Name: " + student_name)
    doc.add_paragraph("")
    P(doc, "Signature: ____________________________")
    doc.add_paragraph("")
    P(doc, "Date: ____ / ____ / 2026")
    PAGEBREAK(doc)


def CONTENTS(doc):
    H2(doc, "Contents")
    P(doc,
        "After the team writes the final version, place the cursor "
        "below this line and run References -> Table of Contents -> "
        "Update Field. Word will render the page-numbered TOC "
        "automatically from the Heading 2 / Heading 3 styles used "
        "throughout this document.",
        italic=True)
    P(doc,
        "[ Auto-generated Table of Contents will render here on Update Field ]",
        italic=True)
    PAGEBREAK(doc)


def omar_report():
    doc = new_doc()
    TITLE_PAGE(doc, "Omar Mohammed Subhi Al Shamali", "154072")
    UNDERTAKING(doc, "Omar Mohammed Subhi Al Shamali")
    CONTENTS(doc)

    # ===================================================================
    # Chapter 1 - Lessons Learned
    # ===================================================================
    H2(doc, "CHAPTER 1: Lessons Learned")

    H3(doc, "1.1 Strategies and Processes that led to Success")
    P(doc,
        "Looking back at GP1 + GP2 together, the strategies that "
        "consistently moved the project forward were the unglamorous "
        "ones. Two stand out.")
    P(doc,
        "First, owning the data model before owning any feature. We "
        "spent the better part of weeks 5-6 of GP1 on the Prisma "
        "schema and every later feature either fit cleanly or forced "
        "an honest migration. The cost of that discipline was real - "
        "it slowed us down at a point when other teams were already "
        "shipping screens - but the payoff compounded for the rest of "
        "the project. By the time we got to GP2's heavy supervisor + "
        "admin workflows, the 41-model schema absorbed each new "
        "requirement without needing a rewrite. The supervisor "
        "decision triangle (approve / needs edit / redo), the per-"
        "doctor case progress rollup, the appointment audit trail - "
        "all of those landed on existing relations rather than "
        "carving new ones.")
    P(doc,
        "Second, making rules explicit instead of relying on "
        "collective memory. The single-author rule for Prisma "
        "migrations is the clearest example. After one merge conflict "
        "on parallel migrations in week 8 of GP1, I wrote the rule "
        "down in the README and we never hit that conflict again. "
        "Same with the translation-key audit checklist after a missed "
        "Arabic key shipped to production for two days - it became a "
        "line in our PR template and has caught seven keys since. "
        "The lesson here was that small, written rules beat large "
        "unwritten agreements.")
    P(doc,
        "A subtler win was the once-a-day rule on every arcade game. "
        "The rule is enforced on the server (the @@unique([patientId, "
        "gameType, dateKey]) constraint on ArcadeAttempt) not in the "
        "client, which means a tampered client cannot bypass it. That "
        "constraint changed the design of every game I wrote "
        "afterwards - each one had to be satisfying in a single "
        "attempt because the player cannot grind. That kind of "
        "architectural rule that drives downstream design is rare "
        "and worth recognising when it happens.")
    P(doc,
        "Finally, the focus-mode pattern I built for the arcade was "
        "an unexpected payoff. By isolating each game inside a "
        "full-viewport stage with portal-mounted HUD chips, the six "
        "games stayed framework-independent of each other. Plaque "
        "Blaster's grid logic, Tooth Defender's three.js scene, "
        "Tooth IQ's deck-based quiz, Match Lab's card grid, Brush "
        "Buddy's Simon-style state machine - none of them know about "
        "each other. Adding a seventh game would be a single file. "
        "That kind of modular boundary saves time later precisely "
        "because you cannot feel the savings now.")

    H3(doc, "1.2 Areas of potential improvement")
    P(doc,
        "If I were starting this project over, the change I would "
        "make first is interleaving the engagement layer with the "
        "core flow from the beginning. The arcade games, the streak, "
        "the badges - they did not exist in our GP1 plan at all. They "
        "emerged from a patient-engagement brainstorm in week 16 of "
        "GP2 and ended up being the most visible part of the demo. "
        "Because they were not scoped from the start, they consumed "
        "weekend time that should have gone into hardening the "
        "supervisor side. The work was good but the schedule pain "
        "was self-inflicted.")
    P(doc,
        "The second improvement I would make is investing earlier in "
        "end-to-end testing. We did structured manual scenario tests "
        "before every merge to main, and they caught a lot - but I "
        "could feel the cost growing as the team grew. One Playwright "
        "test for the booking -> report -> supervisor decision path "
        "would have caught two regressions in week 19 that I found "
        "by hand at midnight. The reason we did not write one was a "
        "calibration error: I assumed Playwright maintenance would "
        "be heavier than it actually is. Next project I will write "
        "the first end-to-end test in week one and grow from there.")
    P(doc,
        "Third is sharper estimation. I consistently underestimated "
        "tasks I had never done before - shader-aware React for "
        "Tooth Defender 3D, the i18n RTL pass, the Prisma JSON "
        "containment query for additional supervisors. Each of those "
        "was 2x to 3x the time I had budgeted. The fix is mechanical: "
        "any time I am estimating a task involving a library or "
        "pattern I have not shipped before, multiply my gut estimate "
        "by three. It feels absurd until I do it twice and it is "
        "accurate twice.")
    P(doc,
        "Finally, I would document internal vocabulary on day one. "
        "We re-explained \"redo means a different patient, not the "
        "same one\" enough times across this project that the "
        "sentence now lives in the README and in Appendix E of the "
        "group report. That kind of phrase belongs in writing the "
        "first time someone says it, not after the third confused "
        "conversation.")

    H3(doc, "1.3 Other lessons learned")
    P(doc,
        "A lesson I did not expect to learn was about humility around "
        "scope. I had ideas - patient payments, an SMS reminder bot, "
        "an in-clinic queue display - that would have been "
        "technically interesting but did not move the project's core "
        "promise forward. Cutting them was harder than implementing "
        "them would have been. The discipline of saying \"this is "
        "not in scope for GP2\" and meaning it is something I will "
        "carry into every future project. Section 1.3 of the group "
        "report's Product Vision lists what we deliberately put out "
        "of scope - that list is short because each item on it cost "
        "real thought to cut.")
    P(doc,
        "I also learned that operational details quietly determine "
        "whether a system feels professional or not. The Asia/Amman "
        "date-key arithmetic (used for both the daily check-in and "
        "the once-a-day arcade rule) sounds boring on a slide. But "
        "a patient checking in at 11:45pm and 12:15am genuinely "
        "getting credit for two consecutive days is the difference "
        "between a streak product that feels honest and one that "
        "feels broken. There were several decisions like that one - "
        "JWT in localStorage vs httpOnly cookie, supervisor decision "
        "atomicity with $transaction, FK-cascade on user deletion - "
        "that nobody would ever notice if they were right, but "
        "everyone would notice if they were wrong.")
    P(doc,
        "On the human side, I learned that leading a five-person "
        "student team is not about doing the work for them. It is "
        "about creating defensible vertical slices - well-scoped, "
        "ownable units of work - and making sure the boundaries are "
        "clean enough that another teammate can actually finish what "
        "they started without needing me to unblock them three times "
        "a day. I will not pretend I got this right consistently. I "
        "carried more of the codebase than I had planned to, and "
        "some of that was on me for not slicing the work better up "
        "front.")
    PAGEBREAK(doc)

    # ===================================================================
    # Chapter 2 - Individual Contributions
    # ===================================================================
    H2(doc, "CHAPTER 2: Individual Contributions")

    H3(doc, "2.1 Amount of Work")
    P(doc,
        "As project lead I authored the largest single share of the "
        "codebase across both halves of the project. The table below "
        "summarises my output by surface area; precise numbers come "
        "from git log against the repository at "
        "github.com/12shamali12/GP1 and are reproducible at any time.")
    TABLE(
        doc,
        ["Surface", "Approximate LOC authored", "Files touched"],
        [
            ["Project leadership + repo orchestration", "—",
             "every PR reviewed; README, branch + merge policy, ADR notes"],
            ["Prisma schema architecture", "~1,400",
             "schema.prisma (41 models, 18 enums) + migration discipline"],
            ["Backend service architecture (appointments, supervisor decisions, multi-supervisor reporting, chat, notifications, smile streak, arcade)",
             "~5,200", "~50 controllers, services, DTOs, guards"],
            ["Arcade engine + 6 game components", "~3,400",
             "6 game files + hub + intro card + focus stage + threshold logic"],
            ["Healthy Smile Streak (backend + frontend)", "~1,400",
             "smile-streak module + surface + badges + widget + streak leaderboard tab"],
            ["i18n dictionary EN + AR with full RTL", "~3,000 keys",
             "dictionary.ts + language-provider + RTL sweep on every patient-facing screen"],
            ["Patient booking flow + appointment lifecycle UI", "~1,800",
             "patient-slot-modal, booking actions, status pills, history view"],
            ["UX/UI design system (dark theme + responsive + reduce motion)", "~2,000",
             "globals.css, design tokens, role shells, settings panel"],
            ["Admin planning + supervisor decision UI", "~2,400",
             "4-tab planning workspace, supervisor queue + decision panel"],
            ["Group + individual reports + UML / architecture diagrams", "~8 .docx + 7 figures",
             "report_generator.py, individual_report_generator.py, mermaid + plantuml sources"],
        ],
        col_widths_cm=[5.6, 4.6, 5.6],
    )
    P(doc,
        "Quantity is the wrong metric on its own. The same commits "
        "include code reviews on every teammate's pull request, "
        "schema-level design decisions that shaped what their "
        "features could even express, and on-call hours when their "
        "setup broke (Suhib's database authentication problem alone "
        "was a two-hour late-evening debugging session that ended in "
        "a clear .env onboarding section in the README). The hours "
        "visible in the commit history are a lower bound, not an "
        "upper one.")

    H3(doc, "2.2 Quality of Work")
    P(doc,
        "Quality on this project meant three things: the system "
        "stays compileable, the system stays testable, and the "
        "system stays explainable.")
    P(doc,
        "Compileable: every PR I opened passed TypeScript strict-"
        "mode and ESLint at zero errors before merge. Several PRs I "
        "reviewed from teammates did not; the convention I enforced "
        "(politely and consistently) was that the author fixes their "
        "own lint rather than merging it with a workaround. This is "
        "a small rule with a large quality effect.")
    P(doc,
        "Testable: the helpers that needed unit tests got them - "
        "Asia/Amman date-key arithmetic, the arcade unlock algorithm "
        "(computeUnlockedLevel in backend/src/arcade/arcade.service."
        "ts), the conflict-detection logic for double-booking. The "
        "30 scenario tests catalogued in Section 5.2 of the group "
        "report are end-to-end paths I walked through manually "
        "before every release.")
    P(doc,
        "Explainable: every backend module carries a docstring at "
        "the top of its service file. Every non-trivial Prisma "
        "schema decision (the per-doctor case progress denormalised "
        "table, the AppointmentEvent audit log, the @@unique "
        "constraints on daily-attempt models) carries an inline "
        "comment explaining why it exists. The diagrams in Section "
        "3.2 of the group report are generated from the actual "
        "schema, not aspirational sketches. When the committee opens "
        "any file in the repository they should be able to figure "
        "out what it does and why it looks the way it does without "
        "asking me.")

    H3(doc, "2.3 Specialized Contributions")

    P(doc, "Project leadership + overall architecture direction.", bold=True)
    P(doc,
        "I set the technical direction of the project end to end. "
        "That includes the monorepo layout under pnpm workspaces, "
        "the module-per-domain convention on the backend, the "
        "feature-folder convention on the frontend, the controller-"
        "layer guarding decision (so that admin-only endpoints "
        "cannot be silently bypassed by a new route), the once-a-day "
        "server rule on engagement features (enforced via @@unique "
        "constraints rather than client-side checks), and the "
        "append-only migration history with the single-author rule "
        "documented in Appendix G of the group report. The "
        "consequence of these decisions appears throughout the "
        "system but is most visible in the fact that every NFR in "
        "Section 2.2 of the group report is either gated in CI "
        "(TypeScript strict + ESLint) or in code review (every "
        "guard, transaction and validation rule that I personally "
        "signed off on).")

    P(doc, "Prisma schema and overall data-model design.", bold=True)
    P(doc,
        "I designed the schema (41 models, 18 enums) including the "
        "central Appointment - CaseReport - DoctorClinicCaseProgress "
        "triangle that makes graduation credit atomic via Prisma "
        "$transaction. The supervisor-decision atomicity rule "
        "(approve flips progress to COMPLETED inside the same "
        "transaction as the decision write) is the architectural "
        "guarantee that distinguishes DentyHub from a generic "
        "appointment manager. The schema also encodes the once-a-"
        "day patterns (ArcadeAttempt and SmileCheckin both carry "
        "@@unique constraints keyed on Asia/Amman date-keys), the "
        "partner-pair and group-supervisor relationships used by "
        "the rotation plan layer, and the AppointmentEvent audit-"
        "trail model that records every state transition (F32 in "
        "the features table).")

    P(doc, "Multi-supervisor report flow.", bold=True)
    P(doc,
        "I designed and implemented the multi-supervisor report "
        "submission flow that lets a doctor route a single case "
        "report to one or more chosen supervisors. The first "
        "supervisor becomes the recorded reviewer; the additional "
        "supervisors are persisted in the formData JSON column and "
        "are surfaced into each supervisor's queue via a Postgres "
        "JSON-containment query. Any of the chosen supervisors can "
        "review the report, with notification fan-out on submit + "
        "decision so the cohort stays in sync. The reasoning for "
        "the JSON-array storage rather than a join table (faster "
        "ship, no migration required, fine for the cohort sizes we "
        "expect) is part of the trade-off space I made the call on "
        "as project lead.")

    P(doc, "The six-game arcade engine.", bold=True)
    P(doc,
        "I designed the focus-mode stage, the per-game props "
        "contract ({ level, onFinish, onCancel, hudSlot }), the "
        "per-level threshold curves, the sticky + sequential unlock "
        "algorithm, and the once-a-day server enforcement. Then I "
        "wrote the six games themselves: Plaque Blaster (30-second "
        "tap grid with endless Lv 11 stages), Tooth Defender 3D (a "
        "three.js scene with one tooth model, one camera, and a "
        "projectile loop - the first shader-aware React I had ever "
        "written), Floss Rush (three-lane runner), Tooth IQ (deck-"
        "based MCQ quiz with 100 unique questions across 10 levels), "
        "Match Lab (memory match with per-level preview windows), "
        "and Brush Buddy (Simon-style brushing pattern with the "
        "MISS! overlay). Each one obeys the shared engine contract "
        "so adding a seventh game is one file.")

    P(doc, "Internationalisation.", bold=True)
    P(doc,
        "I wrote the language-provider (custom rather than a heavy "
        "i18n library, on purpose - the contract is just "
        "useTranslation() returning a string lookup with parameter "
        "interpolation) and drove the translation dictionary from "
        "approximately 700 keys to roughly 1,100 across both EN and "
        "AR during M10. The Arabic RTL pass touched every patient-"
        "facing screen. The translation-key audit checklist that "
        "lives in our PR template is mine; it has caught seven "
        "missed keys since I added it.")

    P(doc, "Reports + UML diagrams.", bold=True)
    P(doc,
        "I wrote the group report (the report_generator.py producing "
        "DentyHub_GP2_Group_Report.docx with all five chapters, the "
        "78 functional + 34 non-functional requirements mapped "
        "feature-by-feature, references, and twelve appendices), "
        "and authored the bulk of the UML figures for Chapter 3 - "
        "the class diagram (Figure 3.3), the two supervisor / "
        "patient sequence diagrams (Figures 3.4 + 3.5), the "
        "appointment state machine (Figure 3.6), and the streak "
        "check-in activity diagram (Figure 3.7). I also built this "
        "individual-report generator that produced all five "
        "reflection reports the committee is reading.")

    P(doc, "Patient booking flow + atomic conflict detection.", bold=True)
    P(doc,
        "I built the patient booking surface end to end - the slot "
        "browser with date + clinic + case-category filters, the "
        "patient-slot-modal that opens when the patient picks a "
        "slot, the booking confirmation, the appointment history "
        "panel with the AWAITING_REPORT pill that surfaces between "
        "the doctor's session-end and the report save (F9 of the "
        "features table), and the colour-coded status pills the "
        "patient sees on their appointment cards. On the server I "
        "wrote the conflict-detection logic that runs inside a "
        "Prisma $transaction - SELECT ... FOR UPDATE on the slot "
        "row, then INSERT the Appointment, then the "
        "AppointmentEvent, then the supervisor notification, "
        "all-or-nothing. NFR-10 (no double-booking under load) is "
        "met by construction because the row lock makes concurrent "
        "submits serialise; TC-08 of Section 5.2 verifies this end "
        "to end.")

    P(doc, "Cross-platform UX: dark theme + responsive design + reduced motion.", bold=True)
    P(doc,
        "I designed the visual identity of DentyHub - the design "
        "tokens behind the denty-* CSS classes, the light + dark "
        "theme toggle and the html.dark class strategy in "
        "globals.css, the role-shell layouts that the patient, "
        "doctor, supervisor and admin surfaces all inherit. The "
        "mobile-first responsive pass is mine: every patient-facing "
        "screen renders at 360px without horizontal scroll (NFR-"
        "32), every interactive surface scales cleanly between 360px "
        "and a desktop viewport, and the navigation collapses into a "
        "side rail at narrow widths. I also built the prefers-"
        "reduced-motion toggle in the settings panel (use-settings-"
        "prefs.ts) - users with vestibular sensitivities can disable "
        "the arcade games' shake + pop animations and the streak "
        "widget's flame animation through a single switch, and the "
        "@media (prefers-reduced-motion: reduce) blocks in "
        "globals.css fall back gracefully when the OS-level "
        "preference is set. This is the kind of detail that does "
        "not appear in the rubric but matters to real users.")

    P(doc, "Healthy Smile Streak engine + patient engagement layer.", bold=True)
    P(doc,
        "I built the Healthy Smile Streak end to end - the backend "
        "smile-streak module (the SmileCheckin model with @@unique "
        "on (patientId, dateKey-in-Asia/Amman), the streak math "
        "that compares yesterday's date-key to today's so the "
        "streak increments correctly even across midnight, the "
        "badge automatic-award logic at 3 / 7 / 30 / 100 day "
        "milestones), the daily ritual UI that walks the patient "
        "through brushing + flossing + mouthwash in 30 seconds, the "
        "badge wall, the streak summary widget on the patient "
        "overview, and the streak leaderboard tab with its three-"
        "metric switcher (current streak / best ever / cumulative "
        "points). The Asia/Amman date-key choice rather than UTC is "
        "what makes a patient checking in at 11:45pm and 12:15am "
        "genuinely count as two consecutive days - a small detail "
        "that decides whether the streak product feels honest or "
        "broken.")

    P(doc, "Communications layer: in-app notifications + chat.", bold=True)
    P(doc,
        "I implemented the notification system (every account "
        "vetting decision, every supervisor decision, every redo, "
        "every partner request, every group join request and every "
        "chat message writes a Notification row that surfaces in "
        "the bell menu) and the one-to-one chat surfaces between "
        "any role-paired users (patient ↔ doctor, doctor ↔ "
        "supervisor, admin ↔ anyone). The chat backend includes "
        "search-by-participant-name, an unread-count endpoint, "
        "mark-conversation-read on open, and message dispatch with "
        "optimistic UI updates. The notification fan-out on the "
        "multi-supervisor report flow (every chosen supervisor gets "
        "pinged on submit + every supervisor gets a follow-up when "
        "one of them actions the case) reuses this same "
        "notification infrastructure.")

    P(doc, "Admin planning workspace UI + supervisor decision UI.", bold=True)
    P(doc,
        "I built the four-tab admin planning workspace on the "
        "frontend (Resources / Plans / Assignments / Supervisors) "
        "that calls into Suhib's CRUD endpoints, the admin user "
        "directory with its search + filter + block + freeze + "
        "reapprove actions, the Add-case deep-link shortcut from "
        "the admin Cases page into the planning Resources tab, and "
        "the admin Settings tab that surfaces language + theme + "
        "notification preferences per admin. On the supervisor "
        "side I built the queue + decision panel - the three-way "
        "approve / needs-edit / redo button with mark + rating + "
        "feedback inputs, the per-supervisor queue that respects "
        "the multi-supervisor routing rules I designed, and the "
        "status-pill that drops a report from SUBMITTED to "
        "REVIEWED on the queue once any of the chosen supervisors "
        "actions it.")

    P(doc, "Student rotation plan view + doctor workspace.", bold=True)
    P(doc,
        "I built the doctor-facing rotation plan view - the "
        "workspace hero card that shows the doctor's next upcoming "
        "clinic day, the schedule strip with their assigned clinic "
        "+ supervisor + shift template, the per-case progress "
        "visualisation that tells the student which graduation-"
        "category cases they still need to complete, and the daily "
        "desk view that surfaces their next appointment, their "
        "pending case reports, and the supervisor decisions they "
        "need to respond to. This is the surface every student "
        "doctor opens first when they log in, and it is the "
        "connective tissue between the data Ragd designed in the "
        "cases domain and the actions the doctor needs to take "
        "inside their semester.")

    P(doc, "Session strategy + auth lifecycle design.", bold=True)
    P(doc,
        "While Batool owned the bcrypt + JWT implementation in the "
        "auth module, I made the call on the higher-level session "
        "lifecycle. The 7-day JWT lifetime (rather than refresh-"
        "token rotation) is a deliberate trade-off: refresh tokens "
        "add server-side token storage, a refresh endpoint per "
        "platform, and a rotation strategy to defend against - all "
        "of which make sense at scale but add complexity "
        "disproportionate to the risk model of a graduation-project "
        "pilot. The 7-day lifetime keeps the auth surface narrow "
        "now; the architecture leaves room to layer refresh-token "
        "rotation on top later without rewriting the existing "
        "endpoints. The single-responsibility separation here "
        "(Batool owns the auth module's implementation; I own the "
        "lifetime + threat-model decision) is an example of how I "
        "scoped work to give teammates clean ownership while "
        "keeping the architectural calls with the team lead.")

    H3(doc, "2.4 Initiative and Reliability")
    P(doc,
        "On initiative: when the project hit a wall I tended to be "
        "the one who picked the direction. The arcade engine, the "
        "schema redesign that added the per-doctor case progress "
        "table after the supervisor interviews, the streak-"
        "leaderboard two-tab switcher, the multi-supervisor report "
        "flow with additionalSupervisorIds stored in formData JSON, "
        "the reduce-motion toggle, the patient booking modal's "
        "atomic conflict detection - all of those were proposals I "
        "made and then executed. When teammates got blocked I "
        "unblocked them; when nobody had an idea I had one ready.")
    P(doc,
        "On reliability: I shipped what I said I was going to ship "
        "in the window I committed to. The milestones in Section "
        "1.4 of the group report all closed inside the GP2 window. "
        "The one exception was M8 (the original three arcade games) "
        "which stretched by about a week because Tooth Defender 3D "
        "was the first shader-aware React I had ever written - I "
        "absorbed that slip by tightening Match Lab's difficulty "
        "curve from four tiers to three in M9 (the playtesters "
        "preferred it anyway).")
    P(doc,
        "The signals of reliability that are not in the commit log: "
        "showing up to weekly check-ins with Dr. Zakarea M. Al "
        "Shara'a with concrete progress to demo rather than slides "
        "to discuss; answering teammate questions on WhatsApp "
        "within the same evening; and turning my code review "
        "comments into explanations rather than rejections. The "
        "team can confirm all of this - I am stating it for the "
        "record, not asking it to be assumed.")
    PAGEBREAK(doc)

    # ===================================================================
    # Chapter 3 - Conclusion and Results
    # ===================================================================
    H2(doc, "CHAPTER 3: Conclusion and Results")
    P(doc,
        "By GP2 hand-in, DentyHub is a four-role platform with a "
        "production-shape deployment (Vercel + Fly.io + Neon "
        "Postgres) alongside the local-laptop demo build. The "
        "numbers I am comfortable putting my name behind:")
    B(doc, [
        "32 functional features (Section 2.1 of the group report) "
        "with 60 functional requirements + 34 non-functional "
        "requirements mapped feature-by-feature in Section 2.2.",
        "11 NestJS controllers exposing 119 REST endpoints, all "
        "guarded by JWT + role checks at the controller layer.",
        "41 Prisma models, 18 enums, 12 append-only migrations, "
        "full FK referential integrity.",
        "Six arcade games with per-level leaderboards, sticky + "
        "sequential unlock, once-a-day server enforcement, and a "
        "completely separate trivia quiz module beside it.",
        "Healthy Smile Streak with Asia/Amman date-key arithmetic, "
        "automatic badge awards at 3, 7, 30, 100 days, and a "
        "three-metric leaderboard.",
        "Approximately 1,100 translation keys, full RTL Arabic "
        "across every patient-facing screen, no LTR leakage "
        "verified in TC-28 of Section 5.2.",
        "Light + dark theme on every role surface, mobile-first "
        "responsive design from 360px, and a prefers-reduced-motion "
        "toggle for users with vestibular sensitivities.",
        "30/30 scenario tests passing against the freeze build, "
        "with login p95 under 250ms (NFR-2 met) and dashboard FCP "
        "under 1,500ms on 4G (NFR-7 met) measured against seeded "
        "data.",
    ])
    P(doc,
        "Personally, the result I am proudest of is not any single "
        "feature. It is that the codebase as a whole is something "
        "the next maintainer can pick up - the docstrings are in "
        "place, the schema decisions are commented, the migrations "
        "tell their own story, the i18n dictionary has clear key "
        "namespaces, the engine contracts are clean. If DentyHub "
        "ships to a partner clinic after defense, the gap between "
        "\"graduation project\" and \"operating system\" is much "
        "smaller than it could have been if I had let the code rot "
        "under the deadline pressure.")
    P(doc,
        "What I would say to a future me starting another four-"
        "month project: own the data model early, keep the schema "
        "honest, write down the rules that hurt to enforce, and "
        "resist the scope creep that flatters your ego while "
        "burying your team. I will not claim to have done all of "
        "that perfectly here, but I will say I tried, and I think "
        "the report you are holding shows the result.")
    P(doc,
        "Sincere thanks to Dr. Zakarea M. Al Shara'a for the "
        "supervision, to my teammates Suhib, Nabeel, Batool and "
        "Ragd for the parts of this project they own, and to the "
        "family and friends who tolerated four months of \"that "
        "dental app\" becoming the only thing I could talk about.")
    return doc


# Cycle through candidate filenames so we can re-run while Word holds the
# earlier copy open. The first writable filename wins.
CANDIDATES = [
    "DentyHub_Individual_Omar_Al_Shamali.docx",
    "DentyHub_Individual_Omar_Al_Shamali_v2.docx",
    "DentyHub_Individual_Omar_Al_Shamali_v3.docx",
]

doc = omar_report()
OUTPUT = None
for name in CANDIDATES:
    try:
        doc.save(name)
        OUTPUT = name
        break
    except PermissionError:
        continue
if OUTPUT is None:
    raise SystemExit("All candidate paths locked. Close Word and retry.")
print(f"Wrote {OUTPUT}")
