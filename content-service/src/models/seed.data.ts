import { Article, CraftStage, TraditionDoc, Workshop } from "./content.entity.js";

/**
 * Initial Seed Data — Traditions, Folklore Articles, Craft Stages, Workshops
 * Directly aligned with frontend data contracts (src/lib/mock/data.ts)
 */

export const initialTraditions: TraditionDoc[] = [
  {
    slug: "raksha",
    name: "Raksha",
    sinhala: "රක්ෂ",
    marker: "vermilion",
    tagline: "Protective demons, guardians of the threshold",
    description:
      "The Raksha — 'demon' — masks are the apotropaic faces of the southern coast: twenty-four guardians danced to turn aside illness, envy and the evil eye. They are the most sculptural of the traditions, built in tiers of cobra hoods, flame and feather around a single furious face.",
    ritual: [
      "Carried at the head of perahera processions to clear misfortune from the road",
      "Hung above door beams of new houses — the last act of the builder, not the priest",
      "The Maru Raksha, the death face, is danced last and never sold during an illness in the carver's house",
    ],
    examples: ["Naga Raksha — cobra-crowned", "Gini Raksha — the fire demon", "Gurulu Raksha — the sun-bird", "Maru Raksha — the death face"],
    palette: ["#E2561F", "#C9A45C", "#1B1712"],
  },
  {
    slug: "sanni",
    name: "Sanni",
    sinhala: "සන්නි",
    marker: "forest",
    tagline: "The eighteen sicknesses, danced out before dawn",
    description:
      "The Sanni tradition belongs to the tovil — the all-night healing exorcism of the low country. Each of the eighteen demons personifies an illness: fever, fear, madness, the shaking wind. The dance names them, mocks them, and finally laughs them out of the patient.",
    ritual: [
      "Danced from dusk to dawn at the patient's house, to drums that answer every step",
      "Comic interludes are medicine: the household's laughter is part of the cure",
      "The Maha Kola Sanniya carries all eighteen faces on his crown — the whole world's illness in one mask",
    ],
    examples: ["Maha Kola Sanniya — chief of the eighteen", "Deva Sanniya — the intercessor", "Bhuta Sanniya — fear itself", "Vata Sanniya — the shaking wind"],
    palette: ["#1F5B45", "#ABA399", "#1B1712"],
  },
  {
    slug: "kolam",
    name: "Kolam",
    sinhala: "කොලම්",
    marker: "gold",
    tagline: "The nation of masks — folk drama in forty faces",
    description:
      "Kolam is the great comic drama of the south coast: a whole village performed in masks — kings, landlords, soldiers, aunts, fools — arriving at dawn after a night of demons. Where Raksha and Sanni terrify, Kolam laughs, and its satire of colonial types survived the empire it mocked.",
    ritual: [
      "Performed at dawn as the final act of ritual nights, and at New Year gatherings",
      "Opens with Jasaya and Lenchina, the first couple — every village quarrel begins with them",
      "The lightest masks are carved for the quickest tongues: satire needs fast dancers",
    ],
    examples: ["The Mudali — the colonial landlord", "Jasaya & Lenchina — the first couple", "The Soldier (Hewa)", "Pancha — the mocking jester"],
    palette: ["#C9A45C", "#E2561F", "#EDE7DB"],
  },
];

export const initialArticles: Article[] = [
  {
    slug: "eighteen-sanni-demons",
    title: "The Eighteen Sanni Demons: illness named, illness mocked",
    excerpt: "Fever, fear and the shaking wind — how the tovil turns each sickness into a face you can laugh at.",
    tradition: "sanni",
    kind: "essay",
    readMinutes: 9,
    date: "2025-08-12",
    body: [
      "Every culture that has endured sickness has found its own way of giving sickness a shape. On Sri Lanka's southern coast the shape is a mask. The eighteen Sanni demons — Amuku for the stomach, Vata for the shaking wind, Bhuta for fear itself — arrive after midnight to drums that do not so much accompany the dance as argue with it.",
      "What surprises the first-time witness is the comedy. The demons boast, stumble and cheat; the drummer corrects them. The household laughs, and in the laughing the illness is made smaller — a face in a torch circle, no bigger than a forearm, that can be danced out of the yard before dawn.",
      "For collectors, the Sanni masks carry a particular honesty. They were never ornaments. A tovil mask that has been danced smells of coconut-oil smoke; its eyes, hollowed thin by the carver, were built to catch lamplight and frighten not the audience but the disease.",
    ],
  },
  {
    slug: "kolam-nation-of-masks",
    title: "Kolam: the nation of masks",
    excerpt: "Forty faces, one village — the folk drama that out-satirised an empire.",
    tradition: "kolam",
    kind: "essay",
    readMinutes: 7,
    date: "2025-06-30",
    body: [
      "When the demons have finished, Kolam begins. Dawn light, ragged costumes, and a parliament of masked faces: the Mudali landlord with his stern waxed moustache, the soldier with eyes set comically far apart, the jester whose last word is also the play's.",
      "Kolam's genius is structural. The demon dances belong to priests and patients; Kolam belongs to everyone. Any household can be satirised once the masks come out, because the mask, not the dancer, carries the blame. Carvers understood this freedom early — the colonial-era character masks are flattery on the front and mockery in the construction.",
      "The Mudali mask remains the tradition's emblem: dignified at rest, and ridiculous the moment the actor turns. Collectors who hang it report the same joke working on every visitor.",
    ],
  },
  {
    slug: "raksha-guardians",
    title: "Raksha: guardians on the threshold",
    excerpt: "Why the southern coast still trusts a furious face above the door.",
    tradition: "raksha",
    kind: "essay",
    readMinutes: 6,
    date: "2025-05-18",
    body: [
      "Ask an Ambalangoda builder what finishes a house and he will not answer 'paint'. The last act of construction is the Raksha mask above the door beam — the guardian hung after the skilled work is done, facing outward, furious on behalf of the quiet rooms behind it.",
      "The Raksha masks are engineering as much as iconography. Twenty-one cobra hoods carved from a single plank will crack if the grain turns; masters therefore read each log for days before the first cut, and price the risk into the mask.",
      "A genuine Naga Raksha above a doorway is heavier than it looks — wooden authority, roughly a day's wages a century old.",
    ],
  },
  {
    slug: "kaduru-the-wood-that-must-be-asked",
    title: "Kaduru: the wood that must be asked",
    excerpt: "Soft as lime, stronger than it dares — and a felling custom older than the masks it becomes.",
    kind: "field-notes",
    readMinutes: 5,
    date: "2025-09-02",
    image: "/images/craft/carving.jpg",
    body: [
      "Strychnos nux-vomica — kaduru — is an unlikely hero. Pale, soft, and lightly poisonous in the seed, it carves like firm cheese and holds detail like ivory. Every tradition here agrees: there is no second wood.",
      "The old carvers cut kaduru at a waning moon, after asking the tree's leave — a formula of words the masters still mutter, half-serious, before the saw starts. The timber then rests. Sirisena Apuhamy will not touch a plank for ninety days. 'Green wood lies,' he says. 'It has not finished moving.'",
      "Storm-fallen kaduru now fetches premium prices, and the registry records every tree — its plot, its date, its feller — as the first line of each mask's provenance.",
    ],
  },
  {
    slug: "natural-pigments",
    title: "Hingula, kanaviru, soot: the chemistry of a mask's face",
    excerpt: "Nine washes of ash-grey, three passes of ember red — pigment as provenance.",
    kind: "field-notes",
    readMinutes: 6,
    date: "2025-04-21",
    image: "/images/artisans/dissanayake.jpg",
    body: [
      "The paint on a true Ambalangoda mask is a small geology. Hingula vermilion from cinnabar, kanaviru green ground in coconut oil, lamp soot for black, a primer of alliyadi resin that smells faintly of honey — each coat mixed on a granite slab that has outlived three painters.",
      "Kumari Dissanayake signs the back of every mask she finishes. Her grandmother, whose recipes she still follows, signed nothing; the names of the pigment bench were women's names, and the ledger forgot them. The registry remembers both.",
    ],
  },
  {
    slug: "the-tovil-night",
    title: "The Tovil Night: anatomy of an exorcism",
    excerpt: "Torch light, argument, laughter — a filmed account of the healing drama at full length.",
    tradition: "sanni",
    kind: "film",
    readMinutes: 24,
    date: "2025-03-08",
    image: "/images/heritage/ritual.jpg",
    body: [
      "Filmed over one full night in Wathugedara with the family's consent, this long-form piece follows the tovil from the lighting of the torches to the quiet final hour, when the demons have been mocked off the premises and the drummers finally eat.",
      "The camera stays at the back of the yard. What matters is not spectacle but sequence — the naming, the dancing, the laughing, the release.",
    ],
  },
  {
    slug: "gini-raksha-karandeniya",
    title: "From Karandeniya with fire: the Gini Raksha",
    excerpt: "How a demon of flame became the processional crowd-pleaser of the south.",
    tradition: "raksha",
    kind: "essay",
    readMinutes: 5,
    date: "2024-12-14",
    body: [
      "Of all the Raksha faces, the fire demon is the one dancers fight over. At the head of a night procession, torchlight runs up the carved flames of his headdress and the crowd draws breath as one.",
      "Chandana Bandara has painted Gini Raksha for twenty years and claims he got them wrong for the first seven. His fix was culinary: he began watching cooking fires collapse in the hearth, and painted flames that fall rather than rise.",
    ],
  },
  {
    slug: "reading-a-mask",
    title: "Reading a mask: iconography for collectors",
    excerpt: "Cobra counts, crown tiers and tool-marks — how to tell a master's cut from a souvenir.",
    kind: "essay",
    readMinutes: 8,
    date: "2025-01-25",
    body: [
      "Count the cobras. On a genuine Naga Raksha each hood is carved from the same plank as the face; on a factory piece they are glued dowels. Run a fingernail along the hood-tip — a master's cut is crisp under paint, a lathe's is not.",
      "Look for the ninety-day rest. Fast masks warp at the jaw within a year. And read the back: a signed, dated back with a registered NFC tag is now the southern coast's most forgery-resistant surface.",
    ],
  },
  {
    slug: "ambalangoda-town-that-carves",
    title: "Ambalangoda: the town that carves",
    excerpt: "Register offices, moonstone quarries and four streets of workshops that smell of kaduru dust.",
    kind: "essay",
    readMinutes: 6,
    date: "2024-11-02",
    body: [
      "The railway bisects Ambalangoda; the workshops mostly keep to the east of it, as they have since the 1880s. Visitors who come for the mask museum should stay for the streets behind it — Wathugedara, Urawatte, Kiripedda — where carving is still a household economy and the best masks are rarely for sale at all.",
      "Mask & Maker's registry began on these streets, in a tea shop where three masters agreed that the middlemen's prices were an insult with a long history.",
    ],
  },
  {
    slug: "women-of-the-pigment-bench",
    title: "Women of the pigment bench",
    excerpt: "The painters were always there. The ledger finally says their names.",
    kind: "essay",
    readMinutes: 7,
    date: "2025-02-16",
    image: "/images/artisans/dissanayake.jpg",
    body: [
      "Southern mask-making split its labour a century ago: men carved, women mixed and painted, and the receipts remembered only the carving. The pigment bench — grinding hin­gula, mulling kanaviru in coconut oil, burnishing beeswax — was women's work and unsigned work.",
      "The registry records painter alongside carver on every provenance certificate. It is a small mechanical change with an honest consequence: the next generation of names will be complete.",
    ],
  },
];

export const initialCraftStages: CraftStage[] = [
  {
    n: 1,
    title: "Choosing the tree",
    sinhala: "ගස තෝරාගැනීම",
    body: "Kaduru is storm-fallen or bought from home gardens, never clear-cut. The log's age and lean decide what it can become.",
    detail: "Registry records the plot and felling date — the first line of provenance.",
  },
  {
    n: 2,
    title: "Resting the timber",
    sinhala: "දැව නිවා දැමීම",
    body: "Ninety days in the dark. Green wood lies — it has not finished moving — and a fast mask warps at the jaw within the year.",
    detail: "Sirisena Apuhamy will not touch a plank before its season is up.",
  },
  {
    n: 3,
    title: "Rough blocking",
    sinhala: "මූලික කැපීම",
    body: "The keteraya adze takes the log down to the face's silhouette — brow, cheeks, hood-line — with the grain read and respected first.",
    detail: "Serpent crowns are planned so every cobra shares the plank's grain.",
  },
  {
    n: 4,
    title: "Carving the face",
    sinhala: "මුහුණ කැටයම් කිරීම",
    body: "Eleven gouges, from sweep to vein. Eyes are hollowed thin so lamplight wakes them; stress points are over-built where restoration experience says masks fail.",
    detail: "A master leaves tool-marks honest enough to read.",
  },
  {
    n: 5,
    title: "Drying by smoke",
    sinhala: "දුම් අඳුරුව",
    body: "The carved face hangs above the cooking hearth for a week. Smoke hardens the surface and seasons the wood black at the edges.",
    detail: "Collectors can smell the hearth on an old danced mask.",
  },
  {
    n: 6,
    title: "Priming in resin",
    sinhala: "ඇලියඩි ආලේපනය",
    body: "Alliyadi resin, warm and faintly honey-scented, seals every pore. This is the ground that makes pigment behave on living wood.",
    detail: "The recipe is measured in coconut shells, not grams.",
  },
  {
    n: 7,
    title: "Painting the face",
    sinhala: "මුහුණ වර්ණ ගැන්වීම",
    body: "Hingula vermilion in three ember passes, kanaviru green mulled in coconut oil, lamp soot black, bone white. The eyes are painted last.",
    detail: "The painter signs the back — since 2019, for the first time ever, in their own name.",
  },
  {
    n: 8,
    title: "Waking the mask",
    sinhala: "නෙත් පිළිවෙළ",
    body: "A final beeswax burnish, a night beside the workshop lamp, and the mask is considered awake — ready to dance, guard, or cross the ocean carefully.",
    detail: "The NFC tag is set into the back and the certificate minted the same morning.",
  },
];

export const initialWorkshops: Workshop[] = [
  {
    title: "Two days at the carving bench",
    date: "2026-01-17",
    place: "Apuhamy workshop · Wathugedara, Ambalangoda",
    priceLKR: 28500,
    spotsLeft: 4,
  },
  {
    title: "Natural pigments: grind, mull, burnish",
    date: "2026-02-07",
    place: "Dissanayake pigment house · Balapitiya",
    priceLKR: 19000,
    spotsLeft: 6,
  },
  {
    title: "Tovil night, with commentary",
    date: "2026-03-14",
    place: "Village grounds · Karandeniya",
    priceLKR: 12000,
    spotsLeft: 11,
  },
];
