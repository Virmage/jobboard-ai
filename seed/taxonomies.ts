export interface TaxonomySeed {
  slug: string;
  canonicalTitle: string;
  relatedTitles: string[];
  titlePatterns: string[];
  /** Slug of the parent industry — resolved to UUID at seed time. */
  industrySlug: string;
}

export const taxonomiesSeed: TaxonomySeed[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINEERING / TECH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "software-engineer",
    canonicalTitle: "Software Engineer",
    relatedTitles: [
      "Software Engineer", "Software Developer", "SWE",
      "Junior Software Engineer", "Mid-level Software Engineer",
      "Application Developer", "Web Developer",
    ],
    titlePatterns: [
      "software\\s*(engineer|developer)",
      "\\bswe\\b",
      "application\\s*developer",
      "web\\s*developer",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "senior-software-engineer",
    canonicalTitle: "Senior Software Engineer",
    relatedTitles: [
      "Senior Software Engineer", "Senior Developer", "Senior SWE",
      "Sr. Software Engineer", "Senior Software Developer",
      "Software Engineer III", "SDE III", "Senior Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?)\\s+(?:software\\s+)?(?:engineer|developer)",
      "(?:software\\s+)?engineer\\s+iii",
      "\\bsde\\s*iii\\b",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "staff-engineer",
    canonicalTitle: "Staff Engineer",
    relatedTitles: [
      "Staff Engineer", "Staff Software Engineer", "Staff Developer",
      "Senior Staff Engineer",
    ],
    titlePatterns: [
      "(?:senior\\s+)?staff\\s+(?:software\\s+)?engineer",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "principal-engineer",
    canonicalTitle: "Principal Engineer",
    relatedTitles: [
      "Principal Engineer", "Principal Software Engineer",
      "Distinguished Engineer", "Fellow Engineer",
    ],
    titlePatterns: [
      "(?:principal|distinguished|fellow)\\s+(?:software\\s+)?engineer",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "frontend-engineer",
    canonicalTitle: "Frontend Engineer",
    relatedTitles: [
      "Frontend Engineer", "Frontend Developer", "Front-End Engineer",
      "Front-End Developer", "React Developer", "Vue Developer",
      "Angular Developer", "UI Engineer", "UI Developer",
      "Senior Frontend Engineer", "Staff Frontend Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*(?:frontend|front[- ]end)\\s*(?:software\\s+)?(?:engineer|developer)",
      "(?:react|vue|angular|svelte)\\s*(?:developer|engineer)",
      "\\bui\\s*(?:engineer|developer)",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "backend-engineer",
    canonicalTitle: "Backend Engineer",
    relatedTitles: [
      "Backend Engineer", "Backend Developer", "Back-End Engineer",
      "Back-End Developer", "Server Engineer", "API Engineer",
      "Senior Backend Engineer", "Staff Backend Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*(?:backend|back[- ]end)\\s*(?:software\\s+)?(?:engineer|developer)",
      "\\bapi\\s*engineer",
      "server\\s*(?:engineer|developer)",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "fullstack-engineer",
    canonicalTitle: "Fullstack Engineer",
    relatedTitles: [
      "Fullstack Engineer", "Fullstack Developer", "Full-Stack Engineer",
      "Full-Stack Developer", "Senior Fullstack Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*(?:fullstack|full[- ]stack)\\s*(?:software\\s+)?(?:engineer|developer)",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "mobile-engineer",
    canonicalTitle: "Mobile Engineer",
    relatedTitles: [
      "Mobile Engineer", "Mobile Developer", "iOS Engineer",
      "iOS Developer", "Android Engineer", "Android Developer",
      "React Native Developer", "Flutter Developer",
      "Senior Mobile Engineer", "Staff Mobile Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*mobile\\s*(?:engineer|developer)",
      "(?:senior|sr\\.?|staff|lead)?\\s*(?:ios|android|react\\s*native|flutter)\\s*(?:engineer|developer)",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "devops-engineer",
    canonicalTitle: "DevOps Engineer",
    relatedTitles: [
      "DevOps Engineer", "Senior DevOps Engineer", "DevOps Lead",
      "Site Reliability Engineer", "SRE", "Senior SRE",
      "Infrastructure Engineer", "Cloud Engineer", "Cloud Architect",
      "Platform Engineer", "Senior Platform Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*devops\\s*(?:engineer|lead|manager)",
      "(?:senior|sr\\.?|staff|lead)?\\s*(?:site\\s*reliability|sre)\\s*(?:engineer|lead)?",
      "\\bsre\\b",
      "(?:senior|sr\\.?|staff|lead)?\\s*(?:infrastructure|cloud|platform)\\s*(?:engineer|architect|lead)",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "qa-engineer",
    canonicalTitle: "QA Engineer",
    relatedTitles: [
      "QA Engineer", "Quality Assurance Engineer", "Test Engineer",
      "Automation Engineer", "SDET", "Senior QA Engineer",
      "QA Lead", "QA Manager", "Test Automation Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead)?\\s*(?:qa|quality\\s*assurance|test(?:ing)?)\\s*(?:engineer|lead|manager|analyst)",
      "(?:senior|sr\\.?)?\\s*(?:test\\s*)?automation\\s*engineer",
      "\\bsdet\\b",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "security-engineer",
    canonicalTitle: "Security Engineer",
    relatedTitles: [
      "Security Engineer", "Senior Security Engineer", "Application Security Engineer",
      "Security Architect", "Cybersecurity Engineer", "InfoSec Engineer",
      "Penetration Tester", "Security Lead",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*(?:security|cybersecurity|infosec|application\\s*security)\\s*(?:engineer|architect|analyst|lead)",
      "penetration\\s*tester",
      "\\bciso\\b",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "engineering-manager",
    canonicalTitle: "Engineering Manager",
    relatedTitles: [
      "Engineering Manager", "Senior Engineering Manager",
      "Director of Engineering", "VP Engineering",
      "Head of Engineering", "Engineering Director",
      "Head of Software Engineering", "VP Technology",
      "Principal Engineering Manager",
    ],
    titlePatterns: [
      "(?:senior|principal|staff)?\\s*engineering\\s*manager",
      "(?:head|vp|vice\\s*president|director|sr\\.?\\s*director|senior\\s+director)\\s*(?:of\\s+)?(?:engineering|software\\s*engineering|technology|platform\\s*engineering)",
      "engineering\\s+(?:director|head|lead)",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "cto",
    canonicalTitle: "CTO",
    relatedTitles: [
      "CTO", "Chief Technology Officer", "Co-Founder & CTO",
      "VP Engineering & CTO",
    ],
    titlePatterns: [
      "\\bcto\\b",
      "chief\\s*technology\\s*officer",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "solutions-architect",
    canonicalTitle: "Solutions Architect",
    relatedTitles: [
      "Solutions Architect", "Senior Solutions Architect",
      "Enterprise Architect", "Technical Architect",
      "Systems Architect", "Cloud Solutions Architect",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|principal)?\\s*(?:solutions?|enterprise|technical|systems?|cloud\\s*solutions?)\\s*architect",
    ],
    industrySlug: "technology-engineering",
  },
  {
    slug: "technical-lead",
    canonicalTitle: "Technical Lead",
    relatedTitles: [
      "Technical Lead", "Tech Lead", "Lead Engineer",
      "Technical Director", "Technical Program Manager",
    ],
    titlePatterns: [
      "(?:technical|tech)\\s*lead",
      "lead\\s*engineer",
      "technical\\s*(?:director|program\\s*manager)",
    ],
    industrySlug: "technology-engineering",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "product-manager",
    canonicalTitle: "Product Manager",
    relatedTitles: [
      "Product Manager", "PM", "Technical Product Manager",
      "Product Manager, Growth", "Product Manager, Platform",
    ],
    titlePatterns: [
      "(?:technical\\s+)?product\\s*manager",
      "\\bpm\\b(?=.*product)",
    ],
    industrySlug: "product",
  },
  {
    slug: "senior-product-manager",
    canonicalTitle: "Senior Product Manager",
    relatedTitles: [
      "Senior Product Manager", "Sr. Product Manager",
      "Senior PM", "Lead Product Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)\\s+(?:technical\\s+)?product\\s*manager",
    ],
    industrySlug: "product",
  },
  {
    slug: "group-product-manager",
    canonicalTitle: "Group Product Manager",
    relatedTitles: [
      "Group Product Manager", "GPM", "Principal Product Manager",
      "Staff Product Manager",
    ],
    titlePatterns: [
      "(?:group|principal|staff)\\s+product\\s*manager",
      "\\bgpm\\b",
    ],
    industrySlug: "product",
  },
  {
    slug: "associate-product-manager",
    canonicalTitle: "Associate Product Manager",
    relatedTitles: [
      "Associate Product Manager", "APM", "Junior Product Manager",
      "Product Analyst",
    ],
    titlePatterns: [
      "(?:associate|junior|jr\\.?)\\s+product\\s*manager",
      "\\bapm\\b",
      "product\\s*analyst",
    ],
    industrySlug: "product",
  },
  {
    slug: "head-of-product",
    canonicalTitle: "Head of Product",
    relatedTitles: [
      "Head of Product", "VP Product", "Director of Product",
      "Chief Product Officer", "CPO", "Product Director",
      "Senior Director of Product", "VP Product Management",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director|senior\\s+director)\\s*(?:of\\s+)?(?:product|product\\s*management|product\\s*strategy)",
      "\\bcpo\\b",
      "product\\s+(?:director|head|officer)",
    ],
    industrySlug: "product",
  },
  {
    slug: "product-owner",
    canonicalTitle: "Product Owner",
    relatedTitles: [
      "Product Owner", "Senior Product Owner", "PO",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*product\\s*owner",
    ],
    industrySlug: "product",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DESIGN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "product-designer",
    canonicalTitle: "Product Designer",
    relatedTitles: [
      "Product Designer", "Senior Product Designer", "Staff Product Designer",
      "Lead Product Designer", "Principal Product Designer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*product\\s*designer",
    ],
    industrySlug: "design",
  },
  {
    slug: "ux-designer",
    canonicalTitle: "UX Designer",
    relatedTitles: [
      "UX Designer", "Senior UX Designer", "User Experience Designer",
      "UX/UI Designer", "Senior UX/UI Designer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*(?:ux|user\\s*experience|ux\\/?ui)\\s*designer",
    ],
    industrySlug: "design",
  },
  {
    slug: "ui-designer",
    canonicalTitle: "UI Designer",
    relatedTitles: [
      "UI Designer", "Senior UI Designer", "User Interface Designer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|junior|jr\\.?)?\\s*(?:ui|user\\s*interface)\\s*designer",
    ],
    industrySlug: "design",
  },
  {
    slug: "visual-designer",
    canonicalTitle: "Visual Designer",
    relatedTitles: [
      "Visual Designer", "Senior Visual Designer", "Graphic Designer",
      "Senior Graphic Designer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|junior|jr\\.?)?\\s*(?:visual|graphic)\\s*designer",
    ],
    industrySlug: "design",
  },
  {
    slug: "interaction-designer",
    canonicalTitle: "Interaction Designer",
    relatedTitles: [
      "Interaction Designer", "Senior Interaction Designer",
      "Motion Designer", "Senior Motion Designer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:interaction|motion)\\s*designer",
    ],
    industrySlug: "design",
  },
  {
    slug: "ux-researcher",
    canonicalTitle: "UX Researcher",
    relatedTitles: [
      "UX Researcher", "Senior UX Researcher", "User Researcher",
      "Design Researcher", "Lead UX Researcher",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*(?:ux|user|design)\\s*researcher",
    ],
    industrySlug: "design",
  },
  {
    slug: "design-director",
    canonicalTitle: "Design Director",
    relatedTitles: [
      "Head of Design", "VP Design", "Design Director",
      "UX Director", "Director of Product Design",
      "Chief Design Officer", "Head of UX",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director)\\s*(?:of\\s+)?(?:design|ux|user\\s*experience|product\\s*design|brand\\s*design|ux\\/?ui)",
      "design\\s+(?:director|head|lead|officer)",
      "ux\\s+(?:director|head|lead)",
    ],
    industrySlug: "design",
  },
  {
    slug: "design-systems",
    canonicalTitle: "Design Systems Lead",
    relatedTitles: [
      "Design Systems Lead", "Design Systems Engineer",
      "Design Systems Manager", "Design Ops Manager",
    ],
    titlePatterns: [
      "design\\s*(?:systems|ops)\\s*(?:lead|manager|engineer|designer)",
    ],
    industrySlug: "design",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA & AI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "data-scientist",
    canonicalTitle: "Data Scientist",
    relatedTitles: [
      "Data Scientist", "Senior Data Scientist", "Staff Data Scientist",
      "Lead Data Scientist", "Principal Data Scientist",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal|junior|jr\\.?)?\\s*data\\s*scientist",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "data-analyst",
    canonicalTitle: "Data Analyst",
    relatedTitles: [
      "Data Analyst", "Senior Data Analyst", "Lead Data Analyst",
      "Business Analyst", "Analytics Analyst",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|junior|jr\\.?)?\\s*data\\s*analyst",
      "(?:senior|sr\\.?|lead)?\\s*business\\s*analyst",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "data-engineer",
    canonicalTitle: "Data Engineer",
    relatedTitles: [
      "Data Engineer", "Senior Data Engineer", "Staff Data Engineer",
      "Lead Data Engineer", "Analytics Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*(?:data|analytics)\\s*engineer",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "ml-engineer",
    canonicalTitle: "ML Engineer",
    relatedTitles: [
      "ML Engineer", "Machine Learning Engineer", "Senior ML Engineer",
      "Staff ML Engineer", "MLOps Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*(?:ml|machine\\s*learning)\\s*(?:engineer|lead)",
      "(?:senior|sr\\.?)?\\s*mlops\\s*engineer",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "ai-engineer",
    canonicalTitle: "AI Engineer",
    relatedTitles: [
      "AI Engineer", "Senior AI Engineer", "AI/ML Engineer",
      "Artificial Intelligence Engineer", "NLP Engineer",
      "Computer Vision Engineer", "LLM Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*(?:ai|artificial\\s*intelligence|nlp|computer\\s*vision|llm)\\s*(?:engineer|scientist|researcher)",
      "(?:senior|sr\\.?|staff)?\\s*ai\\/?ml\\s*engineer",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "research-scientist",
    canonicalTitle: "Research Scientist",
    relatedTitles: [
      "Research Scientist", "Senior Research Scientist",
      "Staff Research Scientist", "ML Research Scientist",
      "AI Research Scientist",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*(?:ml\\s*|ai\\s*)?research\\s*scientist",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "analytics-manager",
    canonicalTitle: "Analytics Manager",
    relatedTitles: [
      "Analytics Manager", "Head of Analytics", "Director of Analytics",
      "VP Analytics", "BI Manager", "BI Analyst",
      "Business Intelligence Analyst", "Senior BI Analyst",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*analytics\\s*(?:manager|director|lead|engineer)",
      "(?:head|vp|vice\\s*president|director)\\s*(?:of\\s+)?analytics",
      "(?:senior|sr\\.?|lead)?\\s*(?:bi|business\\s*intelligence)\\s*(?:analyst|engineer|developer|manager)",
    ],
    industrySlug: "data-ai",
  },
  {
    slug: "head-of-data",
    canonicalTitle: "Head of Data",
    relatedTitles: [
      "Head of Data Science", "VP Data", "Chief Data Officer",
      "Director of Data Science", "Head of Data Engineering",
      "Head of Analytics", "Head of Machine Learning",
      "Chief Analytics Officer",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director)\\s*(?:of\\s+)?(?:data\\s*(?:science|engineering)?|analytics|machine\\s*learning|ai)",
      "chief\\s*(?:data|analytics|ai)\\s*officer",
      "\\bcdo\\b(?=.*data)",
    ],
    industrySlug: "data-ai",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETING & GROWTH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "marketing-manager",
    canonicalTitle: "Marketing Manager",
    relatedTitles: [
      "Marketing Manager", "Senior Marketing Manager",
      "Digital Marketing Manager", "Marketing Lead",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:digital\\s+)?marketing\\s*manager",
      "marketing\\s*lead",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "head-of-marketing",
    canonicalTitle: "Head of Marketing",
    relatedTitles: [
      "Chief Marketing Officer", "CMO", "VP Marketing",
      "Marketing Director", "Head of Marketing",
      "Director of Marketing", "Senior Director of Marketing",
      "Head of Brand Marketing", "Head of Demand Generation",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director|senior\\s+director)\\s*(?:of\\s+)?(?:marketing|demand\\s*gen)",
      "\\bcmo\\b",
      "marketing\\s+(?:director|head|officer)",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "growth-manager",
    canonicalTitle: "Growth Manager",
    relatedTitles: [
      "Growth Manager", "Head of Growth", "Growth Lead",
      "VP Growth", "Director of Growth Marketing",
      "Growth Marketing Manager", "Growth Hacker",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*growth\\s*(?:manager|lead|hacker)",
      "(?:head|vp|vice\\s*president|director)\\s*(?:of\\s+)?growth",
      "growth\\s+marketing\\s*(?:manager|director|lead)",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "seo-manager",
    canonicalTitle: "SEO Manager",
    relatedTitles: [
      "SEO Manager", "Head of SEO", "SEO Lead",
      "SEO Specialist", "Senior SEO Manager",
      "SEO Director",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|head)?\\s*seo\\s*(?:manager|lead|specialist|director|strategist)",
      "(?:head|director)\\s*(?:of\\s+)?seo",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "performance-marketing",
    canonicalTitle: "Performance Marketing Manager",
    relatedTitles: [
      "Performance Marketing Manager", "Paid Media Manager",
      "Paid Acquisition Manager", "SEM Manager",
      "Performance Marketing Lead", "Growth Marketing Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:performance|paid\\s*(?:media|acquisition)|sem)\\s*(?:marketing\\s*)?(?:manager|lead|director|specialist)",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "demand-generation",
    canonicalTitle: "Demand Generation Manager",
    relatedTitles: [
      "Demand Generation Manager", "Demand Gen Lead",
      "Head of Demand Generation", "Director of Demand Gen",
      "Senior Demand Gen Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|head|director)?\\s*(?:of\\s+)?demand\\s*gen(?:eration)?\\s*(?:manager|lead|director|specialist)?",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "product-marketing-manager",
    canonicalTitle: "Product Marketing Manager",
    relatedTitles: [
      "Product Marketing Manager", "PMM", "Senior PMM",
      "Head of Product Marketing", "Director of Product Marketing",
      "Lead Product Marketing Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|head|director)?\\s*(?:of\\s+)?product\\s*marketing\\s*(?:manager|lead|director)?",
      "\\bpmm\\b",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "content-marketing",
    canonicalTitle: "Content Marketing Manager",
    relatedTitles: [
      "Content Marketing Manager", "Content Marketer",
      "Head of Content Marketing", "Content Strategy Manager",
      "Senior Content Marketing Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|head|director)?\\s*(?:of\\s+)?content\\s*(?:marketing|strategy)\\s*(?:manager|lead|director|specialist)?",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "email-marketing",
    canonicalTitle: "Email Marketing Manager",
    relatedTitles: [
      "Email Marketing Manager", "CRM Manager",
      "Lifecycle Marketing Manager", "Email Marketing Specialist",
      "Retention Marketing Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:email|crm|lifecycle|retention)\\s*marketing\\s*(?:manager|lead|specialist|director)",
    ],
    industrySlug: "marketing-growth",
  },
  {
    slug: "communications-manager",
    canonicalTitle: "Communications Manager",
    relatedTitles: [
      "Communications Manager", "Head of Communications",
      "PR Manager", "Public Relations Manager",
      "Director of Communications", "Comms Director",
      "VP Communications",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|head|vp|director)?\\s*(?:of\\s+)?(?:communications?|comms|pr|public\\s*relations)\\s*(?:manager|director|lead|specialist)?",
    ],
    industrySlug: "marketing-growth",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SALES & BUSINESS DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "account-executive",
    canonicalTitle: "Account Executive",
    relatedTitles: [
      "Account Executive", "Senior Account Executive",
      "Enterprise Account Executive", "Mid-Market Account Executive",
      "Strategic Account Executive", "AE",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|enterprise|mid[- ]?market|strategic)\\s*account\\s*executive",
      "account\\s*executive",
      "\\bae\\b(?=.*(?:sales|account|enterprise))",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "sdr",
    canonicalTitle: "Sales Development Representative",
    relatedTitles: [
      "SDR", "Sales Development Representative",
      "Senior SDR", "SDR Lead", "Outbound SDR",
    ],
    titlePatterns: [
      "\\bsdr\\b",
      "sales\\s*development\\s*rep(?:resentative)?",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "bdr",
    canonicalTitle: "Business Development Representative",
    relatedTitles: [
      "BDR", "Business Development Representative",
      "Senior BDR", "BDR Lead",
    ],
    titlePatterns: [
      "\\bbdr\\b",
      "business\\s*development\\s*rep(?:resentative)?",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "sales-manager",
    canonicalTitle: "Sales Manager",
    relatedTitles: [
      "Sales Manager", "Senior Sales Manager",
      "Regional Sales Manager", "Inside Sales Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|regional|inside)?\\s*sales\\s*manager",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "head-of-sales",
    canonicalTitle: "Head of Sales",
    relatedTitles: [
      "VP Sales", "Sales Director", "Chief Revenue Officer",
      "CRO", "Head of Sales", "Director of Sales",
      "VP Revenue", "Head of Enterprise Sales",
      "Head of Go-to-Market",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director|senior\\s+director|regional)\\s*(?:of\\s+)?(?:sales|revenue|enterprise\\s*sales|go[- ]?to[- ]?market)",
      "\\bcro\\b",
      "sales\\s+(?:director|head|lead|officer)",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "account-manager",
    canonicalTitle: "Account Manager",
    relatedTitles: [
      "Account Manager", "Senior Account Manager",
      "Key Account Manager", "Strategic Account Manager",
      "Enterprise Account Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|key|strategic|enterprise)\\s*account\\s*manager",
      "account\\s*manager",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "customer-success-manager",
    canonicalTitle: "Customer Success Manager",
    relatedTitles: [
      "Customer Success Manager", "Senior CSM",
      "Head of Customer Success", "Director of Customer Success",
      "VP Customer Success", "CSM",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|head|vp|director)?\\s*(?:of\\s+)?customer\\s*success\\s*(?:manager|lead|director)?",
      "\\bcsm\\b",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "business-development",
    canonicalTitle: "Business Development Manager",
    relatedTitles: [
      "Business Development Manager", "BD Manager",
      "Head of Business Development", "Director of Partnerships",
      "Head of Partnerships", "Partnerships Lead",
      "VP Business Development", "Strategic Partnerships Manager",
    ],
    titlePatterns: [
      "(?:head|vp|vice\\s*president|director|sr\\.?\\s*director|senior\\s+director|lead|senior\\s+manager)\\s*(?:of\\s+)?(?:partnerships|business\\s*development|strategic\\s*(?:partnerships|alliances)|bd)",
      "(?:bd|partnerships)\\s+(?:director|lead|head|manager)",
      "business\\s*development\\s*(?:manager|director|lead)",
    ],
    industrySlug: "sales-business-development",
  },
  {
    slug: "solutions-consultant",
    canonicalTitle: "Solutions Consultant",
    relatedTitles: [
      "Solutions Consultant", "Solutions Engineer",
      "Pre-Sales Engineer", "Sales Engineer",
      "Senior Solutions Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:solutions?|pre[- ]?sales|sales)\\s*(?:consultant|engineer|specialist)",
    ],
    industrySlug: "sales-business-development",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "operations-manager",
    canonicalTitle: "Operations Manager",
    relatedTitles: [
      "Operations Manager", "Senior Operations Manager",
      "Business Operations Manager", "Operations Lead",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:business\\s+)?operations?\\s*manager",
      "operations?\\s*lead",
    ],
    industrySlug: "operations",
  },
  {
    slug: "head-of-operations",
    canonicalTitle: "Head of Operations",
    relatedTitles: [
      "COO", "Chief Operating Officer", "VP Operations",
      "Head of Operations", "Operations Director",
      "Director of Operations", "Head of Business Operations",
      "Director of Strategy & Operations",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director)\\s*(?:of\\s+)?(?:operations|business\\s*operations|strategy\\s*&\\s*operations)",
      "\\bcoo\\b",
      "operations\\s+(?:director|head|officer)",
    ],
    industrySlug: "operations",
  },
  {
    slug: "chief-of-staff",
    canonicalTitle: "Chief of Staff",
    relatedTitles: [
      "Chief of Staff", "CoS",
    ],
    titlePatterns: [
      "chief\\s*of\\s*staff",
    ],
    industrySlug: "operations",
  },
  {
    slug: "program-manager",
    canonicalTitle: "Program Manager",
    relatedTitles: [
      "Program Manager", "Senior Program Manager",
      "Technical Program Manager", "TPM",
      "Engineering Program Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|technical|engineering)\\s*program\\s*manager",
      "program\\s*manager",
      "\\btpm\\b",
    ],
    industrySlug: "operations",
  },
  {
    slug: "project-manager",
    canonicalTitle: "Project Manager",
    relatedTitles: [
      "Project Manager", "Senior Project Manager",
      "Technical Project Manager", "IT Project Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|technical|it)\\s*project\\s*manager",
      "project\\s*manager",
    ],
    industrySlug: "operations",
  },
  {
    slug: "revops",
    canonicalTitle: "Revenue Operations Manager",
    relatedTitles: [
      "RevOps Manager", "Revenue Operations Manager",
      "Head of RevOps", "Sales Operations Manager",
      "Marketing Operations Manager", "Revenue Operations Lead",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|head|lead|director)?\\s*(?:of\\s+)?(?:rev|revenue|sales|marketing)\\s*(?:ops|operations)\\s*(?:manager|lead|director|analyst)?",
    ],
    industrySlug: "operations",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "cfo",
    canonicalTitle: "CFO",
    relatedTitles: [
      "CFO", "Chief Financial Officer", "VP Finance",
      "Head of Finance", "Finance Director",
    ],
    titlePatterns: [
      "\\bcfo\\b",
      "chief\\s*financial\\s*officer",
      "(?:head|vp|vice\\s*president|director)\\s*(?:of\\s+)?finance",
      "finance\\s*(?:director|head|officer)",
    ],
    industrySlug: "finance",
  },
  {
    slug: "financial-analyst",
    canonicalTitle: "Financial Analyst",
    relatedTitles: [
      "Financial Analyst", "Senior Financial Analyst",
      "Lead Financial Analyst", "Finance Analyst",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*financial?\\s*analyst",
    ],
    industrySlug: "finance",
  },
  {
    slug: "controller",
    canonicalTitle: "Controller",
    relatedTitles: [
      "Controller", "Corporate Controller", "Assistant Controller",
      "VP Controller",
    ],
    titlePatterns: [
      "(?:corporate|assistant|vp)?\\s*controller",
    ],
    industrySlug: "finance",
  },
  {
    slug: "fpa",
    canonicalTitle: "FP&A Manager",
    relatedTitles: [
      "FP&A Manager", "FP&A Analyst", "Financial Planning & Analysis",
      "Senior FP&A Analyst", "Director of FP&A",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|director)?\\s*(?:of\\s+)?fp&?a\\s*(?:manager|analyst|director|lead)?",
      "financial\\s*planning\\s*(?:&|and)\\s*analysis",
    ],
    industrySlug: "finance",
  },
  {
    slug: "accounting-manager",
    canonicalTitle: "Accounting Manager",
    relatedTitles: [
      "Accounting Manager", "Senior Accountant", "Staff Accountant",
      "Director of Accounting", "Head of Accounting",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead)?\\s*accountant",
      "(?:head|director)?\\s*(?:of\\s+)?accounting\\s*(?:manager|director|lead)?",
    ],
    industrySlug: "finance",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PEOPLE & HR
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "head-of-people",
    canonicalTitle: "Head of People",
    relatedTitles: [
      "VP People", "Head of HR", "Chief People Officer",
      "Head of People", "VP Human Resources",
      "Director of People Operations", "Head of People & Culture",
      "Chief Human Resources Officer",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|sr\\.?\\s*director)\\s*(?:of\\s+)?(?:people|hr|human\\s*resources|people\\s*(?:&|and)?\\s*culture|people\\s*operations)",
      "\\bchro\\b",
      "people\\s+(?:director|head|lead|officer)",
    ],
    industrySlug: "people-hr",
  },
  {
    slug: "hr-manager",
    canonicalTitle: "HR Manager",
    relatedTitles: [
      "HR Manager", "Senior HR Manager", "HR Business Partner",
      "HRBP", "Senior HRBP", "HR Generalist",
      "Human Resources Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:hr|human\\s*resources)\\s*(?:manager|business\\s*partner|generalist)",
      "\\bhrbp\\b",
    ],
    industrySlug: "people-hr",
  },
  {
    slug: "talent-acquisition",
    canonicalTitle: "Talent Acquisition Manager",
    relatedTitles: [
      "Talent Acquisition Manager", "Head of Talent Acquisition",
      "TA Manager", "TA Lead", "Recruiting Manager",
      "Head of Recruiting", "Director of Talent Acquisition",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|head|lead|director)?\\s*(?:of\\s+)?talent\\s*acquisition\\s*(?:manager|lead|director|specialist)?",
      "(?:head|director|lead)?\\s*(?:of\\s+)?recruiting\\s*(?:manager)?",
    ],
    industrySlug: "people-hr",
  },
  {
    slug: "recruiter",
    canonicalTitle: "Recruiter",
    relatedTitles: [
      "Recruiter", "Senior Recruiter", "Technical Recruiter",
      "Executive Recruiter", "Lead Recruiter", "Sourcer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|technical|executive|engineering)?\\s*recruiter",
      "(?:senior|sr\\.?|lead)?\\s*sourcer",
    ],
    industrySlug: "people-hr",
  },
  {
    slug: "people-operations",
    canonicalTitle: "People Operations Manager",
    relatedTitles: [
      "People Operations Manager", "People Ops Manager",
      "People Operations Lead", "People Ops Lead",
      "HR Operations Manager",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:people|hr)\\s*(?:ops|operations)\\s*(?:manager|lead|coordinator)",
    ],
    industrySlug: "people-hr",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGAL & COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "general-counsel",
    canonicalTitle: "General Counsel",
    relatedTitles: [
      "General Counsel", "VP Legal", "Head of Legal",
      "Chief Legal Officer", "CLO",
      "Associate General Counsel", "Deputy General Counsel",
    ],
    titlePatterns: [
      "(?:associate|deputy|senior)?\\s*general\\s*counsel",
      "(?:chief|head|vp|vice\\s*president|director)\\s*(?:of\\s+)?legal",
      "\\bclo\\b",
      "chief\\s*legal\\s*officer",
    ],
    industrySlug: "legal-compliance",
  },
  {
    slug: "legal-counsel",
    canonicalTitle: "Legal Counsel",
    relatedTitles: [
      "Legal Counsel", "Senior Legal Counsel", "Corporate Counsel",
      "In-House Counsel", "Legal Advisor",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?)?\\s*(?:legal|corporate|in[- ]?house)\\s*counsel",
      "legal\\s*(?:advisor|director|head|lead|manager)",
    ],
    industrySlug: "legal-compliance",
  },
  {
    slug: "compliance-officer",
    canonicalTitle: "Compliance Officer",
    relatedTitles: [
      "Compliance Officer", "Compliance Manager",
      "Head of Compliance", "Director of Compliance",
      "Chief Compliance Officer", "Regulatory Compliance Manager",
    ],
    titlePatterns: [
      "(?:chief|head|senior|sr\\.?|director)?\\s*(?:of\\s+)?(?:regulatory\\s*)?compliance\\s*(?:officer|manager|director|lead|analyst)?",
    ],
    industrySlug: "legal-compliance",
  },
  {
    slug: "privacy-officer",
    canonicalTitle: "Privacy Officer",
    relatedTitles: [
      "Privacy Officer", "Data Privacy Officer", "DPO",
      "Privacy Manager", "Head of Privacy",
    ],
    titlePatterns: [
      "(?:chief|head|senior)?\\s*(?:data\\s*)?privacy\\s*(?:officer|manager|counsel|lead)",
      "\\bdpo\\b",
    ],
    industrySlug: "legal-compliance",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY & DEVREL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "community-manager",
    canonicalTitle: "Community Manager",
    relatedTitles: [
      "Community Manager", "Senior Community Manager",
      "Community Lead", "Community Coordinator",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*community\\s*(?:manager|lead|coordinator)",
    ],
    industrySlug: "community-devrel",
  },
  {
    slug: "head-of-community",
    canonicalTitle: "Head of Community",
    relatedTitles: [
      "Head of Community", "Community Director",
      "Director of Community", "VP Community",
      "Head of Community & Engagement",
    ],
    titlePatterns: [
      "(?:head|director|vp|vice\\s*president)\\s*(?:of\\s+)?community\\s*(?:&\\s*engagement|operations|strategy)?",
      "community\\s+(?:director|head)",
    ],
    industrySlug: "community-devrel",
  },
  {
    slug: "developer-advocate",
    canonicalTitle: "Developer Advocate",
    relatedTitles: [
      "Developer Advocate", "Senior Developer Advocate",
      "Staff Developer Advocate", "Developer Evangelist",
      "Developer Relations Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|principal)?\\s*developer\\s*(?:advocate|evangelist|relations\\s*engineer)",
    ],
    industrySlug: "community-devrel",
  },
  {
    slug: "head-of-devrel",
    canonicalTitle: "Head of Developer Relations",
    relatedTitles: [
      "Head of Developer Relations", "Head of DevRel",
      "Director of Developer Experience", "VP Developer Relations",
      "Developer Relations Lead", "Developer Relations Manager",
    ],
    titlePatterns: [
      "(?:head|director|vp|vice\\s*president|lead|manager)\\s*(?:of\\s+)?(?:developer\\s*relations|devrel|developer\\s*experience|developer\\s*advocacy)",
      "devrel\\s+(?:director|lead|head|manager)",
    ],
    industrySlug: "community-devrel",
  },
  {
    slug: "technical-writer",
    canonicalTitle: "Technical Writer",
    relatedTitles: [
      "Technical Writer", "Senior Technical Writer",
      "Documentation Engineer", "API Technical Writer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*technical\\s*writer",
      "documentation\\s*engineer",
    ],
    industrySlug: "community-devrel",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATIVE & BRAND
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "creative-director",
    canonicalTitle: "Creative Director",
    relatedTitles: [
      "Creative Director", "Head of Brand", "VP Creative",
      "Brand Director", "Executive Creative Director",
      "Group Creative Director", "Associate Creative Director",
      "Chief Creative Officer", "Senior Creative Director",
      "Creative Lead", "Brand & Creative Director",
    ],
    titlePatterns: [
      "(?:chief|head|vp|vice\\s*president|director|lead|sr\\.?|senior|executive|group|associate)\\s*(?:of\\s+)?(?:creative|brand\\s*(?:&|and)?\\s*creative)",
      "creative\\s+(?:director|lead|head|officer)",
      "(?:ecd|cco)\\b",
      "brand\\s+director",
    ],
    industrySlug: "creative-brand",
  },
  {
    slug: "content-lead",
    canonicalTitle: "Head of Content",
    relatedTitles: [
      "Head of Content", "Content Director", "Editor-in-Chief",
      "VP Content", "Director of Content Strategy",
      "Content Strategy Lead", "Head of Editorial",
      "Editorial Director", "Managing Editor",
    ],
    titlePatterns: [
      "(?:head|director|vp|vice\\s*president|lead|senior\\s+manager)\\s*(?:of\\s+)?(?:content|editorial)",
      "content\\s+(?:director|lead|head|strategist)",
      "editor[- ]?in[- ]?chief",
      "editorial\\s+director",
      "managing\\s+editor",
    ],
    industrySlug: "creative-brand",
  },
  {
    slug: "head-of-social",
    canonicalTitle: "Head of Social Media",
    relatedTitles: [
      "Social Media Director", "Head of Social",
      "Director of Social Media", "VP Social Media",
      "Social Media Lead", "Head of Social Strategy",
      "Senior Social Media Manager",
    ],
    titlePatterns: [
      "(?:head|director|vp|vice\\s*president|lead|senior\\s+manager)\\s*(?:of\\s+)?social\\s*(?:media|strategy|content)?",
      "social\\s+media\\s+(?:director|head|lead)",
      "social\\s+strategy\\s+director",
    ],
    industrySlug: "creative-brand",
  },
  {
    slug: "copywriter",
    canonicalTitle: "Copywriter",
    relatedTitles: [
      "Copywriter", "Senior Copywriter", "Lead Copywriter",
      "Creative Copywriter", "Brand Copywriter",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead|junior|jr\\.?|creative|brand)?\\s*copywriter",
    ],
    industrySlug: "creative-brand",
  },
  {
    slug: "art-director",
    canonicalTitle: "Art Director",
    relatedTitles: [
      "Art Director", "Senior Art Director",
      "Associate Art Director", "Group Art Director",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|associate|group)?\\s*art\\s*director",
    ],
    industrySlug: "creative-brand",
  },
  {
    slug: "social-media-manager",
    canonicalTitle: "Social Media Manager",
    relatedTitles: [
      "Social Media Manager", "Social Media Specialist",
      "Social Media Coordinator", "Social Media Strategist",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*social\\s*media\\s*(?:manager|specialist|coordinator|strategist)",
    ],
    industrySlug: "creative-brand",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE / C-SUITE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "ceo",
    canonicalTitle: "CEO",
    relatedTitles: [
      "CEO", "Chief Executive Officer", "Co-Founder & CEO",
      "Managing Director", "General Manager",
    ],
    titlePatterns: [
      "\\bceo\\b",
      "chief\\s*executive\\s*officer",
      "managing\\s*director",
      "general\\s*manager",
    ],
    industrySlug: "executive",
  },
  {
    slug: "coo-exec",
    canonicalTitle: "COO",
    relatedTitles: [
      "COO", "Chief Operating Officer",
    ],
    titlePatterns: [
      "\\bcoo\\b",
      "chief\\s*operating\\s*officer",
    ],
    industrySlug: "executive",
  },
  {
    slug: "ciso",
    canonicalTitle: "CISO",
    relatedTitles: [
      "CISO", "Chief Information Security Officer",
      "VP Information Security", "Head of Information Security",
    ],
    titlePatterns: [
      "\\bciso\\b",
      "chief\\s*information\\s*security\\s*officer",
      "(?:head|vp|director)\\s*(?:of\\s+)?information\\s*security",
    ],
    industrySlug: "executive",
  },
  {
    slug: "cio",
    canonicalTitle: "CIO",
    relatedTitles: [
      "CIO", "Chief Information Officer",
      "VP IT", "Head of IT",
    ],
    titlePatterns: [
      "\\bcio\\b",
      "chief\\s*information\\s*officer",
      "(?:head|vp|director)\\s*(?:of\\s+)?(?:it|information\\s*technology)",
    ],
    industrySlug: "executive",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRYPTO & WEB3
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "blockchain-engineer",
    canonicalTitle: "Blockchain Engineer",
    relatedTitles: [
      "Blockchain Engineer", "Blockchain Developer",
      "Senior Blockchain Engineer", "Staff Blockchain Engineer",
      "Blockchain Architect",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead|principal)?\\s*blockchain\\s*(?:engineer|developer|architect)",
    ],
    industrySlug: "crypto-web3",
  },
  {
    slug: "smart-contract-engineer",
    canonicalTitle: "Smart Contract Engineer",
    relatedTitles: [
      "Smart Contract Engineer", "Smart Contract Developer",
      "Solidity Engineer", "Solidity Developer",
      "Smart Contract Auditor",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead)?\\s*(?:smart\\s*contract|solidity)\\s*(?:engineer|developer|auditor)",
    ],
    industrySlug: "crypto-web3",
  },
  {
    slug: "protocol-engineer",
    canonicalTitle: "Protocol Engineer",
    relatedTitles: [
      "Protocol Engineer", "Protocol Developer",
      "Core Protocol Engineer", "Consensus Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|core|lead)?\\s*(?:protocol|consensus)\\s*(?:engineer|developer)",
    ],
    industrySlug: "crypto-web3",
  },
  {
    slug: "defi-engineer",
    canonicalTitle: "DeFi Engineer",
    relatedTitles: [
      "DeFi Engineer", "DeFi Developer", "DeFi Strategist",
      "DeFi Analyst", "DeFi Lead",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*defi\\s*(?:engineer|developer|strategist|analyst|lead)",
    ],
    industrySlug: "crypto-web3",
  },
  {
    slug: "web3-engineer",
    canonicalTitle: "Web3 Engineer",
    relatedTitles: [
      "Web3 Engineer", "Web3 Developer", "Web3 Lead",
      "dApp Developer", "Decentralized Application Developer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|staff|lead)?\\s*web3\\s*(?:engineer|developer|lead)",
      "(?:senior|sr\\.?)?\\s*dapp\\s*(?:developer|engineer)",
    ],
    industrySlug: "crypto-web3",
  },
  {
    slug: "tokenomics",
    canonicalTitle: "Tokenomics Analyst",
    relatedTitles: [
      "Tokenomics Analyst", "Tokenomics Lead",
      "Tokenomics Designer", "Token Economist",
      "Crypto Researcher", "Crypto Analyst",
    ],
    titlePatterns: [
      "tokenomics\\s*(?:analyst|lead|designer)",
      "token\\s*economist",
      "(?:senior|sr\\.?|lead)?\\s*crypto\\s*(?:analyst|researcher|strategist|trader)",
    ],
    industrySlug: "crypto-web3",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVERTISING & AGENCY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "media-planner",
    canonicalTitle: "Media Planner",
    relatedTitles: [
      "Media Planner", "Senior Media Planner",
      "Media Buyer", "Senior Media Buyer",
      "Media Director", "Media Strategist",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*media\\s*(?:planner|buyer|director|manager|strategist)",
      "(?:head|director)\\s*(?:of\\s+)?media",
    ],
    industrySlug: "advertising-agency",
  },
  {
    slug: "account-director-agency",
    canonicalTitle: "Account Director",
    relatedTitles: [
      "Account Director", "Account Supervisor",
      "Account Planner", "Senior Account Director",
      "Group Account Director",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|group)?\\s*account\\s*(?:director|supervisor|planner)",
    ],
    industrySlug: "advertising-agency",
  },
  {
    slug: "strategy-director",
    canonicalTitle: "Strategy Director",
    relatedTitles: [
      "Strategy Director", "Head of Strategy",
      "Chief Strategy Officer", "Strategy Lead",
      "Brand Strategist", "Creative Strategist",
    ],
    titlePatterns: [
      "(?:head|director|chief|lead)\\s*(?:of\\s+)?(?:brand\\s*)?strategy",
      "(?:brand|creative|digital)\\s*strategist",
      "chief\\s*strategy\\s*officer",
    ],
    industrySlug: "advertising-agency",
  },
  {
    slug: "campaign-manager",
    canonicalTitle: "Campaign Manager",
    relatedTitles: [
      "Campaign Manager", "Senior Campaign Manager",
      "Campaign Director", "Campaign Strategist",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*campaign\\s*(?:manager|director|lead|strategist)",
    ],
    industrySlug: "advertising-agency",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMER SUPPORT & SUCCESS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "support-engineer",
    canonicalTitle: "Support Engineer",
    relatedTitles: [
      "Support Engineer", "Technical Support Engineer",
      "Senior Support Engineer", "Customer Support Engineer",
      "Solutions Support Engineer",
    ],
    titlePatterns: [
      "(?:senior|sr\\.?|lead)?\\s*(?:technical\\s+|customer\\s+)?support\\s*engineer",
    ],
    industrySlug: "customer-support",
  },
  {
    slug: "customer-support-manager",
    canonicalTitle: "Customer Support Manager",
    relatedTitles: [
      "Customer Support Manager", "Head of Support",
      "Customer Service Manager", "Support Manager",
      "Director of Customer Support", "VP Customer Support",
    ],
    titlePatterns: [
      "(?:head|vp|director|senior)?\\s*(?:of\\s+)?(?:customer\\s+)?(?:support|service)\\s*(?:manager|director|lead|head)?",
    ],
    industrySlug: "customer-support",
  },
  {
    slug: "customer-experience",
    canonicalTitle: "Customer Experience Manager",
    relatedTitles: [
      "Customer Experience Manager", "CX Manager",
      "Head of Customer Experience", "Director of CX",
    ],
    titlePatterns: [
      "(?:head|vp|director|senior)?\\s*(?:of\\s+)?(?:customer\\s*experience|cx)\\s*(?:manager|director|lead)?",
    ],
    industrySlug: "customer-support",
  },
];
