import type { QuizCategory } from "@/features/game/services/game-api";

/**
 * Local copy of the 15 dental quiz questions including the `correctIndex`.
 *
 * The backend deliberately strips `correctIndex` from `GET /game/questions`
 * to keep the answers off the wire. For the graduation demo we score the
 * quiz client-side using this list so the doctor gets immediate feedback.
 * The id values match the backend's seeded questions one-to-one so we can
 * reason about a single source of truth at review time.
 *
 * In production we would post `{ questionId, optionIndex }` per answer to
 * the backend and let the server compute the score.
 */
export type LocalQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  category: QuizCategory;
  correctIndex: number;
};

export const LOCAL_QUIZ_QUESTIONS: LocalQuizQuestion[] = [
  // ---- Anatomy ---------------------------------------------------------
  {
    id: "q-anatomy-1",
    category: "anatomy",
    prompt: "How many permanent teeth does a healthy adult dentition contain?",
    options: ["20", "28", "32", "36"],
    correctIndex: 2,
  },
  {
    id: "q-anatomy-2",
    category: "anatomy",
    prompt:
      "Which tissue forms the hardest layer covering the anatomical crown of a tooth?",
    options: ["Dentin", "Cementum", "Enamel", "Pulp"],
    correctIndex: 2,
  },
  {
    id: "q-anatomy-3",
    category: "anatomy",
    prompt:
      "Which nerve supplies general sensation to the lower teeth and surrounding mucosa?",
    options: [
      "Maxillary division of trigeminal (V2)",
      "Inferior alveolar nerve",
      "Facial nerve (VII)",
      "Glossopharyngeal nerve (IX)",
    ],
    correctIndex: 1,
  },

  // ---- Caries ----------------------------------------------------------
  {
    id: "q-caries-1",
    category: "caries",
    prompt: "Which microorganism is most strongly associated with caries initiation?",
    options: [
      "Porphyromonas gingivalis",
      "Streptococcus mutans",
      "Candida albicans",
      "Treponema denticola",
    ],
    correctIndex: 1,
  },
  {
    id: "q-caries-2",
    category: "caries",
    prompt:
      "At roughly what plaque pH does enamel demineralisation typically begin?",
    options: ["pH 7.0", "pH 6.2", "pH 5.5", "pH 4.0"],
    correctIndex: 2,
  },
  {
    id: "q-caries-3",
    category: "caries",
    prompt:
      "Which finding most reliably indicates an active early enamel caries lesion?",
    options: [
      "Shiny brown stain that catches a sharp probe",
      "Chalky white spot that loses lustre when air-dried",
      "Generalised yellowing of the cervical third",
      "Vertical crack visible under transillumination",
    ],
    correctIndex: 1,
  },

  // ---- Periodontics ----------------------------------------------------
  {
    id: "q-periodontics-1",
    category: "periodontics",
    prompt:
      "What is the typical probing depth of a healthy gingival sulcus in an adult?",
    options: ["0-1 mm", "1-3 mm", "4-5 mm", "6-8 mm"],
    correctIndex: 1,
  },
  {
    id: "q-periodontics-2",
    category: "periodontics",
    prompt:
      "Which feature best distinguishes periodontitis from gingivitis on examination?",
    options: [
      "Bleeding on probing",
      "Marginal erythema",
      "Clinical attachment loss",
      "Visible supragingival plaque",
    ],
    correctIndex: 2,
  },
  {
    id: "q-periodontics-3",
    category: "periodontics",
    prompt:
      "Which instrument is the first-line choice for supragingival calculus removal?",
    options: [
      "Gracey curette 13/14",
      "Universal sickle scaler",
      "Periodontal file",
      "Furcation probe",
    ],
    correctIndex: 1,
  },

  // ---- Endodontics -----------------------------------------------------
  {
    id: "q-endodontics-1",
    category: "endodontics",
    prompt:
      "Which pulp test most directly assesses the vascular supply rather than the nerve response?",
    options: [
      "Electric pulp test",
      "Cold (Endo-Ice) test",
      "Heat test with warm gutta-percha",
      "Laser Doppler flowmetry",
    ],
    correctIndex: 3,
  },
  {
    id: "q-endodontics-2",
    category: "endodontics",
    prompt:
      "Which irrigant is the standard primary solution for dissolving necrotic pulp tissue during root canal treatment?",
    options: [
      "0.9% saline",
      "2% chlorhexidine",
      "Sodium hypochlorite",
      "Hydrogen peroxide",
    ],
    correctIndex: 2,
  },
  {
    id: "q-endodontics-3",
    category: "endodontics",
    prompt:
      "How many root canals are most commonly found in a maxillary first molar?",
    options: ["1", "2", "3", "4"],
    correctIndex: 3,
  },

  // ---- Oral surgery ----------------------------------------------------
  {
    id: "q-oral-surgery-1",
    category: "oral-surgery",
    prompt:
      "Which local anaesthetic technique is most commonly used to anaesthetise a mandibular molar for extraction?",
    options: [
      "Buccal infiltration only",
      "Inferior alveolar nerve block",
      "Greater palatine block",
      "Posterior superior alveolar block",
    ],
    correctIndex: 1,
  },
  {
    id: "q-oral-surgery-2",
    category: "oral-surgery",
    prompt:
      "Which complication is classically associated with a lower third molar extraction?",
    options: [
      "Maxillary sinus perforation",
      "Inferior alveolar nerve paraesthesia",
      "Greater palatine artery bleed",
      "Facial nerve palsy",
    ],
    correctIndex: 1,
  },
  {
    id: "q-oral-surgery-3",
    category: "oral-surgery",
    prompt:
      "A patient returns three days after an extraction with severe pain and an empty-looking socket with a foul odour. Most likely diagnosis?",
    options: [
      "Acute apical abscess",
      "Osteomyelitis",
      "Alveolar osteitis (dry socket)",
      "Postoperative haematoma",
    ],
    correctIndex: 2,
  },
];

export const QUIZ_LENGTH = 10;
