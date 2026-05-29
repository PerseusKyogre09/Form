<script lang="ts">
  import { page } from "$app/stores";
  import {
    Shield,
    Scale,
    Search,
    ArrowLeft,
    Mail,
    FileText,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    Globe,
    Lock,
    Check,
    Calendar,
    Users,
    Trash2,
    Database,
    Clock,
    FileSpreadsheet,
    Code,
    Server,
    ShieldCheck,
    Compass,
  } from "lucide-svelte";
  import favicon from "$lib/assets/favicon.svg";

  let activeTab = $state("terms"); // 'terms' or 'privacy'
  let searchQuery = $state("");

  // Update active tab based on query params reactively
  $effect(() => {
    const tabParam = $page.url.searchParams.get("tab");
    if (tabParam === "privacy") {
      activeTab = "privacy";
    } else if (tabParam === "terms") {
      activeTab = "terms";
    }
  });

  function selectTab(tab: string) {
    activeTab = tab;
    // Update URL query parameters without full page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }

  // Highly Detailed Terms of Service Sections
  const termsSections = [
    {
      id: "tos-acceptance",
      title: "1. Acceptance of Terms & Legal Binding",
      tldr: "By using our hosted services, you enter a legally binding contract. If you disagree, do not use Quill.",
      content: [
        "Welcome to Quill (collectively, 'Quill', 'we', 'us', or 'our'). These Terms of Service ('Terms') govern your access to and use of our hosted web application, form builder, responder portals, APIs, and associated cloud services (the 'Service'). By registering for an account, building forms, filling out surveys, or browsing our website, you ('User', 'Creator', or 'Respondent') represent that you have read, understood, and explicitly agree to be bound by these Terms.",
        "This is a legally binding agreement between you and Quill. If you are entering into these Terms on behalf of an enterprise, corporation, educational institution, or other legal entity, you represent and warrant that you possess the full legal authority to bind such entity. If you do not have such authority, or if you do not agree with any clause of these Terms, you must immediately terminate all sessions and cease using the Service.",
      ],
    },
    {
      id: "tos-open-source",
      title: "2. Service Description, Licensing & Open Source Boundary",
      tldr: "Our code is open source under the MIT License, but these hosted Terms apply strictly to our cloud platform.",
      content: [
        "Quill provides a high-performance, keyboard-first, conversational form builder designed to allow users to build, share, and track responses for registrations, check-ins, templates, voting events, and certificates.",
        "Open Source Boundary: The underlying codebase for Quill is open-source software licensed under the MIT License (available in our official GitHub repository). You are free to inspect, download, modify, and self-host the source code on your own infrastructure under the permissive terms of the MIT License. However, you must carefully distinguish between the open-source software and our hosted cloud platform (the 'Hosted Service' or 'SaaS Platform' at quill.geekroom-srmist.co.in):",
        "• The MIT License governs the software code itself, providing it free of charge, completely 'AS IS', and without any warranty or liability.",
        "• These Terms of Service govern the Hosted SaaS Platform operated by us. Using our hosted cloud services grants you access to our hosted serverless databases, global Cloudflare CDNs, security scanning, certificate generation, mail APIs, and dynamic active analytics. We reserve the right to establish usage limits, security audits, and rate configurations on the Hosted SaaS Platform to prevent abuse and maintain premium stability.",
      ],
    },
    {
      id: "tos-eligibility",
      title: "3. Global Age Restrictions & Eligibility",
      tldr: "You must meet the legal age of consent in your country to register an account. We strictly respect global children's safety.",
      content: [
        "You must meet the minimum age of legal consent to personal data processing in your country of residence to register a Quill account:",
        "• United States: You must be at least 13 years old. In compliance with the Children's Online Privacy Protection Act (COPPA), Quill does not knowingly collect data from children under 13 without verifiable parental consent.",
        "• European Union / EEA / United Kingdom: You must be at least 16 years old. Under Article 8 of the GDPR, individual member states may lower this age to a minimum of 13, in which case the member state's specific laws apply.",
        "• India: You must be at least 18 years old. Under the Digital Personal Data Protection (DPDP) Act of 2023, processing personal data of children (defined as individuals under 18 years of age) requires prior, verifiable consent from a parent or lawful guardian.",
        "• Rest of the World: You must be of the legal age required to consent to the collection and processing of personal data under the domestic laws of your respective country.",
        "If we discover that an account has been registered by an ineligible minor in violation of these thresholds, we will take immediate steps to terminate the account and permanently delete all associated database records.",
      ],
    },
    {
      id: "tos-accounts",
      title: "4. Account Security, Sessions & Data Custody",
      tldr: "You own and control your account data. Keep your secure session tokens and OAuth logins safe.",
      content: [
        "Quill utilizes state-of-the-art authentication mechanisms powered by Better Auth. By creating an account, you must provide a valid email address and maintain accurate profile parameters.",
        "You are entirely responsible for all activities that occur under your account, including active user sessions, generated forms, and collected responses. You must immediately notify our security team of any unauthorized access, suspicious session tokens, or credentials breaches.",
        "Your account profiles (usernames, display names, location, website URLs, social handles, and visual theme preferences) are managed entirely by you. You have direct control to update, modify, or permanently erase your account data at any time from your settings panel.",
      ],
    },
    {
      id: "tos-conduct",
      title: "5. Acceptable Use Policy & Content Restrictions",
      tldr: "Phishing, collecting passwords, distributing malware, spamming, and harassment are strictly banned.",
      content: [
        "To protect our global network of respondents and creators, all users of the Hosted Service must strictly comply with our Acceptable Use Policy. You are explicitly prohibited from building forms, collecting entries, or publishing content that:",
        "1. Solicits clear-text credentials, passwords, PINs, or security codes (phishing).",
        "2. Collects high-risk financial data, bank accounts, or credit card numbers without PCI-DSS compliant payment gateways.",
        "3. Harasses, defames, threatens, or targets individuals with hate speech, violence, or explicit abuse.",
        "4. Facilitates spam, unsolicited email campaigns, or fraudulent marketing operations.",
        "5. Distributes malware, spyware, trojans, or attempts to disrupt the SaaS infrastructure via SQL injections, cross-site scripting (XSS), or DDoS attacks.",
        "Violation of this section is grounds for immediate, permanent termination of your account and all associated forms, and we may report illegal actions to international law enforcement agencies.",
      ],
    },
    {
      id: "tos-intellectual-property",
      title: "6. Intellectual Property & Content Rights",
      tldr: "Your forms and response data belong entirely to you. Our system branding, icons, and software belong to us.",
      content: [
        "Ownership of Creator Content: You retain full copyright, intellectual property rights, and ownership over the forms you design, the questions you write, and the response entries collected from respondents. By using the SaaS Platform, you grant Quill a limited, non-exclusive, sublicensable, and royalty-free worldwide license to host, transmit, display, and format your content strictly to the extent necessary to deliver the Service.",
        "Quill Intellectual Property: All custom styling systems, UI designs, brand marks, logos (including the Quill feather logo), custom icons, CSS layout assets, database schemas, and proprietary cloud configurations are the exclusive property of Quill and its operators. Any unauthorized copying, distribution, scraping, or commercial exploitation of hosted branding is strictly prohibited.",
      ],
    },
    {
      id: "tos-sla",
      title: "7. Platform Availability & Performance Controls",
      tldr: "We aim for maximum platform uptime, and utilize automatic rate limiting and anti-spam measures.",
      content: [
        "System Resiliency: Quill is deployed using global, auto-scaling serverless infrastructures. While we strive to maintain a 99.9% uptime record, we do not warrant that the Service will be entirely uninterrupted, error-free, or secure from unforeseen edge outages.",
        "Platform Controls: To guarantee high performance for all creators, we implement automatic rate limits (including IP hashing via 'ip_rate_log' and unique submission tracking constraints). We reserve the right to temporarily restrict resource allocations, throttle certificate generations, or shut down inactive forms that generate excessive traffic or endanger server stability.",
      ],
    },
    {
      id: "tos-liability",
      title: "8. Complete Warranty Disclaimers & Shielding",
      tldr: "Our cloud platform is provided 'as-is'. We are not responsible for any direct or indirect loss, data incidents, or downtime.",
      content: [
        "THE HOSTED SAAS PLATFORM AND ASSOCIATED SERVICES ARE PROVIDED ENTIRELY ON AN 'AS IS' AND 'AS AVAILABLE' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.",
        "IN NO EVENT SHALL QUILL, ITS CONTRIBUTORS, OPERATORS, OR DEVELOPERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. THIS INCLUDES, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM: (A) YOUR ACCESS TO OR INABILITY TO ACCESS THE SERVICE; (B) ANY USER-GENERATED FORM CONTENT OR RESPONDENT DATA; (C) ANY SECURITY BREACHES OR SECURITY INCIDENTS; OR (D) SELF-HOSTED SOFTWARE DISRUPTIONS GOVERNED BY THE MIT LICENSE.",
      ],
    },
    {
      id: "tos-termination",
      title: "9. Account Erasure & Cascading Database Deletion",
      tldr: "When you choose to delete a form or account, it is permanently and irreversibly purged from our database.",
      content: [
        "We support your right to delete your data at any time. When a Form Creator requests account termination or deletes a specific form:",
        "• A cascading database execution is initiated immediately across all relational tables.",
        "• The form metadata, linked questions, respondent answers, checked_in logs, and spam tracking indices are permanently purged from the active PostgreSQL database instance.",
        "• This action is immediate, irreversible, and permanently removes all stored data. Encrypted system backup snapshots are cycled out within a standard 30-day retention window.",
      ],
    },
    {
      id: "tos-governing-law",
      title: "10. Global Jurisdictions, Arbitration & Class Action Waiver",
      tldr: "Disputes are resolved through binding arbitration. You waive rights to class-action lawsuits.",
      content: [
        "These Terms shall be governed by and construed in accordance with the laws of the country of Quill's principal operational entity, without regard to conflict of law principles. Any dispute, claim, or controversy arising out of or relating to these Terms shall be resolved exclusively through final and binding individual arbitration.",
        "You explicitly agree to waive any right to participate in class-action lawsuits, class-wide arbitrations, or representative litigation. For consumers residing in jurisdictions with mandatory statutory protections (such as EU/EEA consumer laws, California CCPA dispute clauses, or India DPDP Act grievance redressal structures), those local statutory rights shall remain fully unaffected.",
      ],
    },
  ];

  // Highly Detailed Privacy Policy Sections
  const privacySections = [
    {
      id: "priv-scope",
      title: "1. Scope & Comprehensive Global Compliance",
      tldr: "We comply with major global privacy laws: EU GDPR, UK GDPR, Swiss FADP, CCPA/CPRA, Canada PIPEDA, Brazil LGPD, India DPDP, and APAC/African statutes.",
      content: [
        "Quill operates under a strict 'Privacy-by-Design' framework. We have structured this Privacy Policy to provide exhaustive details on data processing operations in absolute compliance with the primary data protection laws of every continent:",
        "1. Europe: The General Data Protection Regulation (EU GDPR 2016/679), the UK Data Protection Act 2018 (UK GDPR), and the Swiss Federal Act on Data Protection (FADP).",
        "2. North America: The California Consumer Privacy Act (CCPA) as amended by the CPRA, other US state statutes (VCDPA Virginia, CPA Colorado, CTDPA Connecticut, UCPA Utah, TDPSA Texas, OCPA Oregon), and Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).",
        "3. South America: Brazil's Lei Geral de Proteção de Dados (LGPD - Law No. 13.709/2018).",
        "4. Asia-Pacific: India's Digital Personal Data Protection (DPDP) Act 2023, Singapore's Personal Data Protection Act 2012 (PDPA), Australia's Privacy Act 1988 (including the APPs), Japan's Act on the Protection of Personal Information (APPI), South Korea's Personal Information Protection Act (PIPA), and New Zealand's Privacy Act 2020.",
        "5. Africa: South Africa's Protection of Personal Information Act (POPIA), Nigeria's Data Protection Regulation (NDPR), and Kenya's Data Protection Act 2019.",
      ],
    },
    {
      id: "priv-roles",
      title: "2. Data Processing Designation (Controller vs. Processor)",
      tldr: "We act as the Data Controller for your account details, and strictly as the Data Processor for your respondents' form submissions.",
      content: [
        "Under global regulations, our legal relationship with creators and respondents is clearly defined:",
        "• Quill as Data Controller: We act as the Controller (or 'Data Fiduciary' under DPDP) for the personal data of our direct users/creators (account holders, profile layouts, transaction logs, session metrics, active auth tokens, and preferences). We determine the purposes and means of this processing.",
        "• Quill as Data Processor: We act strictly as a Processor (or 'Data Processor' under GDPR/DPDP) when managing, saving, or exporting form responses collected by our Creators. Creators are the sole Data Controllers of the forms they build and must ensure they have a lawful legal basis and appropriate disclosure if collecting Personally Identifiable Information (PII) from their respondents.",
      ],
    },
    {
      id: "priv-database",
      title: "3. What Data We Collect: Relational Database Schema Mapping",
      tldr: "We map out exactly what is collected in our system, including email addresses, custom profiles, answers, device track tokens, and anti-spam rate hashes.",
      content: [
        "In strict compliance with the data minimization principle, we collect only the data necessary to provide a secure and reliable platform. The following parameters map directly to our active database schema:",
        "1. Account Profiles (user table): Stores unique user ID, email address, display name, biographical text, location, website URL, custom social handles (LinkedIn, Twitter/X, GitHub), selected visual theme preferences, and admin privilege flags.",
        "2. Session Records (session table): Tracks active sessions, expiration timestamps, encrypted session tokens, security user agents, and IP addresses to prevent session hijacking.",
        "3. Form Configurations (forms & questions tables): Stores form titles, slugs, published statuses, thank you page layouts, background visual types, background hex colors, and form questions JSON data.",
        "4. Form Response Submissions (form_responses table): Stores respondent answers JSON, checked_in flags, and unique device fingerprints ('device_id') when duplicate tracking is enabled by the creator.",
        "5. Anti-Abuse Rate Logs (ip_rate_log table): Stores hashed IP addresses mapped to form IDs to execute automated rate-limiting, preventing script spams without storing identifiable client IPs.",
      ],
    },
    {
      id: "priv-legal-grounds",
      title: "4. Legal Grounds for Global Data Processing",
      tldr: "We process your data based on your consent, contract delivery, legal requirements, and legitimate platform security.",
      content: [
        "Depending on your region, we process your personal data under the following legitimate legal bases:",
        "• Express Consent: When you explicitly opt-in, sign up, or fill out a form that requests consent (GDPR Art. 6(1)(a), India DPDP Sec. 6, Brazil LGPD Art. 7(I)).",
        "• Performance of Contract: When processing is mandatory to deliver our services, handle sessions, generate certificates, or process form layouts (GDPR Art. 6(1)(b), LGPD Art. 7(V)).",
        "• Legitimate Interests: For anti-abuse prevention, security audits, rate-limiting, IP-hashing logs, and platform optimizations (GDPR Art. 6(1)(f)).",
        "• Legal Obligations: To comply with international safety directives, financial reporting, and requests from legitimate public authorities (GDPR Art. 6(1)(c), LGPD Art. 7(II)).",
      ],
    },
    {
      id: "priv-tracking",
      title: "5. Spam Prevention, Cookies & Technical Tracking",
      tldr: "We do not use ad trackers. We use cookies for sessions, local storage for theme choices, and secure salt-and-hash algorithms to check IPs for spam.",
      content: [
        "Quill does not utilize any third-party behavioral advertising pixels, behavioral tracking networks, or ad brokers.",
        "• Essential Cookies: Better Auth utilizes secure HTTP-only cookies to manage active login sessions and protect users against Cross-Site Request Forgery (CSRF).",
        "• Styling LocalStorage: We store light/dark/auto UI choices inside browser localStorage ('quill-theme-preference') to immediately apply your preferred visuals.",
        "• Hashed Anti-Abuse Identifiers: When Event Creators enable rate-limiting or anti-double-voting protocols on their forms, we employ standard cryptographic hash functions (such as SHA-256 combined with a rotated server salt) to store a unique device token or IP hash. This ensures vote integrity without exposing raw IPs or physical locations.",
      ],
    },
    {
      id: "priv-processors",
      title: "6. Trusted Third-Party Sub-Processors",
      tldr: "We share data only with infrastructure partners: Neon for database storage, Cloudflare for security, and Cloudinary for custom background uploads.",
      content: [
        "We engage a curated group of premium, highly secure infrastructure providers (Sub-Processors) to execute SaaS operations. Data is shared only to the extent necessary for operational delivery:",
        "• Database Hosting: Neon Serverless (highly secure, auto-scaling relational PostgreSQL storage).",
        "• Edge Delivery & WAF Security: Cloudflare Inc. (CDN routing, DDoS filtering, TLS/SSL termination, and location-optimized cache delivery).",
        "• Media Optimization: Cloudinary (secure cloud storage, processing, and delivery of custom creator branding background images).",
        "All our sub-processors are legally bound by rigorous Data Processing Agreements (DPAs) and utilize Standard Contractual Clauses (SCCs) to ensure equivalent, high-tier data protection.",
      ],
    },
    {
      id: "priv-transfers",
      title: "7. Cross-Border Data Transfers & Adequacy Protocols",
      tldr: "We transfer data internationally using Standard Contractual Clauses (SCCs) and enforce strong security standards.",
      content: [
        "Because our Hosted Service utilizing serverless databases operates globally, personal data may be accessed, processed, or transferred across international borders.",
        "For residents of the EEA, UK, Switzerland, Brazil, and India, we enforce strict compliance mechanisms for international data transfers:",
        "• Standard Contractual Clauses (SCCs): We implement the European Commission's approved SCCs for data transfers from the EU to countries without adequacy decisions (such as parts of the US).",
        "• Adequacy Frameworks: We prioritize local adequacy decisions and local server availability where applicable, utilizing edge-caching configurations via Cloudflare to limit unnecessary global traversal.",
        "• Transfer Impact Assessments (TIAs): We perform regular assessments to verify that international hosting nodes maintain protection levels fully equivalent to local standards.",
      ],
    },
    {
      id: "priv-regional-rights",
      title: "8. Global Data Rights Matrix (Jurisdiction Guide)",
      tldr: "You have full rights to access, copy, correct, or completely wipe your data. Read below for region-specific details.",
      content: [
        "We believe that data rights should be universal. We provide full self-service settings to execute rights for all users, structured by global jurisdictions below:",
        "1. Europe (GDPR / UK GDPR / Swiss FADP):\n• Article 15 (Right to Access): Export your data as CSV/JSON at any time.\n• Article 16 (Right to Rectification): Update profile fields instantly.\n• Article 17 (Right to Erasure / Forgotten): Immediate cascading relational deletion of forms and accounts.\n• Article 18-21 (Right to Restrict & Object): Object to automated processing or request processing limits.\n• Article 7(3): Withdraw consent at any time.",
        "2. United States (CCPA/CPRA, VCDPA, CPA, etc.):\n• Right to Know: Disclose categories of personal data collected, shared, or processed.\n• Right to Delete: Erase collected personal details.\n• Right to Correct: Repair inaccurate personal profile information.\n• Right to Opt-Out: We do not sell or share your data for cross-context behavioral advertising, eliminating the need for opt-out links.\n• Non-Discrimination: We offer identical premium service regardless of rights execution.",
        "3. Brazil (LGPD - Article 18):\n• Right to confirm processing and access data.\n• Right to anonymize, block, or delete unnecessary/non-compliant processing.\n• Right to port data to another service provider.\n• Right to obtain information about third-party sharing entities.",
        "4. India (DPDP Act 2023 - Sections 11-14):\n• Right to Access: Obtain a summary of processed personal data.\n• Right to Correction & Erasure: Correct inaccuracies or request complete data wiping.\n• Right to Nominate: Designate a legal representative to act on your behalf in the event of death or incapacity.\n• Right to Grievance Redressal: Access rapid dispute resolution via our designated DPO.",
        "5. APAC (Singapore PDPA, Australia Privacy Act):\n• Right to access, verify accuracy, request corrections, and restrict data to specific collection purposes (Singapore PDPA Part V, Australia APPs 12 & 13).\n• South Korea (PIPA) and Japan (APPI) rights to cease use or delete non-compliant data.",
        "6. Africa (South Africa POPIA, Nigeria NDPR):\n• Right to object to processing, request deletion, verify legitimate legal grounds, and file direct complaints with local regulators (e.g. South Africa Information Regulator).",
      ],
    },
    {
      id: "priv-retention",
      title: "9. Data Retention & Archival Policies",
      tldr: "We keep your data only as long as you want. Deleting data wipes it permanently, and logs are recycled regularly.",
      content: [
        "Our data retention policies are designed around customer empowerment and data minimization:",
        "• Creator Accounts & Forms: Stored indefinitely while your account is active. If you request account erasure or delete a form, all linked tables (questions, answers, checked_in logs, and device mappings) are permanently purged.",
        "• Security Rate Logs: Hashed IP and device tracking indicators used for anti-spam logs in the 'ip_rate_log' are systematically truncated, rotated, or overwritten within a 60-day cycle.",
        "• Backup Cycles: Full database backups are stored in encrypted environments and are auto-deleted or overwritten within a standard 30-day retention cycle.",
      ],
    },
    {
      id: "priv-dpo",
      title: "10. Data Protection Officer (DPO) & Redressal Frameworks",
      tldr: "Have questions? Email us at privacy@quill.geekroom-srmist.co.in. You also have the right to contact your country's privacy regulator.",
      content: [
        "If you have any questions, wish to exercise your legal rights, or file a complaint regarding our privacy practices, please contact our designated Data Protection Officer (DPO) at:",
        "📧 privacy@quill.geekroom-srmist.co.in",
        "Grievance Redressal Timeframes: In accordance with global statutes, we will review and resolve rights requests and grievance complaints within the mandatory legal timeframes (typically within 30 days under GDPR, 30 days under India's DPDP and US state laws, and 45 days under CCPA).",
        "Supervisory Authorities: If you feel we have not resolved your concern adequately, you maintain the absolute statutory right to file a complaint with your local Data Protection Authority (such as the European Data Protection Board, the California Privacy Protection Agency, the Data Protection Board of India, or the Information Commissioner's Office in the UK).",
      ],
    },
  ];

  // Reactive computed lists of sections filtered by the search query
  let filteredTerms = $derived(
    termsSections.filter(
      (section) =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.tldr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.some((para) =>
          para.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ),
  );

  let filteredPrivacy = $derived(
    privacySections.filter(
      (section) =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.tldr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.some((para) =>
          para.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ),
  );

  // Jump to specific element ID on the page smoothly
  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
</script>

<svelte:head>
  <title>Global Compliance & Legal Center | Quill</title>
  <meta
    name="description"
    content="Read Quill's global Terms of Service and Privacy Policy. Fully detailed compliance center meeting standards for GDPR, CCPA, LGPD, PIPEDA, POPIA, and India's DPDP Act 2023."
  />
</svelte:head>

<div
  class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 pb-20"
>
  <!-- Nav Bar -->
  <nav
    class="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors"
  >
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/" class="flex items-center gap-2 group">
          <img
            src={favicon}
            alt="Quill"
            class="w-6 h-6 group-hover:rotate-12 transition-transform duration-300"
          />
          <span
            class="text-lg font-bold tracking-tight text-black dark:text-white"
            >Quill</span
          >
        </a>
        <div
          class="hidden sm:flex h-4 w-[1px] bg-gray-300 dark:bg-gray-700"
        ></div>
        <span
          class="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
        >
          Global Trust Center
        </span>
      </div>

      <div class="flex items-center gap-4">
        <a
          href="/"
          class="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          Back to Home
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Header Section -->
  <header
    class="pt-32 pb-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors"
  >
    <div class="max-w-5xl mx-auto px-6">
      <div
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 mb-4 uppercase tracking-wider"
      >
        <Globe class="w-3.5 h-3.5 animate-spin-slow text-indigo-500" />
        Fully Compliant Worldwide
      </div>
      <h1
        class="text-4xl md:text-5xl font-black tracking-tight text-gray-950 dark:text-white mb-4 leading-tight"
      >
        Global Compliance & Trust Hub
      </h1>
      <p
        class="max-w-3xl text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium"
      >
        Quill respects the data sovereignty of every nation. Below you will find
        our comprehensive, highly detailed **Terms of Service** and **Privacy
        Policy**, covering European (GDPR), North American (CCPA/PIPEDA), South
        American (LGPD), Asia-Pacific (DPDP/PDPA), and African (POPIA) legal
        directives.
      </p>

      <!-- Last Updated Info -->
      <div
        class="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider"
      >
        <span class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-indigo-500" />
          Last Updated: May 29, 2026
        </span>
        <span class="flex items-center gap-2">
          <Lock class="w-4 h-4 text-emerald-500" />
          Secure & Encrypted Relational Database
        </span>
        <span class="flex items-center gap-2">
          <Code class="w-4 h-4 text-amber-500" />
          MIT Licensed Open Source Codebase
        </span>
      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="max-w-7xl mx-auto px-6 mt-12">
    <div class="grid lg:grid-cols-[280px_1fr] gap-12 items-start">
      <!-- Sticky Sidebar Navigation & Quick Summaries -->
      <aside
        class="sticky top-24 hidden lg:flex flex-col gap-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2"
      >
        <div
          class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <h3
            class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2"
          >
            <FileText class="w-4 h-4 text-indigo-500" />
            Table of Contents
          </h3>

          <nav class="flex flex-col gap-1">
            {#if activeTab === "terms"}
              {#each termsSections as section}
                <button
                  onclick={() => scrollToSection(section.id)}
                  class="text-left py-2 px-3 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all truncate"
                  title={section.title}
                >
                  {section.title}
                </button>
              {/each}
            {:else}
              {#each privacySections as section}
                <button
                  onclick={() => scrollToSection(section.id)}
                  class="text-left py-2 px-3 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all truncate"
                  title={section.title}
                >
                  {section.title}
                </button>
              {/each}
            {/if}
          </nav>
        </div>

        <!-- Compliance Quick Badges -->
        <div
          class="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 transition-colors"
        >
          <h4
            class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"
          >
            <Compass class="w-4 h-4" /> Global Standards
          </h4>
          <ul class="space-y-3">
            <li
              class="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 class="w-4 h-4 text-indigo-500 shrink-0" />
              EEA/UK GDPR Compliant
            </li>
            <li
              class="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 class="w-4 h-4 text-indigo-500 shrink-0" />
              US State Laws (CCPA/CPRA)
            </li>
            <li
              class="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 class="w-4 h-4 text-indigo-500 shrink-0" />
              India DPDP Act (Sections 11-14)
            </li>
            <li
              class="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 class="w-4 h-4 text-indigo-500 shrink-0" />
              Brazil LGPD & Canada PIPEDA
            </li>
            <li
              class="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 class="w-4 h-4 text-indigo-500 shrink-0" />
              South Africa POPIA Verified
            </li>
            <li
              class="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 class="w-4 h-4 text-indigo-500 shrink-0" />
              MIT Open Source License
            </li>
          </ul>
        </div>
      </aside>

      <!-- Legal Content Hub -->
      <section class="min-w-0">
        <!-- Interactive Controls (Search & Tab Switches) -->
        <div
          class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm mb-8 transition-colors"
        >
          <!-- Tabs Switcher -->
          <div class="flex border-b border-gray-100 dark:border-gray-800 mb-6">
            <button
              onclick={() => selectTab("terms")}
              class="flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all {activeTab ===
              'terms'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
            >
              <Scale class="w-4.5 h-4.5" />
              Terms of Service
            </button>
            <button
              onclick={() => selectTab("privacy")}
              class="flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all {activeTab ===
              'privacy'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
            >
              <Shield class="w-4.5 h-4.5" />
              Privacy Policy
            </button>
          </div>

          <!-- Dynamic Search Input -->
          <div class="relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5"
            />
            <input
              type="text"
              placeholder="Search global compliance clauses (e.g., GDPR, CCPA, LGPD, DPDP, cookies, open source)..."
              bind:value={searchQuery}
              class="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-gray-600 transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium"
            />
            {#if searchQuery}
              <button
                onclick={() => (searchQuery = "")}
                class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            {/if}
          </div>
        </div>

        <!-- Warning Alert if no search match -->
        {#if (activeTab === "terms" && filteredTerms.length === 0) || (activeTab === "privacy" && filteredPrivacy.length === 0)}
          <div
            class="flex items-start gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 transition-colors"
          >
            <AlertTriangle
              class="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <div>
              <h3 class="text-sm font-bold text-amber-800 dark:text-amber-400">
                No matching legal clauses found
              </h3>
              <p
                class="text-xs text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed"
              >
                We couldn't find any section matching "{searchQuery}". Please
                try searching for terms like "LGPD", "POPIA", "DPDP", "PIPEDA",
                "GDPR", "open source", "DPO", "erasure", or "device tracking".
              </p>
            </div>
          </div>
        {/if}

        <!-- Active Policy Content Render -->
        <div class="space-y-8">
          {#if activeTab === "terms"}
            {#each filteredTerms as section (section.id)}
              <article
                id={section.id}
                class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300"
              >
                <!-- Section Header -->
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800"
                >
                  <h2
                    class="text-xl md:text-2xl font-black text-gray-950 dark:text-white tracking-tight"
                  >
                    {section.title}
                  </h2>
                </div>

                <!-- Sleek TL;DR Summary Block -->
                <div
                  class="mt-5 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 flex gap-3"
                >
                  <div
                    class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0 mt-0.5"
                  >
                    i
                  </div>
                  <div>
                    <span
                      class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1"
                    >
                      Quick Summary (TL;DR)
                    </span>
                    <p
                      class="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed font-semibold"
                    >
                      {section.tldr}
                    </p>
                  </div>
                </div>

                <!-- Legal Body Content -->
                <div
                  class="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
                >
                  {#each section.content as paragraph}
                    <p class="whitespace-pre-line">{paragraph}</p>
                  {/each}
                </div>
              </article>
            {/each}
          {:else}
            <!-- Privacy Policy Layout -->
            {#each filteredPrivacy as section (section.id)}
              <article
                id={section.id}
                class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300"
              >
                <!-- Section Header -->
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800"
                >
                  <h2
                    class="text-xl md:text-2xl font-black text-gray-950 dark:text-white tracking-tight"
                  >
                    {section.title}
                  </h2>
                </div>

                <!-- Sleek TL;DR Summary Block -->
                <div
                  class="mt-5 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 flex gap-3"
                >
                  <div
                    class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5"
                  >
                    ✓
                  </div>
                  <div>
                    <span
                      class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1"
                    >
                      Quick Summary (TL;DR)
                    </span>
                    <p
                      class="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed font-semibold"
                    >
                      {section.tldr}
                    </p>
                  </div>
                </div>

                <!-- Legal Body Content -->
                <div
                  class="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
                >
                  {#each section.content as paragraph}
                    <p class="whitespace-pre-line">{paragraph}</p>
                  {/each}
                </div>
              </article>
            {/each}
          {/if}
        </div>

        <!-- Trust Statement Badge at the bottom -->
        <div
          class="mt-12 text-center p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm transition-colors"
        >
          <ShieldCheck class="w-10 h-10 mx-auto text-indigo-500 mb-3" />
          <h3 class="text-base font-bold text-gray-950 dark:text-white">
            Your Global Trust is Our Mission
          </h3>
          <p
            class="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto leading-relaxed"
          >
            Whether you are self-hosting our MIT-licensed codebase or utilizing
            our high-speed, secure global SaaS cloud, data transparency and
            privacy sovereignty are engineered directly into our design values.
          </p>
        </div>
      </section>
    </div>
  </main>
</div>

<style>
  :global(.animate-spin-slow) {
    animation: spin 12s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
