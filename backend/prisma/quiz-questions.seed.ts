/**
 * DentyHub quiz question bank — 150 dental knowledge questions
 * 30 per category: anatomy, caries, periodontics, endodontics, oral-surgery
 *
 * Targeted at 4th-year dental student level. Each question has exactly 4 options
 * with a single correct answer (correctIndex). Prompts are <= ~200 chars.
 * Used by prisma/seed.ts -> seedQuizQuestions().
 */

export type SeedQuizQuestion = {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  category:
    | "anatomy"
    | "caries"
    | "periodontics"
    | "endodontics"
    | "oral-surgery";
};

export const QUIZ_QUESTIONS_SEED: ReadonlyArray<SeedQuizQuestion> = [
  // =====================================================================
  // ANATOMY (30)
  // =====================================================================
  {
    prompt: "How many permanent teeth does a typical adult human have?",
    options: ["20", "28", "32", "36"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Which is the hardest tissue in the human body?",
    options: ["Bone", "Dentin", "Cementum", "Enamel"],
    correctIndex: 3,
    category: "anatomy",
  },
  {
    prompt: "Which tooth is commonly known as the 'eye tooth'?",
    options: ["Central incisor", "Canine", "Premolar", "Molar"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "How many roots does a typical maxillary first molar have?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Using the FDI (ISO) numbering system, what number is the maxillary right central incisor?",
    options: ["11", "21", "31", "41"],
    correctIndex: 0,
    category: "anatomy",
  },
  {
    prompt: "Using the Universal Numbering System, which tooth is #8?",
    options: [
      "Maxillary right canine",
      "Maxillary right central incisor",
      "Mandibular right central incisor",
      "Maxillary left central incisor",
    ],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which cranial nerve supplies general sensation to the maxillary teeth?",
    options: ["V1 (ophthalmic)", "V2 (maxillary)", "V3 (mandibular)", "VII (facial)"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which nerve provides sensation to the mandibular teeth?",
    options: [
      "Greater palatine",
      "Inferior alveolar",
      "Nasopalatine",
      "Long buccal",
    ],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "How many cusps does a typical maxillary first premolar have?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which tooth most commonly has a 'cusp of Carabelli'?",
    options: [
      "Mandibular first molar",
      "Maxillary first molar",
      "Maxillary canine",
      "Mandibular second premolar",
    ],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "How many roots does a typical mandibular first molar have?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "What is the total number of primary (deciduous) teeth in a child?",
    options: ["16", "20", "24", "28"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "At what approximate age does the mandibular permanent first molar typically erupt?",
    options: ["3 years", "6 years", "9 years", "12 years"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which muscle is the primary elevator of the mandible during chewing?",
    options: ["Buccinator", "Masseter", "Mylohyoid", "Platysma"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which structure separates the oral cavity from the nasal cavity?",
    options: [
      "Tongue",
      "Hard and soft palate",
      "Pharyngeal wall",
      "Floor of mouth",
    ],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Stensen's duct drains which salivary gland?",
    options: ["Submandibular", "Sublingual", "Parotid", "Minor labial"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Wharton's duct drains which salivary gland?",
    options: ["Parotid", "Submandibular", "Sublingual", "Buccal"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "The temporomandibular joint articulates the mandibular condyle with which bone?",
    options: ["Maxilla", "Zygomatic", "Temporal", "Sphenoid"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Which layer of enamel orientation gives it its characteristic prismatic structure?",
    options: ["Hunter-Schreger bands", "Tomes' granular layer", "Sharpey's fibers", "Rests of Malassez"],
    correctIndex: 0,
    category: "anatomy",
  },
  {
    prompt: "Which cells form dentin?",
    options: ["Ameloblasts", "Odontoblasts", "Cementoblasts", "Osteoblasts"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which cells form enamel?",
    options: ["Odontoblasts", "Ameloblasts", "Fibroblasts", "Cementoblasts"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Cementum is most similar in composition to which tissue?",
    options: ["Enamel", "Dentin", "Bone", "Cartilage"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Which area of the tooth typically has the thinnest enamel coverage?",
    options: ["Incisal edge", "Cuspal tip", "Cervical (CEJ)", "Mid-buccal surface"],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Approximately what percentage of mature enamel is inorganic mineral by weight?",
    options: ["50%", "70%", "85%", "96%"],
    correctIndex: 3,
    category: "anatomy",
  },
  {
    prompt: "Which permanent tooth is usually the last to erupt?",
    options: [
      "Maxillary canine",
      "Mandibular second molar",
      "Third molar",
      "Maxillary second premolar",
    ],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Which structure passes through the mental foramen?",
    options: [
      "Inferior alveolar artery",
      "Mental nerve",
      "Lingual nerve",
      "Long buccal nerve",
    ],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which muscle inserts onto the pterygoid fovea of the mandibular condyle?",
    options: [
      "Temporalis",
      "Masseter",
      "Lateral pterygoid",
      "Medial pterygoid",
    ],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "Which artery is the major blood supply to the mandibular teeth?",
    options: [
      "Facial artery",
      "Lingual artery",
      "Inferior alveolar artery",
      "Maxillary sinus artery",
    ],
    correctIndex: 2,
    category: "anatomy",
  },
  {
    prompt: "The pulp chamber roof of a posterior tooth is bounded coronally by which structure?",
    options: ["Cementum", "Pulp horns", "Apical foramen", "Cervical line"],
    correctIndex: 1,
    category: "anatomy",
  },
  {
    prompt: "Which papillae on the dorsum of the tongue contain the majority of taste buds?",
    options: ["Filiform", "Fungiform and circumvallate", "Foliate only", "Keratinized only"],
    correctIndex: 1,
    category: "anatomy",
  },

  // =====================================================================
  // CARIES (30)
  // =====================================================================
  {
    prompt: "Which bacterium is most strongly associated with the initiation of dental caries?",
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
    prompt: "What is the primary mineral lost from enamel during the early caries process?",
    options: ["Iron", "Calcium phosphate", "Sodium chloride", "Potassium"],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which ion in toothpaste primarily aids remineralization of early caries lesions?",
    options: ["Chloride", "Fluoride", "Sulfate", "Nitrate"],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Below approximately which critical pH does enamel begin to demineralize?",
    options: ["pH 7.0", "pH 6.5", "pH 5.5", "pH 4.0"],
    correctIndex: 2,
    category: "caries",
  },
  {
    prompt: "The 'white spot lesion' represents which stage of caries?",
    options: [
      "Cavitated dentinal caries",
      "Early subsurface enamel demineralization",
      "Pulpal involvement",
      "Arrested dentinal caries",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which dietary sugar is most cariogenic?",
    options: ["Lactose", "Sucrose", "Xylitol", "Sorbitol"],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which sugar substitute has been shown to reduce S. mutans counts?",
    options: ["Fructose", "Glucose", "Xylitol", "Maltose"],
    correctIndex: 2,
    category: "caries",
  },
  {
    prompt: "ICDAS code 0 corresponds to which clinical finding?",
    options: [
      "Sound tooth surface",
      "First visual change in enamel after drying",
      "Distinct visual change in enamel",
      "Localized enamel breakdown",
    ],
    correctIndex: 0,
    category: "caries",
  },
  {
    prompt: "Which surface of a posterior tooth is most prone to occlusal caries?",
    options: [
      "Smooth buccal surface",
      "Pit and fissure system",
      "Lingual cusp",
      "Cementum",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which preventive measure is most effective for occlusal pit-and-fissure caries in children?",
    options: [
      "Fluoride mouthrinse",
      "Chlorhexidine gel",
      "Resin-based pit and fissure sealants",
      "Dietary counseling alone",
    ],
    correctIndex: 2,
    category: "caries",
  },
  {
    prompt: "A patient presents with circumferential caries on multiple cervical surfaces and reports recent xerostomia. The most likely contributing factor is:",
    options: [
      "High fluoride intake",
      "Reduced salivary flow",
      "Excellent oral hygiene",
      "High-fiber diet",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which radiographic view is most sensitive for detecting interproximal caries?",
    options: ["Periapical", "Panoramic", "Bitewing", "Occlusal"],
    correctIndex: 2,
    category: "caries",
  },
  {
    prompt: "Caries that progresses rapidly and involves multiple teeth is best termed:",
    options: [
      "Arrested caries",
      "Rampant caries",
      "Recurrent caries",
      "Incipient caries",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which condition describes new caries forming at the margin of an existing restoration?",
    options: [
      "Primary caries",
      "Arrested caries",
      "Secondary (recurrent) caries",
      "Root caries",
    ],
    correctIndex: 2,
    category: "caries",
  },
  {
    prompt: "Early childhood caries (ECC) most often first affects which teeth?",
    options: [
      "Mandibular primary molars",
      "Maxillary primary incisors",
      "Maxillary permanent first molars",
      "Mandibular primary incisors",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which is the most cariogenic property of S. mutans?",
    options: [
      "Pigment production",
      "Acidogenic and aciduric fermentation of sucrose",
      "Spore formation",
      "Gram-negative cell wall",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Silver diamine fluoride (SDF) is primarily used to:",
    options: [
      "Bleach teeth",
      "Arrest active caries without drilling",
      "Anesthetize the pulp",
      "Stimulate remineralization of fluorosis",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which fluoride compound is most commonly used in professional in-office topical applications?",
    options: [
      "Sodium fluoride 0.05%",
      "Acidulated phosphate fluoride 1.23%",
      "Stannous fluoride 0.4%",
      "Sodium monofluorophosphate",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Optimal community water fluoridation level (US standard) is approximately:",
    options: ["0.2 ppm", "0.7 ppm", "1.5 ppm", "3.0 ppm"],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which restorative material has fluoride-release properties useful in high-caries-risk patients?",
    options: ["Amalgam", "Glass ionomer cement", "Gold inlay", "Porcelain"],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Root caries differs from coronal caries primarily because it involves which tissue first?",
    options: ["Enamel", "Cementum and dentin", "Pulp", "Periodontal ligament"],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "The 'zone of bacterial invasion' in a carious lesion is found in which area?",
    options: [
      "Outer infected dentin",
      "Inner affected dentin",
      "Translucent zone",
      "Sound dentin",
    ],
    correctIndex: 0,
    category: "caries",
  },
  {
    prompt: "Stephan curve describes the relationship between:",
    options: [
      "Saliva flow and age",
      "Plaque pH and time after sugar intake",
      "Pulpal blood flow and pain",
      "Periodontal probing depth and bleeding",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which is NOT considered a major caries risk factor?",
    options: [
      "Frequent sugar snacking",
      "Reduced saliva flow",
      "High plaque levels",
      "Regular use of fluoridated toothpaste",
    ],
    correctIndex: 3,
    category: "caries",
  },
  {
    prompt: "Minimal intervention dentistry favors:",
    options: [
      "Aggressive removal of all stained dentin",
      "Preservation of tooth structure with selective caries removal",
      "Immediate root canal therapy for any caries",
      "Routine extraction of carious teeth",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which restorative material chemically bonds to tooth structure via ion exchange?",
    options: [
      "Composite resin",
      "Glass ionomer cement",
      "Amalgam",
      "Compomer (no chemical bond)",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "A 'baby bottle caries' pattern is best prevented by:",
    options: [
      "Adding sweetener to milk",
      "Avoiding bottles containing sugary liquids at bedtime",
      "Brushing teeth only once a week",
      "Switching to fruit juice in the bottle",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Caries is best classified as:",
    options: [
      "An infectious autoimmune disease",
      "A multifactorial, diet-mediated, biofilm-driven disease",
      "A purely genetic disease",
      "A primarily traumatic injury",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Which sign on a bitewing radiograph indicates dentinal caries crossing the DEJ?",
    options: [
      "Triangular enamel-only radiolucency",
      "Radiolucency extending past the dentino-enamel junction",
      "Periapical radiolucency",
      "Furcation radiolucency",
    ],
    correctIndex: 1,
    category: "caries",
  },
  {
    prompt: "Casein phosphopeptide-amorphous calcium phosphate (CPP-ACP) primarily works by:",
    options: [
      "Killing all oral bacteria",
      "Delivering bioavailable calcium and phosphate to remineralize enamel",
      "Bleaching the tooth",
      "Sealing dentinal tubules mechanically only",
    ],
    correctIndex: 1,
    category: "caries",
  },

  // =====================================================================
  // PERIODONTICS (30)
  // =====================================================================
  {
    prompt: "Gingivitis is best described as:",
    options: [
      "Inflammation of the pulp",
      "Reversible inflammation of the gingiva without attachment loss",
      "Loss of alveolar bone",
      "A jaw fracture",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Calculus on teeth is essentially:",
    options: [
      "Hardened (mineralized) dental plaque",
      "Food debris stuck on enamel",
      "A type of extrinsic stain",
      "Tooth enamel chips",
    ],
    correctIndex: 0,
    category: "periodontics",
  },
  {
    prompt: "Which instrument is used to measure periodontal pocket depth?",
    options: [
      "Mouth mirror",
      "Calibrated periodontal probe",
      "Sickle explorer",
      "Spoon excavator",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "A healthy gingival sulcus typically has a probing depth of:",
    options: ["0 mm", "1–3 mm", "5–7 mm", ">8 mm"],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Clinical attachment loss (CAL) is calculated as:",
    options: [
      "Probing depth + mobility",
      "Probing depth + distance from CEJ to gingival margin",
      "Bone loss minus gingival recession",
      "Plaque index + bleeding index",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "In the 2017 classification, Stage III periodontitis is associated with:",
    options: [
      "No interdental CAL",
      "CAL 1–2 mm only",
      "CAL >=5 mm and potential for tooth loss",
      "Healthy bone levels",
    ],
    correctIndex: 2,
    category: "periodontics",
  },
  {
    prompt: "Aggressive forms of periodontitis are now reclassified under the 2017 system as:",
    options: [
      "Necrotizing periodontal disease",
      "Periodontitis (with grading C indicating rapid progression)",
      "Plaque-induced gingivitis",
      "Mucogingival deformity",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Bleeding on probing (BOP) is the clinical sign of:",
    options: [
      "Healthy gingiva",
      "Inflammation of the sulcular epithelium",
      "Enamel hypoplasia",
      "Pulpitis",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which bacterium is part of the 'red complex' associated with severe periodontitis?",
    options: [
      "Streptococcus mutans",
      "Porphyromonas gingivalis",
      "Lactobacillus casei",
      "Candida albicans",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Furcation involvement is graded as Grade II (Glickman) when:",
    options: [
      "No clinical furcation involvement",
      "Pocket extends into the furca but does not pass through to the other side",
      "Through-and-through furcation that is visible clinically",
      "Tooth is fully ankylosed",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Tooth mobility Grade 1 (Miller) is:",
    options: [
      "No mobility",
      "Horizontal mobility <1 mm",
      "Horizontal mobility >1 mm",
      "Vertical mobility and depressibility",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which procedure removes subgingival calculus and necrotic cementum to produce a smooth root surface?",
    options: [
      "Coronal polish",
      "Scaling and root planing",
      "Gingivectomy",
      "Crown lengthening",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Necrotizing ulcerative gingivitis (NUG) is most commonly associated with:",
    options: [
      "Immunocompromise, stress, smoking",
      "Excellent oral hygiene",
      "High dietary fluoride",
      "Asthma medication",
    ],
    correctIndex: 0,
    category: "periodontics",
  },
  {
    prompt: "Which systemic condition has the strongest bidirectional relationship with periodontitis?",
    options: ["Hypothyroidism", "Diabetes mellitus", "Iron-deficiency anemia", "Glaucoma"],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Smoking primarily affects the periodontium by:",
    options: [
      "Increasing gingival bleeding",
      "Impairing host immune response and reducing gingival blood flow",
      "Improving fibroblast function",
      "Reducing calculus formation entirely",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which radiographic finding is most diagnostic of vertical (angular) bone loss?",
    options: [
      "Horizontal crestal bone loss parallel to CEJs",
      "Bone defect with an oblique angle relative to the long axis of the tooth",
      "Generalized osteopenia",
      "Periapical radiolucency",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "The biological width (supracrestal attached tissues) is approximately:",
    options: ["0.5 mm", "2.04 mm", "5 mm", "8 mm"],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which surgical procedure increases the clinical crown by repositioning gingival and osseous tissue apically?",
    options: [
      "Free gingival graft",
      "Crown lengthening",
      "Sinus lift",
      "Apicoectomy",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "A Miller Class I gingival recession defect is characterized by:",
    options: [
      "Recession extending to or beyond the mucogingival junction with bone loss",
      "Recession not extending to the MGJ with no interdental bone loss",
      "Recession with severe interdental bone loss",
      "Full root coverage impossible",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which medication is associated with drug-induced gingival overgrowth?",
    options: ["Aspirin", "Phenytoin", "Paracetamol", "Penicillin"],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Plaque is best described as:",
    options: [
      "A mineralized deposit on enamel",
      "A structured bacterial biofilm on tooth surfaces",
      "A type of food debris",
      "A salivary mucin layer alone",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which periodontal index measures only the presence of plaque on tooth surfaces?",
    options: ["BOP index", "PI (Plaque Index)", "PSR", "Russell PI"],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Gingival recession primarily causes which patient complaint?",
    options: [
      "Loss of consciousness",
      "Cervical dentin hypersensitivity",
      "Tongue paralysis",
      "Halitosis only",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which is the first-line therapy for chronic periodontitis?",
    options: [
      "Systemic antibiotics alone",
      "Non-surgical scaling and root planing with oral hygiene instruction",
      "Tooth extraction",
      "Bone grafting",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Guided tissue regeneration (GTR) uses a barrier membrane to:",
    options: [
      "Prevent saliva contamination",
      "Selectively allow periodontal ligament cells to repopulate the defect",
      "Block all cellular migration",
      "Anesthetize the area",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Which antiseptic mouthrinse is considered the gold standard for short-term chemical plaque control?",
    options: [
      "Sodium fluoride 0.05%",
      "Chlorhexidine gluconate 0.12%",
      "Hydrogen peroxide 3%",
      "Saline rinse",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Long-term use of chlorhexidine is limited primarily by which side effect?",
    options: [
      "Pulpal necrosis",
      "Brown extrinsic tooth staining and altered taste",
      "Severe gingival recession",
      "Bone necrosis",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "A Cairo Class RT1 recession defect indicates:",
    options: [
      "Recession with interproximal attachment loss equal to buccal",
      "Recession with no loss of interproximal attachment",
      "Recession with interproximal attachment loss greater than buccal",
      "Total tooth ankylosis",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Junctional epithelium attaches to the tooth via:",
    options: [
      "Sharpey's fibers",
      "Hemidesmosomes and basal lamina",
      "Type I collagen cement",
      "Cementocytes",
    ],
    correctIndex: 1,
    category: "periodontics",
  },
  {
    prompt: "Periodontal maintenance recall intervals are typically based on:",
    options: [
      "The patient's age only",
      "Risk assessment including BOP, residual pockets, and systemic factors",
      "Cost of treatment",
      "Always 6 months regardless of risk",
    ],
    correctIndex: 1,
    category: "periodontics",
  },

  // =====================================================================
  // ENDODONTICS (30)
  // =====================================================================
  {
    prompt: "What does a root canal treatment primarily aim to treat?",
    options: [
      "Gum recession",
      "Infected or irreversibly inflamed dental pulp",
      "Misaligned teeth",
      "Tartar buildup",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "The dental pulp primarily contains:",
    options: [
      "Only enamel cells",
      "Nerves, blood vessels, and connective tissue",
      "Cementum fibers",
      "Bone marrow",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which material is most commonly used to obturate the root canal space?",
    options: ["Amalgam", "Composite resin", "Gutta-percha", "Glass ionomer"],
    correctIndex: 2,
    category: "endodontics",
  },
  {
    prompt: "Which irrigant is most commonly used to dissolve organic tissue in root canals?",
    options: [
      "0.9% saline",
      "Sodium hypochlorite (NaOCl)",
      "EDTA 17%",
      "Hydrogen peroxide 3%",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "EDTA is used during endodontic therapy primarily to:",
    options: [
      "Bleach the tooth",
      "Chelate inorganic smear layer and dentin debris",
      "Anesthetize the pulp",
      "Sterilize accessory canals",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Reversible pulpitis is typically characterized by:",
    options: [
      "Spontaneous, lingering pain",
      "Short, sharp pain to cold that resolves within seconds of stimulus removal",
      "Pain on biting only",
      "Necrotic pulp",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Irreversible pulpitis typically presents with:",
    options: [
      "Pain only on probing",
      "Spontaneous, lingering pain that may keep the patient awake at night",
      "No response to cold testing",
      "Normal pulp vitality",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which test is most useful to assess pulp vitality?",
    options: [
      "Percussion test",
      "Cold (or electric) pulp testing",
      "Periodontal probing",
      "Bitewing radiograph",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "A positive percussion test usually indicates inflammation of which tissue?",
    options: [
      "Enamel",
      "Periodontal ligament (periradicular tissues)",
      "Pulp chamber only",
      "Gingival sulcus only",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "The standard working length is typically established to:",
    options: [
      "1 mm short of the radiographic apex",
      "Exactly at the radiographic apex",
      "1 mm beyond the apex",
      "Mid-root only",
    ],
    correctIndex: 0,
    category: "endodontics",
  },
  {
    prompt: "Which device uses changes in electrical resistance to locate the apical constriction?",
    options: [
      "Apex locator",
      "Pulp tester",
      "EDTA syringe",
      "Periodontal probe",
    ],
    correctIndex: 0,
    category: "endodontics",
  },
  {
    prompt: "Calcium hydroxide intracanal medicament is used primarily because it is:",
    options: [
      "Acidic and bactericidal",
      "Highly alkaline (pH ~12) and antimicrobial",
      "Strongly hydrophobic",
      "A radiopaque obturating material",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Mineral trioxide aggregate (MTA) is most commonly used for:",
    options: [
      "Routine permanent restorations",
      "Pulp capping, perforation repair, and apexification",
      "Bleaching",
      "Bracket bonding",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "A periapical radiolucency on a non-vital tooth most commonly represents:",
    options: [
      "A bony cyst unrelated to the tooth",
      "Apical periodontitis or periapical abscess",
      "Cementoma",
      "Idiopathic osteosclerosis",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which file system uses continuous rotation with nickel-titanium instruments?",
    options: [
      "K-files (manual stainless steel)",
      "Rotary NiTi systems (e.g., ProTaper)",
      "Hedstrom files (hand)",
      "Barbed broaches",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "The apical constriction is typically located:",
    options: [
      "At the cementoenamel junction",
      "Approximately 0.5–1 mm coronal to the major apical foramen",
      "At the pulp chamber roof",
      "5 mm coronal to the apex",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Pulp necrosis is best diagnosed by which combination of findings?",
    options: [
      "Positive cold + negative percussion",
      "Negative cold and EPT + radiographic periapical changes possible",
      "Positive cold + positive heat",
      "Bleeding on probing only",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which condition is most appropriately managed with apexification or apical barrier therapy?",
    options: [
      "Fully formed adult tooth with vital pulp",
      "Immature permanent tooth with necrotic pulp and open apex",
      "Erupting third molar",
      "Primary tooth pulpitis",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "What is the recommended sequence for canal preparation in modern endodontics?",
    options: [
      "Apical first, then coronal",
      "Coronal flaring followed by apical preparation (crown-down)",
      "Random sequence",
      "Only apical preparation",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which sealer type is most commonly used with gutta-percha obturation?",
    options: [
      "Phosphoric acid",
      "Zinc oxide eugenol or bioceramic sealers",
      "Polycarboxylate cement",
      "Composite bonding agent",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "An access cavity preparation should follow which principle?",
    options: [
      "Maximize tooth removal for easy visibility",
      "Straight-line access to canal orifices while preserving tooth structure",
      "Cavity should always be circular regardless of tooth",
      "Avoid removing the pulp chamber roof",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Vertucci Type IV canal configuration describes:",
    options: [
      "One canal that splits into two and rejoins",
      "Two separate canals that exit through two foramina",
      "A single canal from orifice to apex",
      "Three canals merging into one",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which symptom is most suggestive of acute apical abscess?",
    options: [
      "Mild cold sensitivity",
      "Rapid onset, severe spontaneous pain with swelling and possible systemic signs",
      "No pain at all",
      "Pain only on chewing fibrous food",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Which tooth most commonly has a second mesiobuccal (MB2) canal?",
    options: [
      "Maxillary central incisor",
      "Maxillary first molar",
      "Mandibular canine",
      "Mandibular second premolar",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "A rubber dam in endodontics primarily provides:",
    options: [
      "Aesthetics",
      "Isolation, infection control, and aspiration protection",
      "Anesthesia",
      "Magnification",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Recommended NaOCl concentration for root canal irrigation typically ranges from:",
    options: ["0.05–0.1%", "0.5–6%", "10–20%", "30–50%"],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Sodium hypochlorite accident (extrusion beyond apex) typically presents with:",
    options: [
      "Painless improvement",
      "Sudden severe pain, swelling, bruising, and possible bleeding",
      "Numbness only with no swelling",
      "Tooth discoloration only",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Endodontic post placement is primarily indicated to:",
    options: [
      "Treat caries",
      "Retain a core build-up in a severely compromised tooth",
      "Reduce occlusion",
      "Bleach the canal",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Cracked tooth syndrome typically causes:",
    options: [
      "Spontaneous continuous pain",
      "Sharp pain on biting that resolves on release",
      "No pain at all",
      "Pain only with hot stimuli unrelated to occlusion",
    ],
    correctIndex: 1,
    category: "endodontics",
  },
  {
    prompt: "Endodontic success at recall is best assessed using:",
    options: [
      "Patient satisfaction alone",
      "Clinical examination plus radiographic evidence of periapical healing",
      "Pulp testing on the treated tooth",
      "Periodontal probing only",
    ],
    correctIndex: 1,
    category: "endodontics",
  },

  // =====================================================================
  // ORAL-SURGERY (30)
  // =====================================================================
  {
    prompt: "Which teeth are commonly referred to as 'wisdom teeth'?",
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
    prompt: "Which local anesthetic is most commonly used in dentistry?",
    options: ["Lidocaine", "Penicillin", "Ibuprofen", "Aspirin"],
    correctIndex: 0,
    category: "oral-surgery",
  },
  {
    prompt: "Articaine 4% is typically supplied with which vasoconstrictor concentration?",
    options: [
      "1:1,000 epinephrine",
      "1:100,000 or 1:200,000 epinephrine",
      "No vasoconstrictor",
      "1:10 epinephrine",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "The maximum recommended dose of lidocaine with epinephrine in adults is approximately:",
    options: ["1 mg/kg", "7 mg/kg (up to 500 mg)", "20 mg/kg", "50 mg/kg"],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "An inferior alveolar nerve block anesthetizes which area?",
    options: [
      "Maxillary anterior teeth",
      "Mandibular teeth on the injected side and lower lip/chin",
      "Hard palate only",
      "Tongue tip only",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which nerve must be considered to anesthetize the buccal soft tissues of mandibular molars?",
    options: [
      "Greater palatine nerve",
      "Long buccal nerve",
      "Mental nerve",
      "Lingual nerve",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which elevator is commonly used to luxate a mandibular molar root?",
    options: [
      "Coupland elevator",
      "Periosteal elevator",
      "Periodontal probe",
      "Crown remover",
    ],
    correctIndex: 0,
    category: "oral-surgery",
  },
  {
    prompt: "Alveolar osteitis (dry socket) most commonly occurs after extraction of which tooth?",
    options: [
      "Maxillary primary incisor",
      "Mandibular third molar",
      "Maxillary canine",
      "Mandibular central incisor",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Dry socket typically presents:",
    options: [
      "Immediately after extraction with profuse bleeding",
      "2–4 days post-extraction with severe pain and an empty-looking socket",
      "Weeks later with tooth mobility",
      "Only in primary dentition",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which suture material is absorbable?",
    options: [
      "Silk 3-0",
      "Polypropylene",
      "Polyglactin 910 (Vicryl)",
      "Stainless steel",
    ],
    correctIndex: 2,
    category: "oral-surgery",
  },
  {
    prompt: "Which post-extraction instruction reduces dry socket risk?",
    options: [
      "Vigorous rinsing within the first hour",
      "Avoid smoking and forceful spitting for 24–48 hours",
      "Use a straw frequently",
      "Skip biting on the gauze",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which radiographic feature suggests close proximity of a mandibular third molar to the inferior alveolar canal?",
    options: [
      "Loss of the cortical white line of the canal at the root",
      "Periapical radiopacity",
      "Wide pulp chamber",
      "Open apex",
    ],
    correctIndex: 0,
    category: "oral-surgery",
  },
  {
    prompt: "Which imaging modality is preferred to assess third molar proximity to the IAN canal in 3D?",
    options: [
      "Bitewing radiograph",
      "Panoramic radiograph alone",
      "Cone Beam CT (CBCT)",
      "Periapical only",
    ],
    correctIndex: 2,
    category: "oral-surgery",
  },
  {
    prompt: "Which condition is an absolute contraindication to elective dental extraction?",
    options: [
      "Well-controlled hypertension",
      "Acute myocardial infarction within the past month",
      "Type 2 diabetes with HbA1c 6.5%",
      "Mild seasonal allergy",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Bisphosphonate-associated osteonecrosis of the jaw (MRONJ) risk is highest with:",
    options: [
      "Topical fluoride use",
      "Long-term IV nitrogen-containing bisphosphonates",
      "Oral antibiotics",
      "Single dose paracetamol",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which suture pattern is most commonly used for routine extraction socket closure?",
    options: [
      "Continuous locking",
      "Simple interrupted",
      "Mattress vertical only",
      "Subcuticular",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "A patient with a prosthetic heart valve undergoing extraction typically requires:",
    options: [
      "No special precautions",
      "Antibiotic prophylaxis per current AHA guidelines",
      "Full general anesthesia",
      "Postponement until valve is removed",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which is the recommended first-line antibiotic prophylaxis for endocarditis in non-allergic adults?",
    options: ["Amoxicillin 2 g orally 30–60 minutes before procedure", "Penicillin V 250 mg daily for a week", "Vancomycin IV", "Tetracycline 500 mg"],
    correctIndex: 0,
    category: "oral-surgery",
  },
  {
    prompt: "A Class III impacted mandibular third molar (Pell & Gregory) is defined by:",
    options: [
      "Crown above occlusal plane",
      "Tooth located entirely within the ramus",
      "Tooth fully erupted",
      "Tooth above the mandibular canal",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Lingual nerve injury during third molar surgery most commonly results in:",
    options: [
      "Loss of taste from the posterior third of the tongue",
      "Altered sensation of the anterior two-thirds of the tongue on the affected side",
      "Inability to chew",
      "Permanent paralysis of facial muscles",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which suture removal interval is typical for intraoral non-resorbable sutures?",
    options: ["24 hours", "5–7 days", "3 weeks", "Never remove"],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which sign is most concerning for an odontogenic deep neck space infection?",
    options: [
      "Mild gingival tenderness",
      "Trismus, dysphagia, and elevated tongue with floor of mouth swelling",
      "Cold sensitivity",
      "Bad breath only",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Ludwig's angina primarily involves which spaces?",
    options: [
      "Buccal space only",
      "Bilateral submandibular, sublingual, and submental spaces",
      "Parotid space only",
      "Pterygomandibular space only",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "A patient on warfarin presenting for a single tooth extraction with INR 2.5 should typically:",
    options: [
      "Stop warfarin for 5 days before extraction",
      "Continue warfarin and use local hemostatic measures",
      "Switch to IV heparin only",
      "Receive emergency vitamin K",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which forceps design is most appropriate for extraction of a maxillary molar with intact crown?",
    options: [
      "Lower universal forceps",
      "Cowhorn forceps (mandibular)",
      "Maxillary molar forceps with beaks adapted for buccal trifurcation",
      "Bayonet forceps for roots only",
    ],
    correctIndex: 2,
    category: "oral-surgery",
  },
  {
    prompt: "Postoperative swelling after surgical extraction usually peaks at approximately:",
    options: ["1 hour", "48–72 hours", "1 week", "1 month"],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Which is the most important initial step in managing a patient who faints in the dental chair?",
    options: [
      "Begin chest compressions immediately",
      "Place patient supine, elevate legs, ensure airway, monitor vitals",
      "Administer epinephrine 1:1000 IM",
      "Continue the procedure",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Anaphylaxis in the dental office is treated first with:",
    options: [
      "Oral antihistamine only",
      "Intramuscular epinephrine 1:1000 (adult dose 0.3–0.5 mg)",
      "Topical corticosteroid",
      "IV antibiotics",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "Oroantral communication is most likely after extraction of which tooth?",
    options: [
      "Mandibular incisor",
      "Maxillary first or second molar",
      "Maxillary canine",
      "Mandibular third molar",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
  {
    prompt: "A small (<2 mm) acute oroantral communication is typically managed by:",
    options: [
      "Immediate large flap closure under general anesthesia",
      "Allowing clot formation, suturing the socket, and giving sinus precautions and antibiotics",
      "Sinus lavage with saline",
      "Extraction of the adjacent tooth",
    ],
    correctIndex: 1,
    category: "oral-surgery",
  },
];
