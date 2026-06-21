/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Users, MessageSquare, AlertTriangle, TrendingUp, Plus, 
  Search, Copy, Check, Download, QrCode, PlusCircle, Clock, 
  Sparkles, Sliders, ThumbsUp, ThumbsDown, Activity, 
  ChevronRight, RefreshCw, Send, ArrowRight, Eye, Phone, MapPin, ExternalLink, FileText,
  Utensils, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  ScatterChart, Scatter, ZAxis, Legend, BarChart, Bar, Cell 
} from 'recharts';
import { Staff, Review, Branch, SentimentMetric } from './types';
import { getMenuSentimentMetrics } from './db/dataMock';
import DriveImporter from './components/DriveImporter';

export default function App() {
  // Global Database state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [telegramLogs, setTelegramLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Google Drive Connection state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveUser, setGoogleDriveUser] = useState<any>(null);

  // Active View Tab: 'dashboard' or 'guest-simulator'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guest-simulator'>('dashboard');

  // Dashboard Sub-Views / Search Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState('all');

  // Card A: Live Reviews Sidebar Drawer state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [toneTuner, setToneTuner] = useState<'Formal' | 'Warm' | 'Bilingual'>('Bilingual');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [activeDraftText, setActiveDraftText] = useState('');
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);
  const [submittingManualAnswer, setSubmittingManualAnswer] = useState(false);

  // Card C: Selected BCG Matrix view (Stars, Problems etc)
  const [selectedBcgCategory, setSelectedBcgCategory] = useState<string>('All');

  // Card D: QR Generator Console state
  const [selectedStaffForQrId, setSelectedStaffForQrId] = useState<string>('s1');
  const [customStaffName, setCustomStaffName] = useState('');
  const [customStaffBranchId, setCustomStaffBranchId] = useState('b1');
  const [customStaffRole, setCustomStaffRole] = useState('Server');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // CSV Background uploader console
  const [csvRawText, setCsvRawText] = useState('');
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<{
    status: string;
    progress: number;
    addedCount: number;
    duplicateCount: number;
    error?: string;
  } | null>(null);
  const [isCsvConsoleOpen, setIsCsvConsoleOpen] = useState(false);

  // Interactive Guest Simulator Form state
  const [simSelectedQrUuid, setSimSelectedQrUuid] = useState('sanzhar-qr-7777-8888');
  const [simStaffMeta, setSimStaffMeta] = useState<any>(null);
  const [simRating, setSimRating] = useState<number>(5);
  const [simComment, setSimComment] = useState<string>('');
  const [simReviewerName, setSimReviewerName] = useState<string>('');
  const [simDishes, setSimDishes] = useState<{ name: string; liked: boolean }[]>([
    { name: 'Бешбармак', liked: false },
    { name: 'Бауырсақ', liked: false },
    { name: 'Манты', liked: false },
    { name: 'Лагман', liked: false }
  ]);
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Fetch all initial metadata & live collections from server
  const fetchData = async () => {
    try {
      const [revRes, staffRes, branchRes, tgRes] = await Promise.all([
        fetch('/api/reviews'),
        fetch('/api/staff'),
        fetch('/api/branches'),
        fetch('/api/telegram-logs')
      ]);

      const revData = await revRes.json();
      const staffData = await staffRes.json();
      const branchData = await branchRes.json();
      const tgData = await tgRes.json();

      setReviews(revData.reviews || []);
      setStaff(staffData.staff || []);
      setBranches(branchData.branches || []);
      setTelegramLogs(tgData.logs || []);
    } catch (err) {
      console.error("Error communicating with full-stack server endpoints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll background CSV uploader task status if active
  useEffect(() => {
    let interval: any;
    if (uploadTaskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/tasks/${uploadTaskId}/status`);
          const data = await res.json();
          setTaskProgress(data);
          
          if (data.status === 'completed' || data.status === 'failed') {
            setUploadTaskId(null);
            fetchData(); // Refresh list to catch new reviews
          }
        } catch (err) {
          console.error("Poller error:", err);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [uploadTaskId]);

  // Load staff profile once selected QR changes in guest simulator
  useEffect(() => {
    const fetchSimQrMeta = async () => {
      try {
        const res = await fetch(`/api/qr/${simSelectedQrUuid}`);
        if (res.ok) {
          const data = await res.json();
          setSimStaffMeta(data);
          // Set default dishes based on available selection
          setSimDishes([
            { name: 'Бешбармак', liked: false },
            { name: 'Бауырсақ', liked: false },
            { name: 'Манты', liked: false },
            { name: 'Лагман', liked: false }
          ]);
        }
      } catch (err) {
        console.error("Error loading QR meta:", err);
      }
    };
    fetchSimQrMeta();
  }, [simSelectedQrUuid]);

  // Handle dynamic AI response draft updating relative to Tone Tuner Slider
  const loadNewDraftForReview = async (review: Review, tone: 'Formal' | 'Warm' | 'Bilingual') => {
    setIsGeneratingDraft(true);
    try {
      const dishesList = (review.dishes_feedback || []).map(d => d.name);
      const res = await fetch('/api/reviews/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: review.rating,
          comment: review.comment,
          reviewer_name: review.reviewer_name,
          dishes: dishesList,
          tone
        })
      });
      const data = await res.json();
      setActiveDraftText(data.draft);
    } catch (err) {
      console.error("Error fetching AI tuning:", err);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review);
    setToneTuner('Bilingual');
    if (review.ai_response_draft) {
      setActiveDraftText(review.ai_response_draft);
    } else {
      loadNewDraftForReview(review, 'Bilingual');
    }
  };

  const handleToneChange = (newTone: 'Formal' | 'Warm' | 'Bilingual') => {
    setToneTuner(newTone);
    if (selectedReview) {
      loadNewDraftForReview(selectedReview, newTone);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedReview) return;
    setSubmittingManualAnswer(true);
    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftText: activeDraftText })
      });
      if (res.ok) {
        fetchData();
        setSelectedReview(null);
      }
    } catch (err) {
      console.error("Error saving draft answer:", err);
    } finally {
      setSubmittingManualAnswer(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStaffName) return;
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: customStaffName,
          branch_id: customStaffBranchId,
          role: customStaffRole,
          qualities: ['Courteous', 'Fast', 'Welcoming']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedStaffForQrId(data.staff.id);
        setShowAddStaffModal(false);
        setCustomStaffName('');
        fetchData();
      }
    } catch (err) {
      console.error("Error saving new waiter:", err);
    }
  };

  const triggerCsvUploadWithContent = async (content: string) => {
    try {
      const res = await fetch('/api/reviews/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: content })
      });
      const data = await res.json();
      setUploadTaskId(data.taskId);
      setTaskProgress({
        status: 'queued',
        progress: 0,
        addedCount: 0,
        duplicateCount: 0
      });
    } catch (err) {
      console.error("CSV upload error:", err);
    }
  };

  const handleCsvUploader = async () => {
    if (!csvRawText) return;
    await triggerCsvUploadWithContent(csvRawText);
  };

  const handleDriveImport = async (csvContent: string, fileName: string) => {
    setCsvRawText(csvContent);
    await triggerCsvUploadWithContent(csvContent);
  };

  const handleDriveImportStaff = async (staffList: any[], fileName: string) => {
    try {
      const res = await fetch('/api/staff/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffList,
          branch_id: selectedBranchFilter !== 'all' ? selectedBranchFilter : (branches[0]?.id || 'b1')
        })
      });
      if (res.ok) {
        fetchData(); // Sync active roster instantly
      }
    } catch (err) {
      console.error("Bulk waitstaff sync fail:", err);
    }
  };

  // Submit Simulated Client QR feedback form
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simStaffMeta) return;
    setSimSubmitting(true);
    try {
      const activeSelectedDishes = simDishes.filter(d => d.liked);
      const res = await fetch(`/api/qr/${simSelectedQrUuid}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: simRating,
          dishes: simDishes,
          comment: simComment,
          reviewer_name: simReviewerName,
          selectedTone: 'Bilingual'
        })
      });
      
      const data = await res.json();
      setSimResult(data);
      fetchData(); // Instantly update dashboard metrics with newly generated transaction
    } catch (err) {
      console.error("Review submission failed:", err);
    } finally {
      setSimSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReviewId(id);
    setTimeout(() => setCopiedReviewId(null), 2500);
  };

  // Download QR SVG code as SVG image file
  const handleDownloadQrSvg = (staffObj: Staff) => {
    const svgContent = document.getElementById(`qr-svg-${staffObj.id}`)?.outerHTML;
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SarapAI_QR_${staffObj.first_name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculations & Analytics metrics
  const totalReviewsCount = reviews.length;
  const unansweredAlertsCount = reviews.filter(r => r.urgency === 'high' && !r.is_answered).length;
  const averageRating = totalReviewsCount > 0 
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount) * 10) / 10 
    : 4.8;
  const answeredReviewsCount = reviews.filter(r => r.is_answered).length;
  const responseRate = totalReviewsCount > 0 
    ? Math.round((answeredReviewsCount / totalReviewsCount) * 100) 
    : 100;

  // Filter reviews matching filters and searches
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.comment.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.platform && r.platform.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBranch = selectedBranchFilter === 'all' || r.branch_id === selectedBranchFilter;
    const matchesUrgency = selectedUrgencyFilter === 'all' || r.urgency === selectedUrgencyFilter;
    return matchesSearch && matchesBranch && matchesUrgency;
  });

  // Sentiment Analytics logic (Stars, Hidden Gems, Problems, Outsiders)
  const sentimentMetricsAll = getMenuSentimentMetrics(reviews);
  const filteredBCGMetrics = sentimentMetricsAll.filter(m => {
    if (selectedBcgCategory === 'All') return true;
    return m.category === selectedBcgCategory;
  });

  // Sparkline data generators
  const mockSparklineData = [
    { value: 12 }, { value: 19 }, { value: 15 }, { value: 24 }, { value: 22 }, { value: 31 }, { value: 38 }
  ];

  const ratingSparklineData = [
    { value: 4.5 }, { value: 4.6 }, { value: 4.5 }, { value: 4.7 }, { value: 4.8 }, { value: 4.8 }, { value: 4.9 }
  ];

  // Selected QR staff item
  const activeQrStaff = staff.find(s => s.id === selectedStaffForQrId) || staff[0];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col selection:bg-accent/20 selection:text-accent">
      
      {/* Premium Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-accent to-accent-secondary flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
              Sarap.ai <span className="text-[10px] uppercase font-mono tracking-widest bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20 font-bold">B2B SaaS</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono mt-1 font-bold tracking-wider uppercase">REPUTATION BUFFER &bull; CENTRAL ASIA</p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-accent to-accent-secondary text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Sarap.ai HQ Console
          </button>
          
          <button
            onClick={() => setActiveTab('guest-simulator')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'guest-simulator'
                ? 'bg-gradient-to-r from-accent to-accent-secondary text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Phone className="h-3.5 w-3.5 animate-pulse" />
            Guest QR Simulator
          </button>
        </div>

        {/* User context metadata */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-gentle-pulse"></span>
            <span className="text-slate-600">Server Time: 21 Jun 2026</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-accent font-bold">
              KG
            </div>
            <div className="hidden lg:block leading-none">
              <p className="text-slate-900 text-[11px] font-semibold">Kunsulu Akhmetova</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Qazaq Gourmet Group Owner</p>
            </div>
          </div>
        </div>
      </header>

      {/* Live Telegram Alert Banner simulating simulated alert payloads */}
      <AnimatePresence>
        {telegramLogs.length > 0 && telegramLogs[0] && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50 border-b border-rose-105 px-6 py-2.5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <p className="text-xs text-rose-950 font-medium">
                <span className="font-mono font-bold text-rose-700 uppercase mr-1.5">[Telegram Link Intercepted]</span>
                &quot;{telegramLogs[0].payload.text.split('\n')[2]}&quot; &bull; Rating: {telegramLogs[0].payload.text.split('\n')[4]} - Intercepted inside Smart Buffer.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <RefreshCw className="h-8 w-8 text-accent animate-spin" />
            <p className="text-xs text-slate-500 font-mono font-semibold">Initializing Sarap.ai Engine & Database Connections...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-8">
            
            {/* Minimalist Modern B2B Hero Section (Inverted contrast section with signature dot pattern & interactive generative graphic) */}
            <div className="relative bg-slate-950 text-white rounded-3xl p-6 md:p-9 border border-slate-850 shadow-xl overflow-hidden min-h-[340px] md:min-h-[280px]">
              {/* Texture 1: Radial Accent Gradient Glow */}
              <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
              {/* Texture 2: Subtle opacity dot grid background */}
              <div 
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 h-full">
                {/* Brand description left columns */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-gentle-pulse" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent font-bold">
                      REPUTATION INTELLIGENCE DASHBOARD
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight leading-tight">
                      Almaty & Astana <span className="gradient-text font-serif">Hospitality Hub</span>
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-normal">
                      Managing real-time QR buffer systems, waiter performance, and automated negative feedback isolation before public directories publish.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => setIsCsvConsoleOpen(!isCsvConsoleOpen)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs border rounded-xl transition-all duration-300 font-semibold ${
                        googleDriveConnected 
                          ? 'bg-emerald-950/20 border-emerald-505/30 text-emerald-100 hover:bg-emerald-950/40' 
                          : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <HardDrive className={`h-4 w-4 ${googleDriveConnected ? 'text-emerald-400 animate-pulse' : 'text-accent'}`} />
                      {googleDriveConnected ? 'Google Drive Linked' : 'Google Drive Sync Console'}
                      <span className="text-[9px] font-mono opacity-65">
                        {googleDriveConnected ? `(${googleDriveUser?.email || 'Active'})` : `(${isCsvConsoleOpen ? 'Hide' : 'Show'})`}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      className="flex items-center gap-2 px-4.5 py-2.5 text-xs bg-gradient-to-r from-accent to-accent-secondary text-white font-bold rounded-xl hover:shadow-accent-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      Register New Server
                    </button>
                  </div>
                </div>

                {/* Right columns: Animated Abstract Generative Composition */}
                <div className="hidden lg:col-span-5 lg:flex items-center justify-center relative min-h-[220px]">
                  {/* Slow rotating decorative ring */}
                  <div className="absolute h-40 w-40 rounded-full border-2 border-dashed border-accent/20 animate-slow-spin flex items-center justify-center">
                    <div className="h-28 w-28 rounded-full border border-dotted border-accent/10" />
                  </div>

                  {/* Corner accent block in solid accent with shadow */}
                  <div className="absolute h-10 w-10 bg-accent rounded-xl shadow-accent/50 shadow-lg top-[20%] left-[20%] animate-gentle-pulse" />

                  {/* Geometric blurred background circle */}
                  <div className="absolute h-24 w-24 rounded-full bg-gradient-to-tr from-accent to-accent-secondary opacity-30 blur-sm" />

                  {/* Foreground Floating Card 1: Active Waiters */}
                  <div className="absolute bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-xl right-[10%] top-[10%] animate-gentle-bob w-36">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
                      <span className="text-[9px] font-mono text-slate-400">ACTIVE QR SCAN</span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-sm font-bold font-mono text-white">4.9</span>
                      <span className="text-[8px] text-accent font-semibold flex items-center">&uarr; Sanzhar</span>
                    </div>
                  </div>

                  {/* Foreground Floating Card 2: Buffer Intercept stats */}
                  <div className="absolute bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-xl left-[10%] bottom-[10%] animate-gentle-bob-delayed w-36">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-[9px] font-mono text-slate-400">ISOLATION BUFFER</span>
                    </div>
                    <p className="text-[10px] text-rose-400 font-bold mt-1">✓ Live Telegram Hook</p>
                  </div>

                  {/* 3x3 Decorative Dot Grid */}
                  <div className="absolute bottom-4 right-10 grid grid-cols-3 gap-1 px-2 opacity-30">
                    {Array.from({ length: 9 }).map((_, idx) => (
                      <span key={idx} className="h-1 w-1 rounded-full bg-slate-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CSV Fast Loader Collapsible Console (Styled to fit light design seamlessly) */}
            <AnimatePresence>
              {isCsvConsoleOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent animate-gentle-pulse"></span>
                        <h3 className="text-xs font-mono font-bold uppercase text-slate-900">BackgroundTasks &amp; Drive Review Broker</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">Review Deduplication active</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Manual CSV Loader */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">1. Manual CSV Loader</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">
                            Upload restaurant feedback in bulk with duplicate validation routines to protect production integrity.
                          </p>
                        </div>

                        <textarea
                          placeholder={`branch_name,reviewer_name,rating,review_date,comment,dishes
Almaty Dostyk Gourmet,Sanzhar Aliev,5,2026-06-21,"The hot meat was unbelievable, great service!","Бешбармак;Бауырсақ"
Almaty Dostyk Gourmet,Danial Khan,2,2026-06-21,"Manty were extremely dry and late!","Манты"`}
                          rows={6}
                          value={csvRawText}
                          onChange={(e) => setCsvRawText(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-accent"
                        />

                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="text-[9px] text-slate-450 font-medium font-mono max-w-[200px] leading-tight">
                            * fields: branch_name, reviewer_name, rating, review_date, comment, dishes
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCsvRawText(`branch_name,reviewer_name,rating,review_date,comment,dishes
Almaty Dostyk Gourmet,Medet Omarov,5,2026-06-21,"Amazing hospitality Almaty style. Beshbarmak and Kazy were very fresh!","Бешбармак;Қазы"
Almaty Dostyk Gourmet,Aigerim S,1,2026-06-21,"Baursaks took 40 minutes and server was inattentive!","Бауырсақ"`);
                              }}
                              className="px-2.5 py-1.5 text-[10px] bg-slate-150 text-slate-650 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition font-bold"
                            >
                              Load Template
                            </button>
                            
                            <button
                              type="button"
                              onClick={handleCsvUploader}
                              disabled={!csvRawText || !!uploadTaskId}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50"
                            >
                              {uploadTaskId ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3 w-3" />
                                  Submit
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Progress feedback */}
                        {taskProgress && (
                          <div className="bg-slate-150 p-3 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
                            <div className="flex justify-between items-center text-slate-750 text-[10px]">
                              <span>Broker task: <span className={`font-bold ${taskProgress.status === 'completed' ? 'text-emerald-700' : 'text-amber-600'}`}>{taskProgress.status.toUpperCase()}</span></span>
                              <span>Progress: {taskProgress.progress}%</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-1 w-full bg-slate-250 rounded-full overflow-hidden">
                              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${taskProgress.progress}%` }}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-slate-500 text-[10px] pt-0.5">
                              <div>✓ Added: <span className="text-slate-950 font-bold">{taskProgress.addedCount}</span></div>
                              <div>✗ Duplicates: <span className="text-slate-950 font-bold">{taskProgress.duplicateCount}</span></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Google Drive Integration */}
                      <div className="space-y-3 lg:border-l lg:border-slate-200 lg:pl-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">2. Google Drive Cloud Sync Hub</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">
                            Directly link Google Drive accounts, search review spreadsheets, inspect layouts, and sync reviews or waitstaff rosters.
                          </p>
                        </div>

                        <DriveImporter 
                          onImportCsv={handleDriveImport} 
                          onImportStaff={handleDriveImportStaff}
                          onAuthChange={(isLoggedIn, user, token) => {
                            setGoogleDriveConnected(isLoggedIn);
                            setGoogleDriveUser(user);
                          }}
                          isProcessing={!!uploadTaskId} 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Today's Summary Card (KPI Bento block with Sparklines - Light slate, highly polished cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* KPI 1 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between hover:border-accent/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 opacity-5 scale-90 group-hover:scale-100 group-hover:opacity-10 transition-transform duration-300 text-accent">
                  <MessageSquare className="h-24 w-24" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Total reviews</p>
                    <h3 className="text-3xl font-serif font-medium text-slate-900 mt-1">{totalReviewsCount} <span className="text-[11px] text-slate-450 font-sans font-medium">aggregate</span></h3>
                  </div>
                  <div className="p-2.5 bg-accent/5 rounded-xl border border-accent/10">
                    <MessageSquare className="h-4.5 w-4.5 text-accent" />
                  </div>
                </div>
                
                {/* Micro Sparkline */}
                <div className="h-11 w-full mt-4 flex items-end">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockSparklineData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0052FF" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0052FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#0052FF" strokeWidth={1.8} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-accent font-mono mt-3 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+18% growth vs last week</span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between hover:border-accent/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 opacity-5 scale-90 group-hover:scale-100 group-hover:opacity-10 transition-transform duration-300 text-amber-500">
                  <Star className="h-24 w-24" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Average rating</p>
                    <h3 className="text-3xl font-serif font-medium text-slate-900 mt-1">{averageRating} <span className="text-[11px] text-slate-450 font-sans font-medium">/ 5.0</span></h3>
                  </div>
                  <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                  </div>
                </div>

                {/* Micro Sparkline */}
                <div className="h-11 w-full mt-4 flex items-end">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratingSparklineData}>
                      <defs>
                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#d97706" strokeWidth={1.8} fillOpacity={1} fill="url(#colorRating)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-mono mt-3 font-semibold">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-600" />
                  <span> waiter standard is extremely high</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-850 flex flex-col justify-between hover:border-rose-500/30 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "16px 16px"
                  }}
                />

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Unresolved Intercepts</p>
                    <h3 className="text-3xl font-serif font-medium text-rose-500 mt-1">{unansweredAlertsCount} <span className="text-[11px] text-rose-450 font-sans font-medium">urgent</span></h3>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                  </div>
                </div>

                {/* Simulated alerts detail sparkline list */}
                <div className="h-11 w-full mt-4 flex items-center justify-around gap-1.5 px-3 bg-slate-900/60 rounded-xl border border-slate-850/50">
                  {reviews.slice(0, 5).map((r, idx) => (
                    <span 
                      key={idx} 
                      className={`h-4.5 w-1.5 rounded-full transform hover:scale-125 transition-transform ${
                        r.rating <= 2 ? 'bg-rose-500' : r.rating === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    ></span>
                  ))}
                  <span className="text-[8px] font-mono text-slate-500 font-semibold ml-2">buffer queue</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono mt-3 font-semibold">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{unansweredAlertsCount} pending logs flagged in webhook</span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between hover:border-accent/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 opacity-5 scale-90 group-hover:scale-100 group-hover:opacity-10 transition-transform duration-300 text-teal-600">
                  <Users className="h-24 w-24" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Response Rate</p>
                    <h3 className="text-3xl font-serif font-medium text-slate-900 mt-1">{responseRate}%</h3>
                  </div>
                  <div className="p-2.5 bg-teal-500/5 rounded-xl border border-teal-500/10">
                    <Users className="h-4.5 w-4.5 text-teal-600" />
                  </div>
                </div>

                <div className="relative pt-4 mt-2">
                  <div className="flex mb-1.5 items-center justify-between text-[11px]">
                    <div className="text-slate-450 font-medium font-semibold">Answers Replied</div>
                    <div className="text-right text-accent font-mono font-bold">{answeredReviewsCount} / {totalReviewsCount}</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 border border-slate-200">
                    <div style={{ width: `${responseRate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-teal-600 font-mono mt-3 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>~12s auto GenAI draft writing</span>
                </div>
              </div>
            </div>

            {/* Bento Grid Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Card A: Live Reviews & AI Editor (Bento span: 7) - Elegant glassmorphic card base */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 flex flex-col h-[700px] shadow-sm">
                
                {/* Header controls list */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 shrink-0">
                  <div>
                    <h3 className="text-xs font-bold uppercase font-mono text-slate-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent animate-gentle-pulse"></span>
                      Card A: Live Review Feed
                    </h3>
                    <p className="text-xs text-slate-450 mt-0.5 font-medium">Click a review line to open the AI Tone Tuner editor.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter review content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-205 rounded-lg text-xs focus:outline-none focus:border-accent text-slate-800 w-44"
                      />
                    </div>
                    
                    <select
                      value={selectedUrgencyFilter}
                      onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-205 rounded-lg text-xs py-1.5 px-2 focus:outline-none focus:border-accent text-slate-700"
                    >
                      <option value="all">All Urgency</option>
                      <option value="high">Urgent Alert</option>
                      <option value="low">Standard</option>
                    </select>
                  </div>
                </div>

                {/* Active review feed lists */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                  {filteredReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 font-mono text-xs gap-2">
                      <AlertTriangle className="h-5 w-5 text-slate-300" />
                      No reviews match search parameters.
                    </div>
                  ) : (
                    filteredReviews.map((r) => {
                      const matchedStaff = staff.find(s => s.id === r.staff_id);
                      return (
                        <motion.div
                          key={r.id}
                          layout
                          onClick={() => handleReviewClick(r)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                            selectedReview?.id === r.id 
                              ? 'bg-slate-50 border-accent shadow-sm ring-1 ring-accent/10' 
                              : r.urgency === 'high' && !r.is_answered
                                ? 'bg-rose-50/50 border-rose-200 hover:bg-slate-50'
                                : 'bg-white border-slate-200/70 hover:bg-slate-50/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                                r.platform === '2GIS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                r.platform === 'Google' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                'bg-amber-50 text-amber-750 border border-amber-100'
                              }`}>
                                {r.platform}
                              </span>
                              
                              <span className="text-slate-800 text-xs font-bold">{r.reviewer_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{r.review_date}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} 
                                  id={`star-r-${r.id}-${i}`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-slate-650 leading-relaxed mt-2.5 italic">
                            &quot;{r.comment}&quot;
                          </p>

                          {/* Dishes liked or disliked flags */}
                          {r.dishes_feedback && r.dishes_feedback.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {r.dishes_feedback.map((df, idx) => (
                                <span 
                                  key={idx} 
                                  className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                    df.liked 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-rose-50 text-rose-750 border border-rose-100'
                                  }`}
                                  id={`dish-feedback-${r.id}-${idx}`}
                                >
                                  {df.liked ? <ThumbsUp className="h-2 w-2" /> : <ThumbsDown className="h-2 w-2" />}
                                  {df.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2.5 text-[10px] font-mono">
                            <span className="text-slate-400 flex items-center gap-1">
                              Server: <span className="text-slate-700 font-semibold">{matchedStaff?.first_name || 'General Kitchen'}</span>
                            </span>
                            
                            <span className={`font-bold uppercase ${r.is_answered ? 'text-emerald-650' : 'text-rose-600 animate-pulse'}`}>
                              {r.is_answered ? '✓ ANSWERED' : '⚠️ UNANSWERED PENDING'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tone Tuner & AI Reply Editor (opens as detailed companion on the right half or drawer inside grid) */}
              <div className="lg:col-span-5 space-y-6" id="b2b-tone-tuner-companion">
                
                {/* Tone Tuner Side Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 h-[700px] flex flex-col justify-between shadow-sm relative overflow-hidden">
                  {selectedReview ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[9px] font-mono text-accent uppercase tracking-widest font-bold">REPUTATION TUNING ENGINE</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Replying to {selectedReview.reviewer_name}</h4>
                          </div>
                          
                          <button
                            onClick={() => setSelectedReview(null)}
                            className="text-[10px] font-mono text-slate-400 hover:text-slate-800 font-semibold uppercase tracking-wider"
                          >
                            [Deselect]
                          </button>
                        </div>

                        {/* Summary of what they said */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-550 leading-relaxed space-y-1.5 shadow-inner">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded font-mono text-[8px] bg-slate-200 text-slate-600 font-bold uppercase">Original Comment</span>
                            <span className="text-amber-600 font-bold font-mono">{selectedReview.rating}★ rating</span>
                          </div>
                          <p className="italic font-medium text-slate-650">&quot;{selectedReview.comment}&quot;</p>
                        </div>

                        {/* Kazakh cultural tone models */}
                        <div className="space-y-2 pt-1 pb-1">
                          <label className="text-[10px] font-mono text-slate-500 font-bold flex items-center justify-between font-bold">
                            <span>🎭 SELECT CULTURAL TONE MODEL:</span>
                            <span className="text-accent uppercase font-bold text-[11px]">{toneTuner} Mode</span>
                          </label>

                          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-205">
                            {[
                              { key: 'Formal' as const, title: 'Құрметті', desc: 'Formal' },
                              { key: 'Warm' as const, title: 'Бауырсақ', desc: 'Warm' },
                              { key: 'Bilingual' as const, title: 'Коктейль', desc: 'Bilingual' }
                            ].map((tone) => (
                              <button
                                key={tone.key}
                                onClick={() => handleToneChange(tone.key)}
                                className={`py-1.5 text-center rounded-lg transition-all duration-300 flex flex-col justify-center items-center ${
                                  toneTuner === tone.key
                                    ? 'bg-gradient-to-r from-accent to-accent-secondary text-white font-bold shadow-sm'
                                    : 'hover:bg-slate-205 text-slate-500 hover:text-slate-900 font-semibold'
                                }`}
                              >
                                <span className="text-xs leading-none">{tone.title}</span>
                                <span className={`text-[8px] ${toneTuner === tone.key ? 'text-white/80' : 'text-slate-450'} mt-1`}>{tone.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive draft editor */}
                        <div className="space-y-2 pt-1 flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono text-slate-550 font-bold flex items-center gap-1 uppercase">
                              <Sparkles className="h-3.5 w-3.5 text-accent animate-gentle-pulse" />
                              B2B Refactored AI response draft:
                            </label>

                            {isGeneratingDraft && (
                              <span className="text-[10px] font-mono text-accent flex items-center gap-1 animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Generating draft...
                              </span>
                            )}
                          </div>

                          <textarea
                            value={activeDraftText}
                            onChange={(e) => setActiveDraftText(e.target.value)}
                            className="w-full flex-1 bg-slate-50 border border-slate-205 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-sans focus:outline-none focus:border-accent focus:bg-white transition-colors duration-200"
                            rows={6}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(activeDraftText, selectedReview.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black font-semibold text-xs transition px-3 shadow-sm hover:shadow-md animate-glow-soft"
                          >
                            {copiedReviewId === selectedReview.id ? (
                              <>
                                <Check className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                                Copied Draft!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy response
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleSaveDraft}
                            disabled={submittingManualAnswer}
                            className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-secondary text-white font-bold rounded-xl hover:shadow-accent-sm hover:opacity-95 text-xs transition disabled:opacity-50"
                          >
                            {submittingManualAnswer ? 'Publishing...' : 'Publish Answer'}
                          </button>
                        </div>

                        {selectedReview.platform === '2GIS' ? (
                          <a
                            href="https://2gis.kz/almaty"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex justify-center items-center gap-1.5 w-full text-[10px] text-accent hover:underline font-mono text-center font-bold"
                          >
                            Post directly to 2GIS Business Panel (External link)
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <a
                            href="https://business.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex justify-center items-center gap-1.5 w-full text-[10px] text-accent hover:underline font-mono text-center font-bold"
                          >
                            Post directly on Google Business Console (External link)
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                      {/* Large Decorative Elements: quote mark & elegant icon offset */}
                      <span className="absolute text-[120px] font-serif text-slate-100 top-0 left-4 leading-none select-none pointer-events-none">&ldquo;</span>
                      <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center relative z-10 shadow-sm animate-gentle-bob">
                        <Sliders className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-sm font-bold text-slate-900 font-serif">No Review Selected</h4>
                        <p className="text-xs text-slate-450 max-w-xs mx-auto mt-1 leading-relaxed font-semibold">
                          Click on any review card in Card A to activate the B2B AI Tone Tuner response generation mechanism inside the smart buffer.
                        </p>
                      </div>

                      <div className="border border-slate-200 bg-slate-50 p-4.5 rounded-2xl text-left text-[11px] font-mono text-slate-550 w-full relative z-10 shadow-inner">
                        <div className="font-bold text-accent mb-1 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          <Sparkles className="h-3.5 w-3.5" />
                          Almaty localized demo:
                        </div>
                        &quot;Привет, Medet! Көп рахмет за визит! 😍 Приятно, что Бешбармак зашел на ура! Обязательно күтеміз вас снова в Qazaq Gourmet!&quot;
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bento row Containing Card B, Card C, Card D */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Card B: Staff QR Leaderboard (Bento span: 4) */}
              <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-5 h-[530px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase font-mono text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        Card B: Staff QR Performance
                      </h3>
                      <div className="text-[11px] text-slate-450 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>Rating tracked via scanned Smart QR.</span>
                        {googleDriveConnected ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono border border-emerald-500/20 leading-none">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                            Drive Sync Active
                          </span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => setIsCsvConsoleOpen(true)} 
                            className="text-accent underline text-[9px] font-mono hover:text-accent/80 transition leading-none pointer-events-auto"
                          >
                            Sync from Google Sheet
                          </button>
                        )}
                      </div>
                    </div>
                    <Users className="h-4 w-4 text-amber-400" />
                  </div>

                  {/* Leaderboard list container */}
                  <div className="space-y-4 mt-4 overflow-y-auto max-h-[350px] pr-1">
                    {staff.map((employee, idx) => (
                      <div 
                        key={employee.id} 
                        onClick={() => {
                          setSelectedStaffForQrId(employee.id);
                          setSimSelectedQrUuid(employee.qr_code_uuid);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
                          employee.id === selectedStaffForQrId 
                            ? 'bg-slate-950 border border-slate-800' 
                            : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-500 w-4">#{idx + 1}</span>
                          <div className="relative">
                            <img 
                              src={employee.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"} 
                              alt={employee.first_name} 
                              className="h-9 w-9 rounded-full object-cover border border-slate-850"
                            />
                            {employee.is_active ? (
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                            ) : (
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-slate-600 border-2 border-slate-950"></span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1">
                              {employee.first_name}
                              {employee.id === 's1' && <span className="text-[8px] tracking-wide uppercase bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-mono font-normal">top waiter</span>}
                            </h4>
                            <p className="text-[10px] text-slate-500">{employee.role}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-bold font-mono text-white">{employee.average_rating || 5.0}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono">{employee.review_count || 0} reviews scanned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400 mt-2">
                  💡 Tip: Click on a staff member above to automatically load their customized QR tent card generator.
                </div>
              </div>

              {/* Card C: Menu Sentiment BCG Matrix Heatmap (Bento span: 4) */}
              <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-4 h-[530px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase font-mono text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                        Card C: Item Sentiment BCG
                      </h3>
                      <div className="text-[11px] text-slate-450 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>BCG classification based on mentions.</span>
                        {googleDriveConnected ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono border border-emerald-500/20 leading-none">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                            Drive Sync Active
                          </span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => setIsCsvConsoleOpen(true)} 
                            className="text-accent underline text-[9px] font-mono hover:text-accent/80 transition leading-none pointer-events-auto"
                          >
                            Sync Dish Items
                          </button>
                        )}
                      </div>
                    </div>
                    <Utensils className="h-4 w-4 text-emerald-400" />
                  </div>

                  {/* Category switcher */}
                  <div className="flex flex-wrap gap-1 pt-3">
                    {['All', 'Stars', 'Hidden Gems', 'Problems', 'Outsiders'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedBcgCategory(cat)}
                        className={`px-2 py-1 text-[9px] font-mono rounded transition-all duration-300 ${
                          selectedBcgCategory === cat
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* List of items categorized by matrix */}
                  <div className="space-y-3 mt-4 overflow-y-auto max-h-[290px] pr-1">
                    {filteredBCGMetrics.map((dishMetric) => (
                      <div 
                        key={dishMetric.dish_name} 
                        className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-center justify-between transition hover:border-slate-750"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{dishMetric.dish_name}</h4>
                            <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded-full ${
                              dishMetric.category === 'Stars' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              dishMetric.category === 'Hidden Gems' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              dishMetric.category === 'Problems' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {dishMetric.category}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono mt-1">{dishMetric.mentions} customer rating tags</p>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-mono font-bold ${
                            dishMetric.positive_percentage >= 70 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {dishMetric.positive_percentage}% Positive
                          </span>
                          
                          {/* Mini Progress Line */}
                          <div className="w-18 bg-slate-850 h-1 rounded-full mt-1.5 overflow-hidden ml-auto">
                            <div 
                              className={`h-full ${dishMetric.positive_percentage >= 70 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                              style={{ width: `${dishMetric.positive_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-850 bg-slate-950/40 p-2.5 rounded-lg text-[9px] font-mono text-slate-400 leading-normal flex items-center gap-2">
                  <span className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Problems alert</span>
                  <span>Items like cold Manty are automatically flagged to alert the head chef from incoming reviews.</span>
                </div>
              </div>

              {/* Card D: QR Generator Console (Bento span: 4) */}
              <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-5 h-[530px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase font-mono text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                        Card D: Smart QR Deck Tent
                      </h3>
                      <p className="text-xs text-slate-400">Custom waitstaff QR feedback card constructor.</p>
                    </div>
                    <QrCode className="h-4 w-4 text-indigo-400" />
                  </div>

                  <div className="space-y-3 mt-4">
                    <label className="text-[11px] font-mono text-slate-300">SELECT waiter/server:</label>
                    <select
                      value={selectedStaffForQrId}
                      onChange={(e) => {
                        setSelectedStaffForQrId(e.target.value);
                        const matched = staff.find(s => s.id === e.target.value);
                        if (matched) setSimSelectedQrUuid(matched.qr_code_uuid);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl text-xs p-2.5 focus:outline-none focus:border-emerald-500 text-slate-300 font-medium"
                    >
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name} ({s.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Stylized feedback card mockup SVG */}
                  <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-850 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"></div>
                    
                    <div>
                      <h4 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Qazaq Gourmet Group</h4>
                      <p className="text-xs font-bold text-white mt-0.5">Rate {activeQrStaff.first_name}&apos;s Service</p>
                    </div>

                    {/* Highly stylish custom SVG QR Mockup with embedding capability */}
                    <div className="bg-white p-2.5 rounded-xl">
                      <svg 
                        id={`qr-svg-${activeQrStaff.id}`}
                        width="110" 
                        height="110" 
                        viewBox="0 0 100 100" 
                        className="bg-white"
                      >
                        {/* QR Corners */}
                        <rect x="5" y="5" width="25" height="25" fill="#020617" rx="4" />
                        <rect x="9" y="9" width="17" height="17" fill="#ffffff" rx="2" />
                        <rect x="13" y="13" width="9" height="9" fill="#10b981" rx="1" />

                        <rect x="70" y="5" width="25" height="25" fill="#020617" rx="4" />
                        <rect x="74" y="9" width="17" height="17" fill="#ffffff" rx="2" />
                        <rect x="78" y="13" width="9" height="9" fill="#10b981" rx="1" />

                        <rect x="5" y="70" width="25" height="25" fill="#020617" rx="4" />
                        <rect x="9" y="74" width="17" height="17" fill="#ffffff" rx="2" />
                        <rect x="13" y="78" width="9" height="9" fill="#10b981" rx="1" />

                        {/* stylized matrix bytes pattern */}
                        <g fill="#020617">
                          {/* Random pixels simulating a QR pattern */}
                          <rect x="35" y="10" width="5" height="10" />
                          <rect x="45" y="5" width="10" height="5" />
                          <rect x="60" y="15" width="5" height="15" />
                          <rect x="35" y="25" width="15" height="5" />
                          
                          <rect x="10" y="35" width="10" height="5" />
                          <rect x="5" y="45" width="15" height="10" />
                          <rect x="25" y="35" width="5" height="20" />
                          
                          <rect x="35" y="40" width="15" height="15" fill="#4f46e5" />
                          <rect x="55" y="35" width="10" height="10" />
                          <rect x="55" y="50" width="15" height="10" />
                          
                          <rect x="75" y="35" width="15" height="5" />
                          <rect x="80" y="45" width="5" height="15" />
                          <rect x="90" y="55" width="5" height="10" />

                          <rect x="35" y="70" width="10" height="5" />
                          <rect x="40" y="80" width="15" height="10" />
                          <rect x="60" y="75" width="5" height="15" />
                          <rect x="80" y="70" width="15" height="5" />
                          <rect x="75" y="80" width="10" height="10" />
                        </g>

                        {/* Tiny embedded branding symbol inside the QR code center for high design polish */}
                        <rect x="42" y="42" width="16" height="16" fill="#ffffff" rx="3" />
                        <circle cx="50" cy="50" r="5" fill="#10b981" />
                      </svg>
                    </div>

                    <div className="font-mono text-[9px] text-slate-500">
                      UUID: {activeQrStaff.qr_code_uuid.substring(0, 16)}...
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSimSelectedQrUuid(activeQrStaff.qr_code_uuid);
                      setActiveTab('guest-simulator');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white hover:bg-slate-750 font-bold rounded-lg text-xs transition px-3"
                  >
                    <Eye className="h-4 w-4 text-emerald-400" />
                    Preview in Simulator
                  </button>

                  <button
                    onClick={() => handleDownloadQrSvg(activeQrStaff)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-lg text-xs transition px-3 shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    SVG
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          
          /* Guest-Facing Smart Buffer Mobile View (Simulated/Preview Route inside the applet) */
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">CLIENT SMART BUFFER SIMULATOR</span>
              <h2 className="text-xl font-bold tracking-tight text-white">Guest Mobile QR Landing Panel</h2>
              <p className="text-xs text-slate-400">
                This simulates what the guest experiences when scanning the waiter QR tent card on their phone.
              </p>
            </div>

            {/* Quick selectors to toggle scanning as Sanzhar or Ainur */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <label className="text-[11px] font-mono block text-slate-400 text-center uppercase">Currently Scanning Waiter:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Sanzhar (Almaty branch)', uuid: 'sanzhar-qr-7777-8888' },
                  { name: 'Ainur (Almaty branch)', uuid: 'ainur-qr-2222-3333' }
                ].map(w => (
                  <button
                    key={w.uuid}
                    onClick={() => {
                      setSimSelectedQrUuid(w.uuid);
                      setSimResult(null);
                      setSimComment('');
                      setSimRating(5);
                    }}
                    className={`py-2 px-3 text-[11px] rounded-lg border text-center transition-all ${
                      simSelectedQrUuid === w.uuid 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated smartphone container */}
            <div className="bg-slate-900 rounded-[35px] border-4 border-slate-800 shadow-2xl p-6 relative overflow-hidden ring-1 ring-slate-800">
              
              {/* Phone ear speaker notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4.5 w-24 bg-slate-800 rounded-full flex items-center justify-center">
                <span className="h-1 w-8 bg-slate-900 rounded-full"></span>
              </div>

              {/* Simulated screen status bar */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 mb-6">
                <span>Almaty Network</span>
                <span>LTE 100% 🔋</span>
              </div>

              {simStaffMeta ? (
                <div className="space-y-6">
                  
                  {/* Waiter Card */}
                  <div className="text-center space-y-3 bg-slate-950/60 p-4.5 rounded-2xl border border-slate-850 relative">
                    <img
                      src={simStaffMeta.staff.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"}
                      alt={simStaffMeta.staff.first_name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-amber-500/50 mx-auto"
                    />

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Your server today at Qazaq Gourmet</p>
                      <h3 className="text-base font-bold text-white mt-0.5">{simStaffMeta.staff.first_name}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Branch: <span className="text-white font-medium">{simStaffMeta.branch.name}</span></p>
                    </div>
                  </div>

                  {!simResult ? (
                    <form onSubmit={handleGuestSubmit} className="space-y-6">
                      
                      {/* Rating selection (1-5 Stars) */}
                      <div className="space-y-3">
                        <label className="text-center block text-xs font-mono text-slate-350 uppercase">Rate your overall experience:</label>
                        <div className="flex justify-center items-center gap-3">
                          {[1, 2, 3, 4, 5].map((starIdx) => (
                            <button
                              key={starIdx}
                              type="button"
                              onClick={() => setSimRating(starIdx)}
                              className="focus:outline-none transform hover:scale-125 transition-transform"
                            >
                              <Star 
                                className={`h-8.5 w-8.5 ${
                                  starIdx <= simRating 
                                    ? 'text-amber-400 fill-amber-450 stroke-[1.5]' 
                                    : 'text-slate-700'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                        <div className="text-center text-[11px] font-mono font-bold text-amber-400 uppercase mt-1">
                          {simRating === 5 && 'Excellent - Best Waiter! ✨'}
                          {simRating === 4 && 'Good quality meal! 🍲'}
                          {simRating === 3 && 'Average service 😐'}
                          {simRating === 2 && 'Needs serious correction 🚨'}
                          {simRating === 1 && 'Critical issue! ⚠️'}
                        </div>
                      </div>

                      {/* Menuized dishes item feedback toggle */}
                      <div className="space-y-3">
                        <label className="text-xs font-mono text-slate-350 block uppercase text-center border-t border-slate-850 pt-3">
                          Rate dishes you had today (Thumbs Up/Down):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {simDishes.map((dish, idx) => (
                            <div key={dish.name} className="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-850 text-xs">
                              <span className="text-slate-300 font-bold">{dish.name}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...simDishes];
                                    updated[idx].liked = true;
                                    setSimDishes(updated);
                                  }}
                                  className={`p-1.5 rounded-lg border transition ${
                                    dish.liked 
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                      : 'bg-slate-900 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...simDishes];
                                    updated[idx].liked = false;
                                    setSimDishes(updated);
                                  }}
                                  className={`p-1.5 rounded-lg border transition ${
                                    !dish.liked 
                                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                                      : 'bg-slate-900 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conditional input fields based on rating */}
                      <div className="space-y-3">
                        <label className="text-xs font-mono text-slate-350 block uppercase text-center border-t border-slate-850 pt-3">
                          {simRating >= 4 ? 'Your comments (Optional)' : 'What went wrong? Tell us internally:'}
                        </label>
                        <textarea
                          placeholder={
                            simRating >= 4 
                              ? "Optional comment..." 
                              : "Our manager will see this immediately and head to your table right now to correct the issue."
                          }
                          rows={3}
                          value={simComment}
                          onChange={(e) => setSimComment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-amber-450"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-350 block">Your Name:</label>
                        <input
                          type="text"
                          placeholder="Your Name (e.g., Daniyar)"
                          value={simReviewerName}
                          onChange={(e) => setSimReviewerName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={simSubmitting}
                        className={`w-full py-3.5 text-slate-950 rounded-2xl font-bold text-xs shadow-lg transition-transform hover:scale-101 duration-300 ${
                          simRating >= 4 ? 'bg-amber-500 hover:bg-amber-400' : 'bg-rose-500 hover:bg-rose-400 text-white'
                        }`}
                      >
                        {simSubmitting ? (
                          <span className="flex items-center justify-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Sending...
                          </span>
                        ) : simRating >= 4 ? (
                          'SUBMIT & CONTINUE TO 2GIS'
                        ) : (
                          'SEND ALERT & RETRIEVE MANAGER'
                        )}
                      </button>
                    </form>
                  ) : (
                    
                    /* Condition rendering path outputs - Task 2.2 */
                    <div className="space-y-5">
                      {simRating >= 4 ? (
                        /* POSITIVE FLOW: Show local AI response copy widget and Google/2GIS redirects */
                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-850 space-y-4">
                          <div className="text-center space-y-1">
                            <span className="text-emerald-400 text-3xl">💝</span>
                            <h4 className="text-sm font-bold text-white uppercase font-mono tracking-tight">Köp raхmet! Thank you!</h4>
                            <p className="text-[11px] text-slate-400">
                              Based on your selection, Sarap.ai generated a beautiful review draft for you to submit to Google / 2GIS is 1 click:
                            </p>
                          </div>

                          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 italic leading-relaxed relative">
                            &quot;{simResult.review.comment || 'Everything was magnificent!'}&quot;
                            <div className="font-mono text-[9px] text-slate-500 text-right mt-2">&mdash; Generated AI Draft</div>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => copyToClipboard(simComment || 'Everything was magnificent!', 'sim-clip')}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition"
                            >
                              <Copy className="h-4 w-4 text-emerald-400" />
                              Copy Feed to clipboard
                            </button>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <a
                                href={simResult.links.two_gis}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-4 bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-[11px] hover:bg-emerald-400"
                              >
                                Post to 2GIS 🗺️
                              </a>
                              <a
                                href={simResult.links.google_maps}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-4 bg-sky-500 text-slate-950 font-extrabold rounded-xl text-[11px] hover:bg-sky-450"
                              >
                                Post to Google Maps 📍
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* NEGATIVE BUFFER CRITICAL INTERCEPT FLOW: Show polite intercept notification */
                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-rose-950/40 text-center space-y-4">
                          <div className="h-12 w-12 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto text-rose-500">
                            <AlertTriangle className="h-6 w-6" />
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wide">Мы дико извиняемся!</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Thank you for letting us know! To keep our reputable hospitality high, we have logged this internally.
                            </p>
                          </div>

                          <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-xs text-rose-200">
                            &quot;Our Manager has been paged immediately via Telegram and is heading directly to your table right now to resolve this.&quot;
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono italic">
                            * Notice: Public directories like Google Maps/2GIS have been buffered to prevent immediate negative reviews before corrective actions are attempted.
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSimResult(null);
                          setSimComment('');
                        }}
                        className="w-full py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:text-white hover:bg-slate-750 transition"
                      >
                        Reset Simulator & Try another submission
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-xs text-slate-500 py-12">
                  Scanning QR frame...
                </div>
              )}

              {/* simulated smartphone home bar */}
              <div className="h-1 w-28 bg-slate-800 rounded-full mx-auto mt-6"></div>

            </div>
          </div>
        )}
      </main>

      {/* Add Staff modal */}
      <AnimatePresence>
        {showAddStaffModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold uppercase font-mono text-white">Register Waiter / Staff</h3>
                <p className="text-xs text-slate-400">Generate a unique feedback QR Code URL instantly.</p>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Staff First Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="Sanzhar, Ainur, Meerim etc..."
                    value={customStaffName}
                    onChange={(e) => setCustomStaffName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Waiter Role:</label>
                  <input
                    type="text"
                    placeholder="Senior Server, Waitress, Cashier..."
                    value={customStaffRole}
                    onChange={(e) => setCustomStaffRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Active Branch Location:</label>
                  <select
                    value={customStaffBranchId}
                    onChange={(e) => setCustomStaffBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition"
                  >
                    Generate QR Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Corporate B2B Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] text-slate-500 shrink-0">
        <div>
          <span>SARAP.AI REPUTATION MONITORING SYSTEM VERSION 4.2.1-PRO &bull; © 2026</span>
        </div>
        <div className="flex gap-4">
          <span className="text-slate-400 hover:text-white cursor-pointer hover:underline">[Database: In-Memory Node/SQL ORM]</span>
          <span className="text-slate-400 hover:text-white cursor-pointer hover:underline">[Central Asian Sentiment Parser Enabled]</span>
        </div>
      </footer>

    </div>
  );
}
