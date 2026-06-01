"use client";

/**
 * Tooth IQ — multiple-choice dental knowledge quiz.
 *
 * 10 questions per round. Each correct answer is +100 base + a time bonus
 * (faster = bigger) + a streak multiplier (chain of correct answers). Wrong
 * answers reveal the correct one with a one-line explanation, then the round
 * moves on. Round ends when the 10th question is answered (or skipped on
 * timeout).
 *
 * Lv 11 = endless: questions keep coming until the player chooses to bail
 * (3 wrong-in-a-row ends the run instead of a question count).
 *
 * Question pool is keyed by level so each level pulls from a richer, harder
 * topic set. Questions are randomized within their level pool so re-runs
 * aren't memorizable.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HudChip } from "@/features/arcade/components/hud-chip";
import { useTranslation } from "@/features/i18n/language-provider";

type GameProps = {
  level: number;
  onFinish: (score: number, durationMs: number) => void;
  onCancel: () => void;
  hudSlot?: HTMLElement | null;
};

type Question = {
  /** Stable id so React can key answer reveals smoothly. */
  id: string;
  q: string;
  options: string[];
  correct: number;
  /** Short explanation shown after answer (right or wrong). */
  explain: string;
};

const QUESTIONS_PER_ROUND = 10;
/** Endless mode ends after this many TOTAL wrong answers (cumulative, not in a row). */
const ENDLESS_MISS_LIMIT = 3;

/* -------------------------------------------------------------------------- */
/* Question pool                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Each level has EXACTLY 10 questions. A round shuffles their order so two
 * attempts at the same level cover the same content with a different feel.
 * No duplicates within a round. Endless mode concatenates all level pools
 * into one big deck and walks it shuffled.
 */
const POOL: Record<number, Question[]> = {
  1: [
    { id: "1.a", q: "How often should you brush your teeth?", options: ["Once a day", "Twice a day", "After every meal", "Once a week"], correct: 1, explain: "Twice a day — morning and night — is the standard recommendation from every major dental association." },
    { id: "1.b", q: "How long should each brushing session last?", options: ["30 seconds", "1 minute", "2 minutes", "5 minutes"], correct: 2, explain: "Two minutes lets you cover all four quadrants properly — roughly 30 seconds each." },
    { id: "1.c", q: "When should you replace your toothbrush?", options: ["Every week", "Every 3–4 months", "Once a year", "Only when the handle breaks"], correct: 1, explain: "Bristles fray after about 3 months and lose cleaning power. Sooner if you were sick." },
    { id: "1.d", q: "What is the main purpose of brushing?", options: ["Make breath smell good", "Whiten teeth", "Remove plaque", "Polish enamel"], correct: 2, explain: "Plaque is the soft bacterial film that causes both cavities and gum disease — brushing removes it before it hardens." },
    { id: "1.e", q: "What kind of toothbrush bristles do dentists usually recommend?", options: ["Hard", "Medium", "Soft", "Any kind is fine"], correct: 2, explain: "Soft bristles clean effectively without abrading enamel or irritating gums." },
    { id: "1.f", q: "What is plaque?", options: ["A sticky bacterial film", "Stuck food", "Coffee stains", "Mineral buildup"], correct: 0, explain: "Plaque is a biofilm of bacteria + their byproducts. Left alone it hardens into tartar." },
    { id: "1.g", q: "Which of these is NOT part of basic daily oral care?", options: ["Brushing", "Flossing", "Mouthwash", "Whitening trays"], correct: 3, explain: "Whitening trays are cosmetic — not part of daily essentials." },
    { id: "1.h", q: "When is the best time to brush?", options: ["Right after waking up", "Right after meals", "In the morning + before bed", "Only when you feel like it"], correct: 2, explain: "Morning + before bed is the gold standard. Brushing right after acidic meals can actually wear enamel." },
    { id: "1.i", q: "Where do bad-breath bacteria mostly live?", options: ["On the tongue", "On the lips", "In the cheeks", "On the lower jaw"], correct: 0, explain: "The tongue surface — especially the back — harbors most odor-causing bacteria. Brush or scrape it daily." },
    { id: "1.j", q: "Is it OK to share a toothbrush with family?", options: ["Yes, with siblings", "Never — even within family", "Only if rinsed first", "Only if same age"], correct: 1, explain: "Toothbrush sharing spreads oral bacteria and bloodborne particles. Always use your own." },
  ],
  2: [
    { id: "2.a", q: "What's the recommended brushing technique?", options: ["Hard side-to-side scrubbing", "Small circular motions", "Up-and-down pressure", "Diagonal scraping"], correct: 1, explain: "Small circular motions (or short back-and-forth) at a 45° angle to the gumline — Bass technique." },
    { id: "2.b", q: "What angle should the brush be held at relative to the gums?", options: ["0° flat", "45°", "90° perpendicular", "180° upside down"], correct: 1, explain: "45° lets the bristles sweep just under the gumline where most plaque accumulates." },
    { id: "2.c", q: "Should you brush your tongue?", options: ["No, never", "Only if you have bad breath", "Yes, every session", "Only at the dentist"], correct: 2, explain: "The tongue harbors bacteria that contribute to plaque + bad breath. Brush or scrape it daily." },
    { id: "2.d", q: "How much pressure should you use when brushing?", options: ["As hard as possible", "Light to medium pressure", "Press until gums hurt", "Pressure doesn't matter"], correct: 1, explain: "Hard scrubbing wears enamel and recedes gums. Light to medium is enough — let the bristles do the work." },
    { id: "2.e", q: "Is rinsing right after brushing recommended?", options: ["Yes, with lots of water", "Yes, with mouthwash", "Spit but don't rinse heavily", "Doesn't matter"], correct: 2, explain: "Spitting (not rinsing) keeps fluoride from the toothpaste working on your teeth longer." },
    { id: "2.f", q: "Which surface of the tooth is most often missed?", options: ["Front", "Chewing", "Inside / tongue-facing", "Sides"], correct: 2, explain: "Inner surfaces (tongue side) are the most commonly missed area, especially the lower front teeth." },
    { id: "2.g", q: "What size brush head is best for most adults?", options: ["Largest you can find", "Small to medium", "Doesn't matter", "Kid-sized"], correct: 1, explain: "Smaller heads reach back molars and angles better than oversized ones." },
    { id: "2.h", q: "How many sections should you mentally divide your mouth into when brushing?", options: ["2", "4 quadrants", "6", "8"], correct: 1, explain: "Four quadrants — upper left/right, lower left/right. Spend about 30 seconds on each." },
    { id: "2.i", q: "Electric vs manual brush — which is better?", options: ["Electric always wins", "Manual always wins", "Both effective if used correctly", "Neither cleans well"], correct: 2, explain: "Both can clean effectively. Electric helps when technique is poor or when wearing braces." },
    { id: "2.j", q: "When should you NOT brush right away?", options: ["After dinner", "Right after acidic food or drink", "After waking up", "Before bed"], correct: 1, explain: "Acid softens enamel. Wait ~30 minutes after acidic foods to let enamel re-harden before brushing." },
  ],
  3: [
    { id: "3.a", q: "How often should you floss?", options: ["Once a week", "Once a day", "Only when food sticks", "Once a month"], correct: 1, explain: "Once a day — bedtime is ideal. Floss reaches the 35% of tooth surface a brush can't." },
    { id: "3.b", q: "What does flossing primarily clean?", options: ["Tooth biting surface", "Between-tooth contacts", "Gum surface", "Cheeks"], correct: 1, explain: "Floss reaches the interproximal (between-tooth) area where decay and gum disease most commonly start." },
    { id: "3.c", q: "Which is better — floss or interdental brushes?", options: ["Always floss", "Always brushes", "Both work; brushes can be better for larger gaps", "Neither matters"], correct: 2, explain: "Interdental brushes are excellent for wider gaps; floss for tight contacts. Many people benefit from both." },
    { id: "3.d", q: "Mouthwash should be used:", options: ["Instead of brushing", "As a complement, not a replacement", "Only before dates", "Never"], correct: 1, explain: "Mouthwash is an extra — it cannot replace mechanical removal of plaque by brushing + flossing." },
    { id: "3.e", q: "Is bleeding gums when you start flossing normal?", options: ["Yes, but it should improve in 1–2 weeks", "No, stop immediately", "Means you're flossing wrong", "Means you have a cavity"], correct: 0, explain: "Light bleeding from inflamed gums is common when starting. If it persists beyond ~2 weeks, see a dentist." },
    { id: "3.f", q: "Water flossers are:", options: ["Useless", "A reasonable alternative for many people", "Only for kids", "Better than brushing"], correct: 1, explain: "Water flossers are good for braces or bridges and for people who struggle with string floss." },
    { id: "3.g", q: "Should you floss before or after brushing?", options: ["Always before", "Always after", "Either works — slight preference for before", "Doesn't matter at all"], correct: 2, explain: "Either order is fine. Flossing first loosens debris brushing then sweeps away — slightly preferred but the daily habit matters more than order." },
    { id: "3.h", q: "Which tool best reaches between back molars?", options: ["String floss only", "Interdental brush", "Water flosser", "Whatever you'll actually use daily"], correct: 3, explain: "All three can work. The best tool is the one you actually use every day." },
    { id: "3.i", q: "About how much floss should you use per session?", options: ["5 cm", "15 cm", "~45 cm (18 inches)", "Whole roll"], correct: 2, explain: "About 45 cm so you can use a fresh segment for each gap and avoid spreading bacteria." },
    { id: "3.j", q: "The 'C-shape' floss technique means:", options: ["Straight up-and-down only", "Wrapping floss around each tooth's curve", "Snapping it into the gum", "Jumping from side to side"], correct: 1, explain: "Hug the floss around each tooth in a C shape and slide it gently up and down to clean both adjacent surfaces." },
  ],
  4: [
    { id: "4.a", q: "What causes cavities?", options: ["Eating any food", "Acid produced by bacteria feeding on sugar", "Cold drinks", "Brushing too hard"], correct: 1, explain: "Oral bacteria metabolize sugars into acid that demineralizes enamel — that's the cavity process." },
    { id: "4.b", q: "What's the difference between plaque and tartar?", options: ["No difference", "Plaque is soft, tartar is hardened", "Tartar is on the tongue", "Plaque is mineral, tartar is bacterial"], correct: 1, explain: "Plaque is soft and removable by brushing. Once it mineralizes (≈48h), it becomes tartar and only a dental cleaning removes it." },
    { id: "4.c", q: "Can early cavities (before a hole) heal on their own?", options: ["No, never", "Yes — with fluoride + good hygiene, enamel can remineralize", "Only with surgery", "Only in children"], correct: 1, explain: "Pre-cavitated lesions can remineralize with fluoride exposure + reduced sugar — one of the strongest cases for prevention." },
    { id: "4.d", q: "Which teeth are most prone to cavities?", options: ["Front incisors", "Molars with deep grooves", "Wisdom teeth", "Canines"], correct: 1, explain: "Molars have deep pit-and-fissure grooves that trap plaque. That's why kids often get sealants on them." },
    { id: "4.e", q: "Sealants are most often applied to:", options: ["Front teeth", "Permanent molars", "Wisdom teeth", "Baby teeth only"], correct: 1, explain: "Sealants on permanent molars are the most evidence-backed cavity prevention for children + teens." },
    { id: "4.f", q: "What's the term for the hard outer layer of a tooth?", options: ["Dentin", "Pulp", "Enamel", "Cementum"], correct: 2, explain: "Enamel is the hardest substance in the human body — but it cannot regenerate once destroyed by decay." },
    { id: "4.g", q: "What's the FIRST visible sign of decay?", options: ["Black hole", "White chalky spot", "Brown stain", "Gum swelling"], correct: 1, explain: "White-spot lesions are the earliest sign — and the stage at which fluoride can still reverse decay." },
    { id: "4.h", q: "What does demineralization mean?", options: ["Strengthening enamel", "Mineral loss from enamel", "Polishing teeth", "Whitening"], correct: 1, explain: "Enamel loses calcium and phosphate when acid attacks — the cavity process begins here." },
    { id: "4.i", q: "Can cavities form under or around existing fillings?", options: ["No, never", "Yes — especially around the edges", "Only if metal", "Only in kids"], correct: 1, explain: "Recurrent decay along filling margins is one of the most common reasons fillings need replacement." },
    { id: "4.j", q: "Streptococcus mutans is:", options: ["A helpful bacterium", "The main cavity-causing bacterium", "A virus", "A gum-disease bacterium"], correct: 1, explain: "S. mutans efficiently metabolizes sugar into acid — the chief offender in tooth decay." },
  ],
  5: [
    { id: "5.a", q: "Gingivitis is:", options: ["Loss of teeth", "Reversible gum inflammation", "Tooth fracture", "A type of cavity"], correct: 1, explain: "Gingivitis is the first, reversible stage of gum disease — red, swollen, bleeding gums. Good hygiene reverses it." },
    { id: "5.b", q: "Periodontitis differs from gingivitis because:", options: ["It's the same thing", "It involves bone + ligament loss around teeth", "It only affects baby teeth", "It causes whitening"], correct: 1, explain: "Periodontitis is the advanced stage where supporting bone is destroyed — irreversible and a major cause of adult tooth loss." },
    { id: "5.c", q: "Which is a warning sign of gum disease?", options: ["White teeth", "Bleeding when brushing or flossing", "Strong jaw muscles", "Cold sensitivity only"], correct: 1, explain: "Bleeding gums are the most common early sign — gingivitis until proven otherwise." },
    { id: "5.d", q: "Smoking and gum disease:", options: ["Are unrelated", "Smoking masks symptoms + worsens disease", "Smoking prevents gum disease", "Only vaping is bad"], correct: 1, explain: "Tobacco reduces blood flow, so gums bleed less + look healthier than they are while the disease progresses faster underneath." },
    { id: "5.e", q: "Receding gums expose:", options: ["More enamel", "Tooth root, which is softer + more sensitive", "Pulp directly", "Nothing important"], correct: 1, explain: "The root surface lacks enamel — it's covered by softer cementum that's prone to decay + sensitivity." },
    { id: "5.f", q: "How often should an adult see a dentist for a cleaning?", options: ["Every 5 years", "When teeth hurt", "Every 6 months (or as advised)", "Only once in a lifetime"], correct: 2, explain: "Six-month checkups are the default — your dentist may adjust based on your gum health." },
    { id: "5.g", q: "What gum pocket depth is still considered healthy?", options: ["1–3 mm", "4–5 mm", "6+ mm", "Doesn't matter"], correct: 0, explain: "Healthy sulcus depth is 1–3 mm. 4 mm+ indicates problems and needs attention." },
    { id: "5.h", q: "Chronic bad breath usually originates from:", options: ["The stomach only", "Bacteria on the tongue + in gum pockets", "Tooth enamel", "Dehydration only"], correct: 1, explain: "Most chronic halitosis is oral in origin — sulfur compounds released by oral bacteria." },
    { id: "5.i", q: "Pregnancy gingivitis is:", options: ["A myth", "Real — caused by hormone changes", "Only in twins", "Prevented by sweets"], correct: 1, explain: "Hormonal changes increase blood flow + gum sensitivity. Extra hygiene during pregnancy matters." },
    { id: "5.j", q: "Diabetes and gum disease:", options: ["Are unrelated", "Have a two-way relationship — each worsens the other", "Only insulin matters", "Are the same condition"], correct: 1, explain: "It's bidirectional: uncontrolled diabetes worsens gum disease, and untreated gum disease raises blood sugar." },
  ],
  6: [
    { id: "6.a", q: "Which is worse for teeth — a piece of cake at lunch or sipping soda all afternoon?", options: ["Cake — more sugar", "Sipping soda — longer acid exposure", "Same", "Neither"], correct: 1, explain: "Frequency matters more than quantity. Constant sipping keeps your mouth in acid attack mode for hours." },
    { id: "6.b", q: "Cheese after a meal can:", options: ["Stain teeth", "Help neutralize acid + boost calcium", "Cause cavities directly", "Damage enamel"], correct: 1, explain: "Cheese raises mouth pH + adds calcium/phosphate — a long-known 'tooth-friendly' food." },
    { id: "6.c", q: "Sugar-free gum (with xylitol) is:", options: ["Bad for teeth", "Generally protective — boosts saliva + xylitol disrupts bacteria", "Same as sugar gum", "Only useful for fresh breath"], correct: 1, explain: "Xylitol gum is one of the few snacks that actually helps. Saliva is your mouth's natural defense." },
    { id: "6.d", q: "What pH is dangerous for enamel?", options: ["Below pH 5.5", "Above pH 8", "Exactly pH 7", "Doesn't matter"], correct: 0, explain: "Enamel demineralizes below ~pH 5.5. Soda is around pH 2.5–3.5 — well into the danger zone." },
    { id: "6.e", q: "Which drink is worst for teeth?", options: ["Water", "Milk", "Soda", "Black tea (no sugar)"], correct: 2, explain: "Soda combines acid + sugar — the worst single beverage for dental health." },
    { id: "6.f", q: "Acidic foods (lemon, vinegar) are harmless because they're natural.", options: ["True", "False — they erode enamel", "Only sour candy is bad", "Only at night"], correct: 1, explain: "Citrus and vinegar erode enamel just like soda. Natural ≠ safe for teeth." },
    { id: "6.g", q: "Best between-meals snack for teeth?", options: ["Candy", "Cheese or nuts", "Dried fruit", "Fruit juice"], correct: 1, explain: "Cheese and nuts neutralize acid + don't feed bacteria. Sticky dried fruit is surprisingly bad." },
    { id: "6.h", q: "Sticky sweets (caramel, toffee) are worse than chocolate because:", options: ["They cost more", "They cling to teeth longer", "They melt", "They're larger"], correct: 1, explain: "Stickiness = prolonged sugar contact with teeth = more acid attack." },
    { id: "6.i", q: "Drinking plain water during meals:", options: ["Erodes enamel", "Helps rinse food + acid away", "Doesn't matter", "Only fizzy water helps"], correct: 1, explain: "Plain water helps clear food debris and dilute acids during and after meals." },
    { id: "6.j", q: "Sugar substitutes like xylitol or stevia are:", options: ["Just as bad as sugar", "Neutral or slightly protective for teeth", "Worse than sugar", "Only flavoring"], correct: 1, explain: "They don't feed cavity-causing bacteria. Xylitol may even disrupt their metabolism." },
  ],
  7: [
    { id: "7.a", q: "When should you start brushing a baby's teeth?", options: ["At age 5", "As soon as the first tooth appears", "After 1st birthday", "Only at the dentist"], correct: 1, explain: "Brush as soon as the first tooth erupts — a small smear of fluoride toothpaste twice a day." },
    { id: "7.b", q: "True or false: baby teeth don't matter because they fall out anyway.", options: ["True", "False — they affect adult tooth eruption + speech", "True for back teeth only", "Only matters for front teeth"], correct: 1, explain: "Premature loss of baby teeth misaligns the permanent teeth that follow and harms speech development." },
    { id: "7.c", q: "When does the first baby tooth typically erupt?", options: ["At birth", "3 months", "6–10 months", "2 years"], correct: 2, explain: "Most babies get their first tooth around 6–10 months, usually the lower central incisor." },
    { id: "7.d", q: "Total baby teeth count:", options: ["10", "16", "20", "32"], correct: 2, explain: "20 primary teeth — they're fully in by around age 3." },
    { id: "7.e", q: "First dental visit for a child should be:", options: ["Age 5", "First birthday or when first tooth erupts", "Only when in pain", "Age 10"], correct: 1, explain: "Around the first birthday lets the dentist screen for risk + show parents proper technique." },
    { id: "7.f", q: "Putting a baby to bed with a bottle of milk or juice:", options: ["Is fine", "Causes baby-bottle caries — pooling sugar on teeth", "Helps them sleep safely", "Strengthens enamel"], correct: 1, explain: "Pooled milk feeds bacteria all night, causing rapid decay of the upper front teeth." },
    { id: "7.g", q: "Thumb-sucking past which age can affect tooth alignment?", options: ["Age 1", "Age 4–5+", "Age 8+", "Never affects it"], correct: 1, explain: "Prolonged thumb-sucking past age 4–5 may push front teeth out of alignment as adult teeth come in." },
    { id: "7.h", q: "Knocked-out PERMANENT tooth — what should you do?", options: ["Throw it out", "Place in milk + see dentist immediately", "Scrub it with soap", "Leave it on the ground"], correct: 1, explain: "Time matters. Milk preserves the tooth; reimplantation within an hour gives the best chance of survival." },
    { id: "7.i", q: "Knocked-out BABY tooth — should you reimplant it?", options: ["Yes, always", "No — can damage the developing permanent tooth", "Only if clean", "Only if it bleeds"], correct: 1, explain: "Replanting baby teeth can damage the unerupted permanent tooth bud underneath." },
    { id: "7.j", q: "The first PERMANENT molar typically erupts around:", options: ["Birth", "Age 6", "Age 12", "Age 18"], correct: 1, explain: "Around age 6 — often mistaken for baby teeth because they appear behind the others rather than replacing one." },
  ],
  8: [
    { id: "8.a", q: "What does fluoride do?", options: ["Whitens teeth", "Strengthens enamel + helps it resist acid", "Replaces lost enamel directly", "Kills all bacteria"], correct: 1, explain: "Fluoride incorporates into enamel as fluorapatite — more acid-resistant than the original hydroxyapatite." },
    { id: "8.b", q: "Adult fluoride toothpaste should be (parts per million):", options: ["100 ppm", "300 ppm", "1000–1500 ppm", "10,000 ppm"], correct: 2, explain: "1000–1500 ppm is the standard adult range. Higher (5000 ppm) is prescription for high-risk patients." },
    { id: "8.c", q: "For kids under 3, the right toothpaste amount is:", options: ["Pea-sized", "A small smear (grain of rice)", "Full brush head", "No toothpaste at all"], correct: 1, explain: "A smear under 3, pea-size from age 3 — minimizes swallowing while still delivering fluoride." },
    { id: "8.d", q: "Active ingredient that kills bacteria in some mouthwashes:", options: ["Sugar", "Chlorhexidine", "Calcium", "Vitamin C"], correct: 1, explain: "Chlorhexidine is the gold-standard antimicrobial — but stains teeth with long-term use, so short courses only." },
    { id: "8.e", q: "Whitening toothpastes work by:", options: ["Bleaching the tooth", "Removing surface stains (abrasion or mild peroxide)", "Coating teeth in white paint", "Replacing enamel"], correct: 1, explain: "Most are abrasives + low-concentration peroxide that lift surface stains — they don't change the underlying tooth color much." },
    { id: "8.f", q: "Dental fluorosis is caused by:", options: ["Too little fluoride", "Too much fluoride during tooth formation", "Acid only", "Sugar"], correct: 1, explain: "Excess fluoride during enamel formation creates white streaks — cosmetic but usually mild." },
    { id: "8.g", q: "Toothpaste-swallowing in young kids matters because:", options: ["Of flavor", "The fluoride dose can become too high", "Of the sugar", "It doesn't matter"], correct: 1, explain: "Pea-sized for over 3, smear for under 3 — limits ingested fluoride to a safe level." },
    { id: "8.h", q: "Community water fluoridation is:", options: ["An untested experiment", "A well-studied public-health measure that reduces cavities", "Banned worldwide", "Only used in one country"], correct: 1, explain: "One of the most studied + effective dental public-health interventions of the 20th century." },
    { id: "8.i", q: "Stannous fluoride differs from sodium fluoride by also:", options: ["Containing sugar", "Reducing plaque + gingivitis", "Costing less", "Being clear in color"], correct: 1, explain: "Stannous adds antibacterial + anti-sensitivity properties on top of cavity protection." },
    { id: "8.j", q: "Fluoride works best when applied:", options: ["Once a year at the dentist", "Only after every meal", "Frequently in small doses (brushing twice daily)", "Only by injection"], correct: 2, explain: "Fluoride works topically. Daily exposure from toothpaste matters more than dose size." },
  ],
  9: [
    { id: "9.a", q: "A filling restores a tooth after:", options: ["Cracks only", "Decay has been drilled out", "A whitening procedure", "Gum surgery"], correct: 1, explain: "After removing the decayed tissue, the dentist fills the cavity with composite or amalgam." },
    { id: "9.b", q: "A root canal treats:", options: ["Outer enamel", "Infected/inflamed pulp inside the tooth", "Gums only", "Wisdom teeth growth"], correct: 1, explain: "When decay or trauma infects the pulp, the canal is cleaned + sealed to save the tooth." },
    { id: "9.c", q: "A crown is:", options: ["Royal jewelry", "A cap covering a damaged tooth", "Whitening gel", "Type of toothpaste"], correct: 1, explain: "Crowns cover and protect teeth that are heavily filled, broken, or post root-canal." },
    { id: "9.d", q: "Extractions (tooth removal) usually need:", options: ["No follow-up", "Possibly a bridge/implant/denture to fill the gap", "Same-day implants always", "Only painkillers"], correct: 1, explain: "An empty space lets neighboring teeth shift — replacement options keep alignment + chewing intact." },
    { id: "9.e", q: "Dental implants are:", options: ["Glue-on teeth", "Titanium roots fused with bone, topped by a crown", "Removable dentures", "Always temporary"], correct: 1, explain: "Implants osseointegrate (bond directly with bone), then a crown or bridge attaches on top." },
    { id: "9.f", q: "How long do most composite fillings last?", options: ["About 1 year", "5–10 years on average", "50+ years", "Forever"], correct: 1, explain: "Composite lifespan depends on bite, hygiene, and technique — but 5–10 years is typical." },
    { id: "9.g", q: "What replaces a single missing tooth long-term?", options: ["Just a gold cap", "Bridge or implant", "Only glue", "Nothing needed"], correct: 1, explain: "Bridges anchor to neighboring teeth; implants integrate into bone. Both have decades of evidence." },
    { id: "9.h", q: "Wisdom teeth often need extraction because:", options: ["They always hurt", "Modern jaws are often too small + they impact other teeth", "The dentist needs money", "They cause headaches"], correct: 1, explain: "Modern jaws are smaller. Impacted wisdom teeth crowd or damage neighbors, driving removal decisions." },
    { id: "9.i", q: "Brief sensitivity after a filling is:", options: ["Never normal", "Common — settles in a few days", "A sign of infection", "Only with metal fillings"], correct: 1, explain: "Mild sensitivity to cold/pressure is common. Pain that persists beyond ~2 weeks needs follow-up." },
    { id: "9.j", q: "Scaling and root planing (SRP) treats:", options: ["Cavities", "Gum disease — a deep clean below the gumline", "Wisdom teeth", "Root canals"], correct: 1, explain: "SRP is the non-surgical deep clean for periodontitis — removes tartar below the gumline." },
  ],
  10: [
    { id: "10.a", q: "How many teeth does a typical adult have?", options: ["20", "28", "32 (with wisdom teeth)", "40"], correct: 2, explain: "32 total — 28 if wisdom teeth are missing or removed." },
    { id: "10.b", q: "Incisors are the teeth used mainly for:", options: ["Grinding", "Cutting/biting", "Tearing", "Chewing only"], correct: 1, explain: "The flat, sharp front teeth — 8 in total (4 upper, 4 lower)." },
    { id: "10.c", q: "Canines are designed for:", options: ["Cutting", "Tearing/grasping (they're the pointed ones)", "Grinding", "Decoration"], correct: 1, explain: "Pointed, often the strongest tooth — there are 4 (one in each quadrant)." },
    { id: "10.d", q: "Premolars sit between:", options: ["Two molars", "Canine and molar", "Two incisors", "Wisdom teeth only"], correct: 1, explain: "Premolars (bicuspids) bridge tearing canines and grinding molars. 8 in total in adults." },
    { id: "10.e", q: "The pulp of a tooth contains:", options: ["Only enamel", "Nerve + blood supply", "Air", "Tartar"], correct: 1, explain: "The pulp chamber is the living core — nerves and blood vessels enter through the root canal." },
    { id: "10.f", q: "Dentin is:", options: ["Harder than enamel", "Softer + yellower, under the enamel", "Outside the tooth", "Only in baby teeth"], correct: 1, explain: "Dentin is the bulk of the tooth under the enamel — softer, slightly yellow, and full of tiny tubules." },
    { id: "10.g", q: "The mandible is:", options: ["The upper jaw", "The lower jaw", "A type of tooth", "The tongue"], correct: 1, explain: "Mandible = lower jaw. Upper jaw is the maxilla." },
    { id: "10.h", q: "How many adult molars do most people have, including wisdom?", options: ["4", "8", "12", "20"], correct: 2, explain: "12 molars — three on each side, top and bottom. The third molar is the wisdom tooth." },
    { id: "10.i", q: "The hardest substance in the human body is:", options: ["Bone", "Dentin", "Enamel", "Cementum"], correct: 2, explain: "Enamel — about 96% mineral content, harder than steel by some measures." },
    { id: "10.j", q: "TMJ stands for:", options: ["Tooth-managed joint", "Temporomandibular joint", "Temporo-molar joint", "Teeth-migration jaw"], correct: 1, explain: "The joint connecting your lower jaw to your skull. TMJ disorders cause jaw pain and clicking." },
  ],
};

/** Deterministically shuffles a copy of `items` (Fisher-Yates). */
function shuffled<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build the round's question deck.
 *   - Fixed levels (1..10): shuffle that level's 10 questions; play in order.
 *   - Endless (11): concat ALL level pools, shuffle, walk through. When the
 *     full deck is exhausted, the caller reshuffles a fresh copy so the
 *     player never sees a repeat within the same 100-question cycle.
 */
function buildDeck(level: number): Question[] {
  if (level >= 11) {
    const all: Question[] = [];
    for (let i = 1; i <= 10; i += 1) {
      all.push(...POOL[i]);
    }
    return shuffled(all);
  }
  const pool = POOL[level] || POOL[1];
  return shuffled(pool);
}

function levelTimePerQ(level: number): number {
  // 15s at L1 → 9s at L10. Endless ramps from 13 down.
  if (level >= 11) return 11_000;
  return Math.max(9_000, 16_000 - level * 700);
}

export function ToothIqGame({ level, onFinish, onCancel, hudSlot }: GameProps) {
  const t = useTranslation();
  const endless = level >= 11;
  const timePerQ = useMemo(() => levelTimePerQ(level), [level]);

  // The round deck — built once when the game mounts. For endless, when the
  // deck runs out we generate a fresh shuffle so there are never repeats
  // within a 100-question cycle.
  const [deck, setDeck] = useState<Question[]>(() => buildDeck(level));
  const [index, setIndex] = useState(0);
  const current = deck[index];

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0); // cumulative wrong answers
  const [chosen, setChosen] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [over, setOver] = useState<null | "win" | "fail">(null);
  const [overReason, setOverReason] = useState("");

  const startedRef = useRef(Date.now());

  const submit = useCallback(
    (final: number) => {
      onFinish(final, Date.now() - startedRef.current);
    },
    [onFinish],
  );

  // Per-question timer
  useEffect(() => {
    if (!current || chosen !== null || over) return;
    const start = Date.now();
    setTimeLeft(timePerQ);
    const id = window.setInterval(() => {
      const left = timePerQ - (Date.now() - start);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(id);
        // Timeout — treat as wrong answer.
        handleChoice(-1);
      }
    }, 90);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, chosen, over, timePerQ]);

  function handleChoice(choiceIdx: number) {
    if (chosen !== null) return;
    setChosen(choiceIdx);
    setReveal(true);
    const correct = choiceIdx === current.correct;
    let earnedThisQ = 0;
    if (correct) {
      const timeRemain = Math.max(0, timeLeft);
      const timeBonus = Math.round((timeRemain / timePerQ) * 80);
      const newStreak = streak + 1;
      const streakBonus = Math.min(150, newStreak * 20);
      earnedThisQ = 100 + timeBonus + streakBonus;
      setScore((s) => s + earnedThisQ);
      setStreak(newStreak);
    } else {
      setStreak(0);
      setMistakes((m) => m + 1);
    }

    window.setTimeout(() => {
      const nextIndex = index + 1;
      const newMistakes = correct ? mistakes : mistakes + 1;

      // Endless ends on the 3rd CUMULATIVE wrong answer.
      if (endless && newMistakes >= ENDLESS_MISS_LIMIT) {
        setOver("fail");
        setOverReason(t("arcade.iq.over_fail"));
        window.setTimeout(() => submit(score + earnedThisQ), 1800);
        return;
      }

      // Fixed-level round ends after 10 questions.
      if (!endless && nextIndex >= QUESTIONS_PER_ROUND) {
        setOver("win");
        setOverReason(t("arcade.iq.over_win"));
        window.setTimeout(() => submit(score + earnedThisQ), 1800);
        return;
      }

      // Endless: reshuffle a fresh deck when we exhaust the current one so
      // the player keeps seeing each unique question once per cycle.
      if (endless && nextIndex >= deck.length) {
        setDeck(buildDeck(level));
        setIndex(0);
      } else {
        setIndex(nextIndex);
      }
      setChosen(null);
      setReveal(false);
    }, 2400);
  }

  const hud = (
    <div className="flex flex-wrap items-center gap-2">
      <HudChip label={t("arcade.hud.score")} value={score} variant="score" />
      <HudChip
        label={t("arcade.iq.hud_question")}
        value={endless ? `${index + 1}` : `${index + 1}/${QUESTIONS_PER_ROUND}`}
        variant="combo"
      />
      <HudChip
        label={t("arcade.hud.combo")}
        value={streak}
        variant={streak >= 3 ? "score" : "neutral"}
      />
      {endless ? (
        <HudChip
          label={t("arcade.hud.misses")}
          value={`${mistakes}/${ENDLESS_MISS_LIMIT}`}
          variant={mistakes >= 2 ? "danger" : "neutral"}
          urgent={mistakes >= 2}
        />
      ) : null}
      <HudChip
        label={t("arcade.hud.level")}
        value={endless ? t("arcade.hud.endless") : level}
        variant="level"
      />
    </div>
  );

  if (!current) {
    // Shouldn't happen — defensive fallback while a deck reshuffles.
    return null;
  }

  const progress = chosen !== null ? 1 : Math.max(0, timeLeft / timePerQ);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 p-4 sm:p-6">
      {hudSlot ? createPortal(hud, hudSlot) : null}

      <div className="w-full max-w-2xl">
        {/* Timer bar */}
        <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full border border-white/15 bg-black/40">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${progress * 100}%`,
              background:
                progress < 0.3
                  ? "linear-gradient(90deg,rgba(248,113,113,0.95),rgba(244,63,94,0.95))"
                  : "linear-gradient(90deg,rgba(94,234,212,0.95),rgba(56,189,248,0.95))",
            }}
          />
        </div>

        {/* Question */}
        <div
          key={current.id}
          className="rounded-[24px] border border-white/20 px-5 py-6 text-center text-white shadow-[0_18px_44px_rgba(2,6,18,0.55)] backdrop-blur"
          style={{
            // Solid dark indigo at high opacity so the question text is
            // legible regardless of theme — the focus-stage backdrop can
            // sometimes thin out in light mode and a near-transparent panel
            // becomes unreadable against the page chrome.
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.95))",
            animation: "denty-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
            {endless
              ? t("arcade.iq.endless_question_label", { n: index + 1 })
              : t("arcade.iq.question_label", { n: index + 1, total: QUESTIONS_PER_ROUND })}
          </p>
          <p className="mt-3 text-lg font-extrabold leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] sm:text-xl">
            {current.q}
          </p>
        </div>

        {/* Options */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {current.options.map((opt, i) => {
            const isCorrect = i === current.correct;
            const isChosen = chosen === i;
            const showCorrect = reveal && isCorrect;
            const showWrong = reveal && isChosen && !isCorrect;
            return (
              <button
                key={i}
                type="button"
                disabled={chosen !== null || over !== null}
                onClick={() => handleChoice(i)}
                className="min-h-[3rem] rounded-[16px] border px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition hover:brightness-110 disabled:cursor-default"
                style={{
                  borderColor: showCorrect
                    ? "rgba(94,234,212,0.95)"
                    : showWrong
                      ? "rgba(248,113,113,0.95)"
                      : "rgba(255,255,255,0.28)",
                  background: showCorrect
                    ? "linear-gradient(135deg,rgba(20,184,166,0.75),rgba(13,148,136,0.85))"
                    : showWrong
                      ? "linear-gradient(135deg,rgba(244,63,94,0.7),rgba(190,18,60,0.8))"
                      : "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.92))",
                  boxShadow: showCorrect
                    ? "0 0 22px rgba(94,234,212,0.55)"
                    : showWrong
                      ? "0 0 22px rgba(248,113,113,0.5)"
                      : "0 4px 12px rgba(0,0,0,0.25)",
                  animation: isChosen
                    ? "denty-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both"
                    : undefined,
                }}
              >
                <span className="inline-block w-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation reveal */}
        {reveal ? (
          <div
            className="mt-4 rounded-[18px] border border-white/22 bg-black/75 px-4 py-3 text-sm text-white backdrop-blur"
            style={{
              animation: "denty-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color:
                  chosen === current.correct
                    ? "rgb(94,234,212)"
                    : "rgb(248,113,113)",
              }}
            >
              {chosen === current.correct
                ? t("arcade.iq.reveal_correct")
                : t("arcade.iq.reveal_wrong")}
            </p>
            <p className="mt-1 text-white/95">{current.explain}</p>
          </div>
        ) : null}
      </div>

      {/* Game-over banner */}
      {over ? (
        <div
          className="absolute inset-x-4 top-1/2 z-40 -translate-y-1/2 rounded-[22px] border border-white/22 bg-black/70 px-6 py-5 text-center text-white shadow-[0_30px_70px_rgba(2,6,18,0.6)] backdrop-blur"
          style={{
            animation: "denty-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/65">
            {over === "win"
              ? t("arcade.iq.over_win_eyebrow")
              : t("arcade.iq.over_fail_eyebrow")}
          </p>
          <p className="mt-2 text-2xl font-extrabold">{overReason}</p>
          <p className="mt-1 text-sm text-white/80">
            {t("arcade.iq.over_score", { score })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
