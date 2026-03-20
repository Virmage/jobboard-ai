export interface IndustrySeed {
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
}

export const industriesSeed: IndustrySeed[] = [
  {
    slug: "technology-engineering",
    name: "Technology & Engineering",
    description:
      "Software development, platform engineering, DevOps, SRE, QA, and all technical engineering roles.",
    displayOrder: 1,
  },
  {
    slug: "product",
    name: "Product",
    description:
      "Product management, product strategy, product operations, and product ownership roles.",
    displayOrder: 2,
  },
  {
    slug: "design",
    name: "Design",
    description:
      "UX/UI design, product design, interaction design, visual design, UX research, and design systems.",
    displayOrder: 3,
  },
  {
    slug: "data-ai",
    name: "Data & AI",
    description:
      "Data science, data engineering, machine learning, AI research, analytics, and business intelligence.",
    displayOrder: 4,
  },
  {
    slug: "marketing-growth",
    name: "Marketing & Growth",
    description:
      "Growth marketing, performance marketing, SEO, demand generation, content marketing, product marketing, and digital marketing.",
    displayOrder: 5,
  },
  {
    slug: "sales-business-development",
    name: "Sales & Business Development",
    description:
      "Account executives, SDRs, BDRs, enterprise sales, account management, customer success, and revenue leadership.",
    displayOrder: 6,
  },
  {
    slug: "operations",
    name: "Operations",
    description:
      "Business operations, program management, project management, RevOps, supply chain, and strategy & operations.",
    displayOrder: 7,
  },
  {
    slug: "finance",
    name: "Finance",
    description:
      "Financial planning & analysis, accounting, treasury, tax, controllership, and financial leadership.",
    displayOrder: 8,
  },
  {
    slug: "people-hr",
    name: "People & HR",
    description:
      "People operations, talent acquisition, recruiting, HR business partnering, L&D, and compensation & benefits.",
    displayOrder: 9,
  },
  {
    slug: "legal-compliance",
    name: "Legal & Compliance",
    description:
      "General counsel, corporate law, regulatory compliance, privacy, contract management, and legal operations.",
    displayOrder: 10,
  },
  {
    slug: "community-devrel",
    name: "Community & DevRel",
    description:
      "Community management, developer relations, developer advocacy, developer experience, and technical evangelism.",
    displayOrder: 11,
  },
  {
    slug: "creative-brand",
    name: "Creative & Brand",
    description:
      "Creative direction, brand strategy, art direction, copywriting, editorial, and content creation.",
    displayOrder: 12,
  },
  {
    slug: "executive",
    name: "Executive / C-Suite",
    description:
      "CEO, COO, CFO, CTO, CMO, CPO, and other C-level and VP-level executive leadership.",
    displayOrder: 13,
  },
  {
    slug: "crypto-web3",
    name: "Crypto & Web3",
    description:
      "Blockchain protocols, DeFi, NFT platforms, DAOs, smart contracts, and decentralized infrastructure.",
    displayOrder: 14,
  },
  {
    slug: "advertising-agency",
    name: "Advertising & Agency",
    description:
      "Creative agencies, media planning/buying, account management, strategy, and ad-tech platforms.",
    displayOrder: 15,
  },
  {
    slug: "customer-support",
    name: "Customer Support & Success",
    description:
      "Customer support, technical support, customer success, customer experience, and service leadership.",
    displayOrder: 16,
  },
];
