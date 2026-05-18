export type QuizCategory =
  | "anatomy"
  | "caries"
  | "periodontics"
  | "endodontics"
  | "oral-surgery";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[]; // 4 options
  correctIndex: number; // 0-3
  category: QuizCategory;
};

export const QUIZ_QUESTIONS: ReadonlyArray<QuizQuestion> = [
  // ---------- anatomy ----------
  {
    id: "q1",
    prompt: "How many permanent teeth does a typical adult human have?",
    options: ["20", "28", "32", "36"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    id: "q2",
    prompt: "Which is the hardest tissue in the human body?",
    options: ["Bone", "Dentin", "Cementum", "Enamel"],
    correctIndex: 3,
    category: "anatomy",
  },
  {
    id: "q3",
    prompt: "Which tooth is commonly known as the 'eye tooth'?",
    options: ["Incisor", "Canine", "Premolar", "Molar"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    id: "q4",
    prompt: "How many roots does a typical maxillary first molar have?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 2,
    category: "anatomy",
  },

  // ---------- caries ----------
  {
    id: "q5",
    prompt: "Which bacterium is most associated with dental caries?",
    options: [
      "Streptococcus mutans",
      "Escherichia coli",
      "Staphylococcus aureus",
      "Lactobacillus bulgaricus",
    ],
    correctIndex: 0,
    category: "caries",
  },
  {
    id: "q6",
    prompt: "What is the primary mineral lost from enamel during caries?",
    options: ["Iron", "Calcium", "Sodium", "Potassium"],
    correctIndex: 1,
    category: "caries",
  },
  {
    id: "q7",
    prompt: "Which ion in toothpaste helps remineralize early caries lesions?",
    options: ["Chloride", "Fluoride", "Sulfate", "Nitrate"],
    correctIndex: 1,
    category: "caries",
  },

  // ---------- periodontics ----------
  {
    id: "q8",
    prompt: "Gingivitis is best described as:",
    options: [
      "Inflammation of the pulp",
      "Inflammation of the gingiva",
      "Loss of alveolar bone",
      "A jaw fracture",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    id: "q9",
    prompt: "Calculus on teeth is essentially:",
    options: [
      "Hardened (mineralized) dental plaque",
      "Food debris",
      "A type of stain",
      "Tooth enamel chips",
    ],
    correctIndex: 0,
    category: "periodontics",
  },
  {
    id: "q10",
    prompt:
      "Which instrument is most commonly used to measure periodontal pocket depth?",
    options: [
      "Mirror",
      "Periodontal probe",
      "Explorer",
      "Excavator",
    ],
    correctIndex: 1,
    category: "periodontics",
  },

  // ---------- endodontics ----------
  {
    id: "q11",
    prompt: "What does a root canal treatment primarily treat?",
    options: [
      "Gum recession",
      "Infected or inflamed dental pulp",
      "Misaligned teeth",
      "Tartar buildup",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    id: "q12",
    prompt: "The dental pulp mainly contains:",
    options: [
      "Only enamel cells",
      "Nerves and blood vessels",
      "Cementum fibers",
      "Bone marrow",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    id: "q13",
    prompt: "Which material is most commonly used to fill the root canal space?",
    options: ["Amalgam", "Composite resin", "Gutta-percha", "Glass ionomer"],
    correctIndex: 2,
    category: "endodontics",
  },

  // ---------- oral-surgery ----------
  {
    id: "q14",
    prompt:
      "Which third molars are commonly referred to as 'wisdom teeth'?",
    options: [
      "First molars",
      "Second molars",
      "Third molars",
      "Deciduous molars",
    ],
    correctIndex: 2,
    category: "oral-surgery",
  },
  {
    id: "q15",
    prompt: "Which local anesthetic is most commonly used in dentistry?",
    options: ["Lidocaine", "Penicillin", "Ibuprofen", "Aspirin"],
    correctIndex: 0,
    category: "oral-surgery",
  },
];
