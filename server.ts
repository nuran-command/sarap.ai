import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initialBranches, initialStaff, initialReviews, getMenuSentimentMetrics } from "./src/db/dataMock";
import { Review, Staff, Branch } from "./src/types";

// Keep in-memory database representing SQLAlchemy & PostgreSQL tables
let dbReviews: Review[] = [...initialReviews];
let dbStaff: Staff[] = [...initialStaff];
let dbBranches: Branch[] = [...initialBranches];

// Background task container for FastAPI style async task tracking
interface BackgroundTask {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  addedCount: number;
  duplicateCount: number;
  error?: string;
}
const backgroundTasks: Record<string, BackgroundTask> = {};

const app = express();
const PORT = 3000;

app.use(express.json());

// Telegram simulated webhook log container
const telegramWebhookLogs: { timestamp: string; url: string; payload: any }[] = [];

// Helper function for Central Asian AI reply draft backup
function getOfflineDraft(rating: number, reviewer: string, comment: string, dishes: string[], tone: string): string {
  const dishText = dishes.length > 0 ? ` біздің ${dishes.join(' және ')}` : '';
  const name = reviewer || 'Құрметті қонақ';
  
  if (tone === 'Warm' || tone === 'Бауырсақ') {
    if (rating >= 4) {
      return `Бауырым ${name}! Шын жүректен айналайын! 🌟 Шаңырағымызға келіп,${dishText} ұнатқаныңызға өте ризамыз. Сары майдай еріген ыстық бауырсақтарымыз бен иісі бұрқыраған шайымыз әрқашан сізге дайын! Сәнжар бауырымызға сіздің жылы сөзіңізді жеткіземіз. Күніңіз сәтті өтсін, келесі келгенде төрге шығыңыз!`;
    } else {
      return `Айналайын ${name}, қонақ - тәңірдің ырысы! 😔 Орын алған жағдай үшін кешірім сұраймыз. Біздің шаңыраққа салқын тағам қызмет етілмеуі тиіс еді. Менеджеріміз қазір сізге жол тартты, бұл кемшілікті мінідетті түрде түзетеміз. Дәмханамыздың намысын биік ұстауға сөз береміз. Ыстық шай мен бауырсақ бізден сый болсын!`;
    }
  } else if (tone === 'Bilingual' || tone === 'Алматинский Коктейль') {
    if (rating >= 4) {
      return `Привет, ${name}! Көп рахмет за отзыв! 😍 Приятно, что ${dishes.join(', ') || 'наша кухня'} зашли на ура. Командамыз талпынып жатыр, чтобы каждый визит дарил чисто алматинский вайб. Келесі жолы обязательно заглядывайте на летку, ждем вас на свежий кумыс или коктейль! Күтеміз! ✨`;
    } else {
      return `Слушайте, ${name}, мы дико извиняемся за этот факап! 😔 Нам очень ыңғайсыз, что так получилось с вашим заказом. Салқын манты — это вообще не по-нашему. Менеджер уже бежит рентить этот вопрос прямо сейчас. Пожалуйста, күте тұрыңыз, мы исправим всё перед вашим уходом и сделаем приятный комплимент!`;
    }
  } else {
    // Formal / Құрметті
    if (rating >= 4) {
      return `Құрметті ${name}! Sarap.ai платформасы арқылы қалдырған жоғары бағаңызға алғысымызды білдіреміз. Біздің ${dishes.join(', ') || 'тағамдар'} мен қызмет көрсету сапасын жоғары бағалағаныңыз біз үшін үлкен мәртебе. Сізді келесі жолы да дәмханамызда сапалы қызметпен қарсы алуға дайынбыз. Құрметпен, Басшылық.`;
    } else {
      return `Құрметті ${name}! Келеңсіз жағдай үшін сізден шын жүректен кешірім сұраймыз. Сіздің пікіріңіз қызмет сапасын жақсарту үшін өте маңызды. Жіберілген қателікті түзету мақсатында біздің ресторан менеджері шұғыл түрде шара қолдануда. Біз сізбен жақын арада байланысамыз. Құрметпен, Сапа бақылау бөлімі.`;
    }
  }
}

// AI reply generator incorporating Gemini SDK
async function generateAIReply(rating: number, reviewer: string, comment: string, dishes: string[], tone: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_KEY")) {
    return getOfflineDraft(rating, reviewer, comment, dishes, tone);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `You are Sarap.ai, an elite B2B AI reputation manager for high-end restaurant groups in Central Asia.
Generate a response to a guest review using the specified tone style: "${tone}".

Review details to incorporate:
Reviewer Name: ${reviewer}
Stars Rating: ${rating} of 5
Written Comment: ${comment}
Dishes selected by user: ${dishes.join(', ')}

Central Asian Tone Guidance:
- "Formal" (Құрметті): Respectful, grand, formal, using sophisticated Kazakh/Russian sentences.
- "Warm" (Бауырсақ): Hospitable, intimate, referring to home warmth, rich green tea (шай), soft Baursaks, and Central Asian family-like courtesy.
- "Bilingual" (Алматинский Коктейль): Fresh urban Almaty/Astana lingo featuring a friendly and highly realistic blend of Kazakh and Russian (e.g. 'привет!', 'көп рахмет за визит', 'обязательно күтеміз вас').

Format: Maintain a polite, engaging response under 120 words. If negative, show genuine care and professional rectification effort. Output only the pure response draft without any markdown wrappers or quotes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return response.text ? response.text.trim() : getOfflineDraft(rating, reviewer, comment, dishes, tone);
  } catch (error) {
    console.error("Gemini service unavailable. Serving cultural backup draft:", error);
    return getOfflineDraft(rating, reviewer, comment, dishes, tone);
  }
}

// ======================== API ROUTES ========================

// 1. GET /api/qr/{qr_code_uuid}
// Fetches staff member by QR UUID and includes Branch metadata
app.get("/api/qr/:qr_code_uuid", (req, res) => {
  const { qr_code_uuid } = req.params;
  const staff = dbStaff.find(s => s.qr_code_uuid === qr_code_uuid);
  
  if (!staff) {
    return res.status(404).json({ error: "Staff QR Code not found. Please verify the URL." });
  }
  
  const branch = dbBranches.find(b => b.id === staff.branch_id);
  res.json({
    staff: {
      id: staff.id,
      first_name: staff.first_name,
      qr_code_uuid: staff.qr_code_uuid,
      role: staff.role,
      avatar: staff.avatar,
      is_active: staff.is_active
    },
    branch
  });
});

// 2. POST /api/qr/{qr_code_uuid}/submit
// Process guest submission with conditional Smart Buffer Logic
app.post("/api/qr/:qr_code_uuid/submit", async (req, res) => {
  const { qr_code_uuid } = req.params;
  const { rating, dishes, comment, reviewer_name, selectedTone } = req.body;
  
  const staff = dbStaff.find(s => s.qr_code_uuid === qr_code_uuid);
  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }
  
  // Create a new simulated review ID
  const newReviewId = `rev-qr-${Date.now()}`;
  const dishesArray = dishes || [];
  const dishList = dishesArray.map((d: any) => d.name);

  // Formulate review model
  const newReview: Review = {
    id: newReviewId,
    rating: Number(rating),
    comment: comment || '',
    reviewer_name: reviewer_name || 'Anonymous Guest',
    urgency: rating <= 3 ? 'high' : 'low',
    is_answered: rating <= 3 ? false : true, // Negative goes to alert status, positive answered with AI draft
    branch_id: staff.branch_id,
    staff_id: staff.id,
    review_date: new Date().toISOString().split('T')[0],
    platform: 'Smart Buffer',
    created_at: new Date().toISOString(),
    dishes_feedback: dishesArray
  };

  // Process Smart Buffer Logic:
  if (rating >= 4) {
    // POSITIVE: Save review immediately, generate beautiful AI reply & return mapping deep links
    const toneChoice = selectedTone || 'Bilingual';
    const aiDraft = await generateAIReply(rating, newReview.reviewer_name, newReview.comment, dishList, toneChoice);
    newReview.ai_response_draft = aiDraft;
    
    dbReviews.unshift(newReview);
    
    // Update staff local counters
    staff.review_count = (staff.review_count || 0) + 1;
    const oldSum = (staff.average_rating || 4.5) * ((staff.review_count || 1) - 1);
    staff.average_rating = Math.round(((oldSum + rating) / staff.review_count) * 10) / 10;

    return res.json({
      success: true,
      action: 'positive_buffer',
      review: newReview,
      ai_response_draft: aiDraft,
      links: {
        two_gis: `https://2gis.kz/almaty/search/restaurants/query/Qazaq%20Gourmet?utm_source=sarap_ai`,
        google_maps: `https://www.google.com/maps/search/?api=1&query=Restaurant+Almaty+Kazakhstan`
      }
    });
  } else {
    // CRITICAL (<= 3): Mark as High Urgency, log review, trigger simulated Telegram webhook alert
    dbReviews.unshift(newReview);
    
    // Update staff counters
    staff.review_count = (staff.review_count || 0) + 1;
    const oldSum = (staff.average_rating || 4.5) * ((staff.review_count || 1) - 1);
    staff.average_rating = Math.round(((oldSum + rating) / staff.review_count) * 10) / 10;

    // Simulate Telegram notification payload
    const tgWebhookUrl = "https://api.telegram.org/bot_sarap_placeholder/sendMessage";
    const telegramPayload = {
      chat_id: "-10020260621",
      text: `🚨 [SARAP.AI CRITICAL BUFFER ALERT]
Branch: ${dbBranches.find(b => b.id === staff.branch_id)?.name || 'Almaty Brand'}
Waiter: ${staff.first_name}
Reviewer: ${newReview.reviewer_name}
Rating: ${rating} / 5 ⭐
Comment: "${newReview.comment}"
Dishes Disliked: ${dishesArray.filter((d: any) => !d.liked).map((d: any) => d.name).join(', ') || 'None stated'}

⚠️ Customer is still in the restaurant! Please contact them at table now to resolve the issue.`
    };
    
    const webhookLog = {
      timestamp: new Date().toISOString(),
      url: tgWebhookUrl,
      payload: telegramPayload
    };
    telegramWebhookLogs.unshift(webhookLog);
    console.log("SIMULATED TELEGRAM WEBHOOK SENT:", JSON.stringify(telegramPayload, null, 2));

    return res.json({
      success: true,
      action: 'negative_buffer_intercepted',
      review: newReview,
      telegram_alert_simulated: true,
      telegram_log: webhookLog
    });
  }
});

// 3. GET /api/reviews/upload-csv Background Task simulator
// Initiate FastAPI-like background CSV parsing task & return task tracking ID
app.post("/api/reviews/upload-csv", (req, res) => {
  const { csvContent } = req.body;
  if (!csvContent) {
    return res.status(400).json({ error: "No CSV content received." });
  }

  const taskId = `task-${Date.now()}`;
  backgroundTasks[taskId] = {
    id: taskId,
    status: 'queued',
    progress: 0,
    addedCount: 0,
    duplicateCount: 0
  };

  res.json({
    message: "CSV upload started successfully in the background",
    taskId,
    status: "queued"
  });

  // Start FastAPI-style background task processing to prevent timeouts
  const parseAndAnalyzeAsync = async () => {
    try {
      backgroundTasks[taskId].status = 'processing';
      backgroundTasks[taskId].progress = 10;
      
      const lines = csvContent.split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length <= 1) {
        backgroundTasks[taskId].status = 'completed';
        backgroundTasks[taskId].progress = 100;
        return;
      }

      // First line is headers
      const dataLines = lines.slice(1);
      let progressStep = 80 / dataLines.length;

      let added = 0;
      let duplicates = 0;

      for (let i = 0; i < dataLines.length; i++) {
        // Basic CSV parsing addressing optional quotes: "Almaty Gourmet",Sanzhar,5,2026-06-21,"It was good",dishes
        const line = dataLines[i];
        
        // Simple regex to parse CSV taking care of quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const cleanMatches = matches.map((m: string) => m.replace(/^"|"$/g, '').trim());

        if (cleanMatches.length < 5) continue;

        const branchName = cleanMatches[0];
        const reviewer_name = cleanMatches[1];
        const ratingVal = Number(cleanMatches[2]) || 5;
        const review_date = cleanMatches[3];
        const text = cleanMatches[4];
        const dishesRaw = cleanMatches[5] ? cleanMatches[5].split(';') : [];

        // Match branch ID
        let matchedBranch = dbBranches.find(b => b.name.toLowerCase().includes(branchName.toLowerCase())) || dbBranches[0];
        
        // Check review deduplication using unique composite hash
        // key: branch_id + reviewer_name + review_date + comment
        const isDuplicate = dbReviews.some(r => 
          r.branch_id === matchedBranch.id &&
          r.reviewer_name.toLowerCase() === reviewer_name.toLowerCase() &&
          r.review_date === review_date &&
          r.comment.toLowerCase().trim() === text.toLowerCase().trim()
        );

        if (isDuplicate) {
          duplicates++;
        } else {
          // Construct itemized menu dishes feedback
          const dishesFeedback = dishesRaw.map((dish: string) => ({ name: dish.trim(), liked: ratingVal >= 4 }));
          
          const newReviewId = `csv-rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          let matchedStaff = dbStaff.find(s => s.branch_id === matchedBranch.id && s.is_active);
          
          // Draft response
          let aiResponse: string | undefined = undefined;
          if (ratingVal >= 4) {
            aiResponse = await generateAIReply(ratingVal, reviewer_name, text, dishesRaw, 'Bilingual');
          }

          const uploadedReview: Review = {
            id: newReviewId,
            rating: ratingVal,
            comment: text,
            reviewer_name,
            urgency: ratingVal <= 3 ? 'high' : 'low',
            is_answered: ratingVal <= 3 ? false : true,
            branch_id: matchedBranch.id,
            staff_id: matchedStaff?.id,
            review_date,
            platform: 'Google',
            created_at: new Date().toISOString(),
            dishes_feedback: dishesFeedback,
            ai_response_draft: aiResponse
          };

          dbReviews.push(uploadedReview);
          added++;
        }

        // Increment progress asynchronously
        backgroundTasks[taskId].progress = Math.round(10 + (i + 1) * progressStep);
        backgroundTasks[taskId].addedCount = added;
        backgroundTasks[taskId].duplicateCount = duplicates;

        // Yield slightly
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      backgroundTasks[taskId].status = 'completed';
      backgroundTasks[taskId].progress = 100;

    } catch (err: any) {
      console.error("Async background CSV tasks error:", err);
      backgroundTasks[taskId].status = 'failed';
      backgroundTasks[taskId].error = err.message || "Unknown file parsing error";
    }
  };

  parseAndAnalyzeAsync();
});

// GET /api/tasks/:id/status
// Polls progress and status of background tasks
app.get("/api/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const task = backgroundTasks[id];
  if (!task) {
    return res.status(404).json({ error: "Background task not found" });
  }
  res.json(task);
});

// Helper route to reset or fetch state
app.get("/api/reviews", (req, res) => {
  res.json({ reviews: dbReviews });
});

app.get("/api/staff", (req, res) => {
  res.json({ staff: dbStaff });
});

app.get("/api/branches", (req, res) => {
  res.json({ branches: dbBranches });
});

app.get("/api/telegram-logs", (req, res) => {
  res.json({ logs: telegramWebhookLogs });
});

// Manual response draft generation endpoint triggered by dashboard Tone Tuner
app.post("/api/reviews/generate-draft", async (req, res) => {
  const { rating, comment, reviewer_name, dishes, tone } = req.body;
  const draft = await generateAIReply(rating, reviewer_name, comment, dishes || [], tone);
  res.json({ draft });
});

// Save manual draft or update review replied state
app.post("/api/reviews/:id/answer", (req, res) => {
  const { id } = req.params;
  const { draftText } = req.body;
  const review = dbReviews.find(r => r.id === id);
  
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  review.is_answered = true;
  review.ai_response_draft = draftText;
  res.json({ success: true, review });
});

// Create new Staff member & generate custom unique feedback QR Code URL
app.post("/api/staff", (req, res) => {
  const { first_name, branch_id, role, qualities } = req.body;
  
  if (!first_name || !branch_id) {
    return res.status(400).json({ error: "Missing first_name or branch_id" });
  }

  const uuid = `${first_name.toLowerCase()}-qr-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newStaff: Staff = {
    id: `s-${Date.now()}`,
    first_name,
    branch_id,
    qr_code_uuid: uuid,
    is_active: true,
    role: role || "Server",
    review_count: 0,
    average_rating: 5.0,
    top_qualities: qualities || ['Polite', 'Friendly']
  };

  dbStaff.push(newStaff);
  res.json({ success: true, staff: newStaff });
});

// Bulk create staff members (e.g. from Google Sheet sync)
app.post("/api/staff/bulk", (req, res) => {
  const { staffList, branch_id } = req.body;
  if (!Array.isArray(staffList)) {
    return res.status(400).json({ error: "staffList must be an array" });
  }

  const matBranchId = branch_id || dbBranches[0].id;
  const created: Staff[] = [];

  for (const item of staffList) {
    if (!item.first_name) continue;
    
    // Check if employee with same first name already exists in this branch
    const exists = dbStaff.some(s => s.first_name.toLowerCase().trim() === item.first_name.toLowerCase().trim() && s.branch_id === matBranchId);
    if (exists) continue;

    const first_name = item.first_name.trim();
    const role = item.role || "Server";
    
    let qArr: string[] = ['Friendly', 'Helpful'];
    if (Array.isArray(item.qualities)) {
      qArr = item.qualities;
    } else if (typeof item.qualities === 'string') {
      qArr = item.qualities.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    }

    const uuid = `${first_name.toLowerCase()}-qr-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStaff: Staff = {
      id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      first_name,
      branch_id: matBranchId,
      qr_code_uuid: uuid,
      is_active: true,
      role,
      review_count: 0,
      average_rating: 5.0,
      top_qualities: qArr
    };

    dbStaff.push(newStaff);
    created.push(newStaff);
  }

  res.json({ success: true, count: created.length, staff: created });
});

// ==================== VITE MIDDLEWARE SETUP ====================

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
