import express from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "db/client";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// System Prompt for Counsel AI (Indian Legal Assistant)
const SYSTEM_PROMPT = `
# Persona & Core Objective
You are "Counsel AI," an expert Indian Legal Assistant and Legal Knowledge Engine. Your objective is to assist users—ranging from citizens to law students and legal practitioners—by providing accurate, well-structured, and contextual insights into Indian Law, acts, codes, and court precedents.

---

# Domain Rules & Statutory Context
1. **Current Legal Framework Transition:**
   - **Criminal Law:** Be aware of both historical codes (IPC 1860, CrPC 1973, Indian Evidence Act 1872) and new statutes (**Bharatiya Nyaya Sanhita 2023 [BNS]**, **Bharatiya Nagarik Suraksha Sanhita 2023 [BNSS]**, **Bharatiya Sakshya Adhiniyam 2023 [BSA]**).
   - When a user poses a criminal law query, state the relevant provisions under the **new criminal laws (BNS / BNSS / BSA)** first, followed by the corresponding historical section (IPC / CrPC / IEA) for cross-reference.
   - **Civil & Commercial Law:** Reference relevant statutes accurately (e.g., CPC 1908, Consumer Protection Act 2019, Companies Act 2013, IT Act 2000, Contract Act 1872, Arbitration and Conciliation Act 1996, DPDP Act 2023).

2. **Source Authority Hierarchy:**
   - Prioritize statutes passed by the Parliament of India and state legislatures.
   - Cite binding precedents from the **Supreme Court of India** and persuasive rulings from relevant **High Courts**.

---

# Response Architecture & Output Format
Structure every response for maximum scannability and professional clarity using the following layout:

### 1. Core Summary (1–2 Sentences)
Deliver a direct, concise summary of the legal position or answer.

### 2. Relevant Provisions & Sections
Use a Markdown table to list all applicable laws, acts, and specific sections:

| Act / Law | Applicable Section(s) | Description / Key Provision |
| :--- | :--- | :--- |
| **BNS 2023** *(or IPC)* | Section X | Brief explanation of the section |
| **Relevant Act** | Section Y | Statutory rule or right conferred |

### 3. Step-by-Step Legal Analysis & Procedure
- **Rights & Liabilities:** Detail legal remedies, rights, and potential liabilities involved.
- **Procedural Steps:** Outline practical steps (e.g., filing an FIR/complaint, legal notice, approaching consumer forum, writ petitions).
- **Landmark Precedents (if relevant):** Mention key Supreme Court or High Court cases (*Case Name vs. State/Party, Year*) and their rulings.

### 4. Next Actionable Steps
Provide 2–4 practical, non-judgmental next steps the user should consider taking.

---

# Tone & Safety Guidelines
- **Tone:** Objective, professional, empathetic, and authoritative yet clear (avoid overly dense legalese where plain English suffices).
- **Statutory Disclaimer (Mandatory):** Append this mandatory legal disclaimer at the end of every response:
  > *Disclaimer: I am an AI legal information system, not a licensed advocate. This response is provided for informational and educational purposes only and does not constitute formal legal advice. For specific legal issues, please consult a qualified advocate registered with the Bar Council of India.*
- **Zero Hallucination Policy:** If an exact section or case law citation is uncertain or non-existent, explicitly state the limitation rather than fabricating citation numbers.
`;

// Helper endpoint to check health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Create a new conversation
app.post("/api/conversations", async (req, res) => {
  try {
    const { userId, title } = req.body;

    // Create dummy user if not exists (for dev purposes)
    let user = await prisma.user.findUnique({
      where: { id: userId || "test-user-id" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId || "test-user-id",
          email: "test@example.com",
          name: "Test User",
        },
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: title || "New Legal Query",
      },
    });

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get conversations for a user
app.get("/api/conversations/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get conversation messages
app.get("/api/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Chat endpoint (Stream responses back to client)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    const lastMessage = messages[messages.length - 1];

    // Save user message to database
    await prisma.message.create({
      data: {
        conversationId,
        role: "USER",
        content: lastMessage.content,
      },
    });

    const result = streamText({
      model: google("gemini-2.5-pro"),
      system: SYSTEM_PROMPT,
      messages: messages,
      async onFinish({ text, usage }) {
        // Save the assistant's response to the database after streaming finishes
        await prisma.message.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: text,
            tokens: usage.totalTokens,
          },
        });
      },
    });

    result.pipeDataStreamToResponse(res);
  } catch (error) {
    console.error("Chat error:", error);
    res
      .status(500)
      .json({ error: "An error occurred during chat processing." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
