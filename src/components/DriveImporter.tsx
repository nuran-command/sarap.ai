import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, FileText, FolderOpen, LogOut, RefreshCw, 
  Search, AlertCircle, CheckCircle2, User, HardDrive, ArrowDownToLine, Users, HelpCircle
} from 'lucide-react';
import { googleSignIn, logout, initAuth } from '../lib/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

interface DriveImporterProps {
  onImportCsv: (csvContent: string, fileName: string) => void;
  onImportStaff?: (staffList: { first_name: string; role?: string; qualities?: string[] }[], fileName: string) => void;
  onAuthChange?: (isLoggedIn: boolean, user: FirebaseUser | null, token: string | null) => void;
  isProcessing: boolean;
}

export default function DriveImporter({ onImportCsv, onImportStaff, onAuthChange, isProcessing }: DriveImporterProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'sheets' | 'csv'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [importTargetType, setImportTargetType] = useState<'reviews' | 'staff'>('reviews');

  useEffect(() => {
    // Initialize Auth state on load
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        fetchDriveFiles(token);
        if (onAuthChange) onAuthChange(true, currentUser, token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
        if (onAuthChange) onAuthChange(false, null, null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        fetchDriveFiles(result.accessToken);
        if (onAuthChange) onAuthChange(true, result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setErrorMsg('Google Authentication failed or permission was denied.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setFiles([]);
      setSelectedFileForPreview(null);
      setPreviewContent('');
      if (onAuthChange) onAuthChange(false, null, null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchDriveFiles = async (token: string) => {
    if (!token) return;
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      let q = "trashed = false";
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=40&fields=files(id,name,mimeType,modifiedTime,size)&q=${encodeURIComponent(q)}&orderBy=modifiedTime desc`, {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsAuth(true);
          return;
        }
        throw new Error(`Failed to load files from Drive: ${response.statusText}`);
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setErrorMsg(err.message || 'Error communicating with Google Drive API.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handlePreviewFile = async (file: DriveFile) => {
    if (!accessToken) return;
    setSelectedFileForPreview(file);
    setIsLoadingPreview(true);
    setPreviewContent('');
    setErrorMsg(null);

    // Auto-detect targets based on name keywords
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('staff') || lowerName.includes('waiter') || lowerName.includes('employee') || lowerName.includes('roster')) {
      setImportTargetType('staff');
    } else {
      setImportTargetType('reviews');
    }

    try {
      let url = '';
      if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
      } else {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to download preview: ${response.statusText}`);
      }

      const text = await response.text();
      const lines = text.split('\n').slice(0, 10).join('\n');
      setPreviewContent(lines + (text.split('\n').length > 10 ? '\n... (truncated for preview)' : ''));
    } catch (err: any) {
      console.error('Error previewing file:', err);
      setErrorMsg('Could not preview file contents. Make sure public link or shared access permissions are set.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleProcessImport = async (file: DriveFile) => {
    if (!accessToken) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoadingPreview(true);

    try {
      let url = '';
      if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
      } else {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to import file content from Drive: ${response.statusText}`);
      }

      const csvText = await response.text();
      if (!csvText.trim()) {
        throw new Error('This file is empty.');
      }

      if (importTargetType === 'reviews') {
        // Feed into standard review queue
        onImportCsv(csvText, file.name);
        setSuccessMsg(`Extracted feedback reviews from '${file.name}' into broker pipeline!`);
      } else {
        // Sync waitstaff roster
        const lines = csvText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          throw new Error('Waitstaff spreadsheet requires a header and at least one waiter row.');
        }

        const dataLines = lines.slice(1);
        const parsedStaffList: { first_name: string; role?: string; qualities?: string[] }[] = [];
        
        for (const line of dataLines) {
          // Parse columns taking quotes into account
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const clean = matches.map(m => m.replace(/^"|"$/g, '').trim());
          if (clean.length > 0 && clean[0]) {
            const first_name = clean[0];
            const role = clean[1] || 'Waiter';
            const qualitiesRaw = clean[2] || 'Friendly;Polite';
            const qualities = qualitiesRaw.split(';').map(q => q.trim()).filter(q => q.length > 0);
            
            parsedStaffList.push({
              first_name,
              role,
              qualities
            });
          }
        }

        if (parsedStaffList.length === 0) {
          throw new Error('Could not extract any waitstaff records with valid names.');
        }

        if (onImportStaff) {
          onImportStaff(parsedStaffList, file.name);
          setSuccessMsg(`Synchronized ${parsedStaffList.length} waitstaff profiles from '${file.name}' roster!`);
        } else {
          throw new Error('Waitstaff synchronize handler is not initialized.');
        }
      }

      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Error importing file:', err);
      setErrorMsg(err.message || 'Failure extracting document content.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(fileSearchQuery.toLowerCase());
    if (mimeFilter === 'sheets') {
      return matchesSearch && f.mimeType === 'application/vnd.google-apps.spreadsheet';
    }
    if (mimeFilter === 'csv') {
      return matchesSearch && (f.mimeType === 'text/csv' || f.name.toLowerCase().endsWith('.csv'));
    }
    return matchesSearch;
  });

  const getFormatSize = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A';
    const bytes = parseInt(bytesStr);
    if (isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="drive-importer-container" className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
      {needsAuth ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="bg-slate-100 p-3.5 rounded-full text-slate-500 shadow-inner">
            <HardDrive className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Check Reviews on My Google Drive</h4>
            <p className="text-xs text-slate-550 max-w-sm mt-1">
              Access sheets, spreadsheets, or review tables saved in your corporate or personal Drive with permission.
            </p>
          </div>

          <button 
            type="button" 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button hover:bg-slate-100 border border-slate-250 transition-all font-semibold rounded-xl inline-flex items-center justify-center px-4 py-2 text-xs text-slate-700 bg-white"
            style={{ minHeight: '40px', cursor: 'pointer' }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper flex items-center gap-2">
              <div className="gsi-material-button-icon w-5 h-5">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-mono text-[11px] font-bold tracking-tight text-slate-800">
                {isLoggingIn ? 'Connecting...' : 'SIGN IN & LINK GOOGLE DRIVE'}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Google avatar" referrerPolicy="no-referrer" className="h-5 w-5 rounded-full border border-slate-200" />
              ) : (
                <User className="h-5 w-5 text-slate-400" />
              )}
              <div>
                <div className="text-[11px] font-bold text-slate-800 leading-tight">Google Connected</div>
                <div className="text-[9px] text-slate-500 font-mono">{user?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchDriveFiles(accessToken || '')}
                title="Reload files"
                className="p-1 px-2.5 rounded-lg text-[10px] uppercase font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center gap-1 transition"
                type="button"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={handleLogout}
                title="Disconnect"
                className="p-1 px-2 text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition"
                type="button"
              >
                <LogOut className="h-3 w-3" />
                Disconnect
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search file name..." 
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8.5 pr-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-start sm:self-center">
              <button 
                type="button"
                onClick={() => setMimeFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${mimeFilter === 'all' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All
              </button>
              <button 
                type="button"
                onClick={() => setMimeFilter('sheets')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1 ${mimeFilter === 'sheets' ? 'bg-white shadow-xs text-slate-850' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileSpreadsheet className="h-3 w-3 text-emerald-600" />
                Sheets
              </button>
              <button 
                type="button"
                onClick={() => setMimeFilter('csv')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1 ${mimeFilter === 'csv' ? 'bg-white shadow-xs text-slate-850' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="h-3 w-3 text-sky-500" />
                CSV
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-10 text-xs text-slate-500 gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" />
                Searching Google Drive repository...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-1">
                <FolderOpen className="h-6 w-6 opacity-40 text-slate-500" />
                <p className="text-xs font-medium">No spreadsheets or CSV files found.</p>
                <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                  Create a Google Sheet or CSV in your Drive to test the real-time reputation broker sync loops.
                </p>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
                const isSelectedForPreview = selectedFileForPreview?.id === file.id;
                
                return (
                  <div key={file.id} className={`flex items-center justify-between p-2.5 hover:bg-slate-50 transition ${isSelectedForPreview ? 'bg-accent/5' : ''}`}>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isSheet ? (
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="h-5 w-5 text-sky-500 shrink-0" />
                      )}
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex gap-2">
                          <span>Mod: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}</span>
                          <span>&bull;</span>
                          <span>{isSheet ? 'Cloud Sheet' : getFormatSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handlePreviewFile(file)}
                        className={`px-2 py-1 text-[10px] font-semibold border rounded-lg transition ${isSelectedForPreview ? 'bg-accent/10 border-accent/20 text-accent font-bold' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        Inspect
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleProcessImport(file)}
                        disabled={isProcessing}
                        className="px-2.5 py-1 text-[10px] font-extrabold bg-slate-900 border border-slate-750 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition flex items-center gap-1"
                      >
                        <ArrowDownToLine className="h-2.5 w-2.5" />
                        Sync
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 flex items-start gap-2 text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="text-xs leading-normal">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 flex items-start gap-2 text-emerald-850">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <div className="text-xs leading-normal font-semibold">{successMsg}</div>
            </div>
          )}

          {/* Interactive Inspection panel with choice mapping */}
          {selectedFileForPreview && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  INSPECTING: <strong className="text-slate-700 font-bold">{selectedFileForPreview.name}</strong>
                </span>
                <button 
                  type="button"
                  onClick={() => setSelectedFileForPreview(null)}
                  className="text-slate-400 hover:text-slate-650 font-extrabold text-[11px]"
                >
                  ✕ Close
                </button>
              </div>

              {/* Mapper selector to connect all features with drive files */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">Sync Target Destination</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input 
                      type="radio" 
                      name="importTargetType"
                      checked={importTargetType === 'reviews'} 
                      onChange={() => setImportTargetType('reviews')} 
                      className="text-accent focus:ring-accent accent-accent" 
                    />
                    Feedback Reviews (Card A Feed)
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input 
                      type="radio" 
                      name="importTargetType"
                      checked={importTargetType === 'staff'} 
                      onChange={() => setImportTargetType('staff')} 
                      className="text-emerald-600 focus:ring-emerald-500 accent-emerald-600" 
                    />
                    Waitstaff Roster (Card B Leaderboard)
                  </label>
                </div>
                
                {/* Visual guideline on required columns */}
                <div className="text-[9px] text-slate-400 mt-1 font-mono leading-tight bg-slate-50 p-1.5 rounded border border-slate-100">
                  {importTargetType === 'reviews' ? (
                    <span>💡 Expected structure: <strong className="text-slate-600">branch_name, reviewer_name, rating, review_date, comment, dishes</strong></span>
                  ) : (
                    <span>💡 Expected structure: <strong className="text-slate-600 font-bold">first_name, role, qualities</strong> (qualities separate with semi-colons)</span>
                  )}
                </div>
              </div>

              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-5 text-[10px] font-mono text-slate-500 gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin text-accent" />
                  Loading document stream...
                </div>
              ) : (
                <pre className="text-[10px] font-mono bg-slate-150 text-slate-800 p-2.5 rounded-lg overflow-x-auto max-h-32 leading-relaxed select-text whitespace-pre">
                  {previewContent || '* File is empty or could not be loaded *'}
                </pre>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleProcessImport(selectedFileForPreview)}
                  disabled={isProcessing || isLoadingPreview}
                  className="w-full bg-slate-900 hover:bg-slate-850 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 shadow-sm transition"
                >
                  <ArrowDownToLine className="h-3 w-3" />
                  Sync Google Sheet to {importTargetType === 'reviews' ? 'Live Comments' : 'Waiter Leaderboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
