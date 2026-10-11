export type Credential = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  date?: string;
  pdf?: string;
  verify?: string;
};

export type CredentialGroup = {
  id: string;
  title: string;
  description: string;
  credentials: Credential[];
};

const anthropic = (id: string, title: string, file: string, date?: string, verify?: string): Credential => ({
  id, title, image: `/credentials/anthropic/${file}.webp`,
  pdf: `/credentials/anthropic/${file}.pdf`, width: 1584, height: 1224, date, verify,
});

export const credentialGroups: CredentialGroup[] = [
  {
    id: "microsoft", title: "Microsoft Certified", description: "Professional certification",
    credentials: [{ id: "azure-ai-fundamentals", title: "Azure AI Fundamentals",
      image: "/main/azure-ai-fundamentals.webp", width: 2154, height: 1209, date: "2026-07-30",
      verify: "https://learn.microsoft.com/en-us/users/loganrios-6430/credentials/certification/azure-ai-fundamentals" }],
  },
  {
    id: "anthropic", title: "Anthropic", description: "Certificates of course completion",
    credentials: [
      anthropic("claude-101", "Claude 101", "certificate-nhaqmwg28rxo-1775270918"),
      anthropic("ai-fluency", "AI Fluency: Framework & Foundations", "certificate-gdaxrmf8dhvo-1775274273"),
      anthropic("claude-cowork", "Introduction to Claude Cowork", "certificate-kaq8ap4kfj7k-1775271181"),
      anthropic("ai-nonprofits", "AI Fluency for nonprofits", "certificate-56c68dq5yn4c-1775877387"),
      anthropic("intro-mcp", "Introduction to Model Context Protocol", "certificate-ryprdtazmy6v-1775877416", "2026-04-10", "https://verify.skilljar.com/c/ryprdtazmy6v"),
      anthropic("claude-api", "Claude with the Anthropic API", "certificate-kix97choou5c-1775962109", "2026-04-11", "https://verify.skilljar.com/c/kix97choou5c"),
      anthropic("advanced-mcp", "Model Context Protocol: Advanced Topics", "certificate-ixmhqeskoq2u-1775962249", "2026-04-11", "https://verify.skilljar.com/c/ixmhqeskoq2u"),
    ],
  },
];
