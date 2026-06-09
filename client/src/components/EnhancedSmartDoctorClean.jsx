import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Stethoscope, 
  Heart, 
  Loader2,
  ShieldAlert,
  Clock,
  Pill,
  Brain,
  AlertTriangle,
  Activity,
  Thermometer,
  Eye,
  Zap,
  CheckCircle,
  ArrowRight,
  Clipboard,
  Star,
  Settings,
  Database,
  Cpu,
  Globe,
  Lock,
  Shield,
  Lightbulb,
  FileText,
  Microscope,
  Users,
  TrendingUp,
  Target,
  Award,
  Bookmark,
  Library,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Camera,
  Bell,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  Info,
  MapPin,
  AlertCircle
} from 'lucide-react';

import SmartDoctorChatInterface from './SmartDoctorChatInterface';

const EnhancedSmartDoctorClean = ({ onNavigateToMedicines = null }) => {
  // Section navigation state
  const [activeSection, setActiveSection] = useState('chat');

  // Prescription OCR states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [extractedMedicines, setExtractedMedicines] = useState([]);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // Clear any cached data on component mount
  useEffect(() => {
    setExtractedText('');
    setExtractedMedicines([]);
    setPrescriptionData(null);
    setOcrError('');
  }, []);

  // Medicine Reminders states
  const [reminders, setReminders] = useState([
    {
      id: 1,
      medicine: 'Metformin',
      dosage: '500mg',
      timing: ['Morning', 'Evening'],
      duration: '30 days',
      notes: 'Take with food'
    }
  ]);
  const [newReminder, setNewReminder] = useState({
    medicine: '',
    dosage: '',
    timing: [],
    duration: '',
    notes: ''
  });

  // Section definitions
  const sections = [
    { id: 'chat', name: 'AI Chat', icon: MessageCircle },
    { id: 'prescription', name: 'Prescription OCR', icon: Camera },
    { id: 'reminders', name: 'Medicine Reminders', icon: Bell }
  ];


  // File upload handler with real OCR processing

  // File upload handler with real OCR processing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setUploadedImage(file);
    setExtractedText('');
    setExtractedMedicines([]);
    setPrescriptionData(null);
    setOcrError('');
    setOcrProgress(0);
    setIsExtracting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('prescriptionImage', file);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to use this feature');
      }

      // Upload and process the prescription
      const response = await fetch('/api/smart-doctor/extract-prescription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process prescription');
      }

      const data = await response.json();
      console.log('✅ OCR Response:', data);

      // Update states with extracted data
      setExtractedText(data.rawText || 'No text extracted');
      setExtractedMedicines(data.medicines || []);
      setPrescriptionData(data);
      
      // Show success message
      if (data.medicines && data.medicines.length > 0) {
        alert(`Successfully extracted ${data.medicines.length} medicine(s) from prescription!`);
      }

    } catch (error) {
      console.error('❌ OCR Error:', error);
      setOcrError(error.message);
      setExtractedText('');
      setExtractedMedicines([]);
      setPrescriptionData(null);
    } finally {
      setIsExtracting(false);
      setOcrProgress(100);
    }
  };

  // Add medicine reminder
  const addMedicineReminder = () => {
    if (newReminder.medicine && newReminder.dosage) {
      setReminders([...reminders, { 
        ...newReminder, 
        id: Date.now(),
        timing: newReminder.timing || ['Morning']
      }]);
      setNewReminder({
        medicine: '',
        dosage: '',
        timing: [],
        duration: '',
        notes: ''
      });
    }
  };

  // Delete reminder
  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
      {/* Custom CSS for enhanced scrolling */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header with Welcome Message */}
      <div className="bg-gradient-to-r from-healthcare-green-600 via-purple-600 to-teal-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Stethoscope className="w-7 h-7 mr-3" />
              Smart Doctor AI Assistant
            </h2>
            <p className="text-healthcare-green-100 text-base mt-2">
              Your comprehensive health companion — prescription OCR and medication reminders
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl">🏥</div>
            <div className="text-sm text-healthcare-green-100 mt-1">24/7 Available</div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b dark:border-gray-700 bg-gradient-to-r from-healthcare-green-50 to-purple-50 dark:from-healthcare-green-900/20 dark:to-purple-900/20 sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex flex-col items-center justify-center min-w-[120px] px-6 py-4 m-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeSection === section.id
                    ? 'text-white bg-gradient-to-r from-healthcare-green-600 to-purple-600 shadow-lg transform scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-md'
                }`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-center leading-tight">{section.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-healthcare-green-300 scrollbar-track-gray-100 dark:scrollbar-thumb-healthcare-green-600 dark:scrollbar-track-gray-700">
        
        {/* AI Chat Section */}
        {activeSection === 'chat' && (
          <div className="h-[600px] p-6">
            <SmartDoctorChatInterface />
          </div>
        )}

        {/* Hidden legacy Symptom UI (removed) */}
        {false && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🩺</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                AI Symptom Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                Describe your symptoms in detail and get AI-powered analysis with personalized medicine recommendations.
              </p>
            </div>

            {/* Enhanced Input Section */}
            <div className="bg-gradient-to-br from-green-50 via-teal-50 to-healthcare-green-50 dark:from-green-900/20 dark:via-teal-900/20 dark:to-healthcare-green-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800 shadow-xl">
              <label className="block text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Stethoscope className="w-6 h-6 mr-3 text-green-600" />
                Tell us about your symptoms
              </label>
              
              <div className="relative">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Please describe your symptoms in detail. Be specific about:

• What symptoms are you experiencing? (e.g., headache, fever, nausea)
• When did they start? (e.g., 2 days ago, this morning)
• How severe are they on a scale of 1-10?
• Where exactly do you feel pain or discomfort?
• Any triggers or patterns you've noticed?
• Have you taken any medications already?

Example: 'I have been experiencing a throbbing headache on the right side of my head for the past 2 days. The pain is about 7/10 in severity, especially in the morning. I also have mild nausea and sensitivity to bright lights. I tried taking paracetamol yesterday but it only helped slightly...'"
                  className="w-full h-56 p-6 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-3 focus:ring-green-500/50 focus:border-green-500 resize-none transition-all duration-200 text-base leading-relaxed scrollbar-thin"
                />
                <div className="absolute bottom-4 right-4 flex items-center space-x-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-md">
                    {symptoms.length}/2000 characters
                  </div>
                  {symptoms.length > 50 && (
                    <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-lg shadow-md flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Good detail
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={analyzeSymptoms}
                  disabled={isAnalyzing || !symptoms.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 via-teal-600 to-healthcare-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:via-teal-700 hover:to-healthcare-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] min-h-[56px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-3" />
                      <span>Analyzing Your Symptoms...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-6 h-6 mr-3" />
                      <span>Get AI Medical Analysis</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSymptoms('');
                    setSymptomResults(null);
                  }}
                  className="px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center"
                >
                  <X className="w-5 h-5 mr-2" />
                  Clear All
                </button>
              </div>

              {/* Enhanced Quick Symptom Categories */}
              <div className="mt-8">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">🎯 Quick symptom categories (click to add):</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { category: 'Pain & Aches', symptoms: ['headache', 'muscle aches', 'joint pain', 'back pain'] },
                    { category: 'Respiratory', symptoms: ['cough', 'sore throat', 'runny nose', 'congestion'] },
                    { category: 'Digestive', symptoms: ['nausea', 'stomach pain', 'diarrhea', 'vomiting'] },
                    { category: 'General', symptoms: ['fever', 'fatigue', 'dizziness', 'weakness'] },
                    { category: 'Skin & Allergies', symptoms: ['rash', 'itching', 'swelling', 'hives'] },
                    { category: 'Mental Health', symptoms: ['anxiety', 'stress', 'sleep problems', 'mood changes'] }
                  ].map((group, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{group.category}</h6>
                      <div className="space-y-1">
                        {group.symptoms.map((symptom) => (
                          <button
                            key={symptom}
                            onClick={() => setSymptoms(prev => prev + (prev ? (prev.endsWith('.') ? ' ' : '. ') : '') + `I have ${symptom}`)}
                            className="text-xs w-full text-left px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded transition-colors border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600"
                          >
                            + {symptom}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helpful Tips Section */}
              <div className="mt-6 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-xl p-5 border border-healthcare-green-200 dark:border-healthcare-green-800">
                <h6 className="font-semibold text-healthcare-green-800 dark:text-healthcare-green-300 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  💡 Tips for Better Analysis
                </h6>
                <div className="text-sm text-healthcare-green-700 dark:text-healthcare-green-400 space-y-2">
                  <div className="flex items-start">
                    <span className="w-2 h-2 bg-healthcare-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Be specific:</strong> Instead of "I feel bad," describe exact symptoms like "sharp chest pain when breathing"</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-2 h-2 bg-healthcare-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Include timing:</strong> When symptoms started, how long they last, what makes them better/worse</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-2 h-2 bg-healthcare-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Rate severity:</strong> Use a 1-10 scale to help us understand how much it affects you</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-2 h-2 bg-healthcare-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Mention context:</strong> Recent activities, medications taken, or similar past experiences</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State with Progress */}
            {isAnalyzing && !symptomResults && (
              <div className="bg-gradient-to-br from-healthcare-green-50 to-purple-50 dark:from-healthcare-green-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-healthcare-green-200 dark:border-healthcare-green-800 shadow-xl animate-fadeIn">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-healthcare-green-200 dark:border-healthcare-green-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-healthcare-green-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-healthcare-green-600 animate-pulse" />
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-healthcare-green-800 dark:text-healthcare-green-300 mb-4">
                    🧠 AI Medical Analysis in Progress
                  </h4>
                  
                  <div className="space-y-4 text-left max-w-md mx-auto">
                    <div className="flex items-center space-x-3 text-healthcare-green-700 dark:text-healthcare-green-400">
                      <div className="w-2 h-2 bg-healthcare-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Analyzing your symptom description...</span>
                    </div>
                    <div className="flex items-center space-x-3 text-healthcare-green-700 dark:text-healthcare-green-400">
                      <div className="w-2 h-2 bg-healthcare-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <span className="text-sm">Cross-referencing medical knowledge base...</span>
                    </div>
                    <div className="flex items-center space-x-3 text-healthcare-green-700 dark:text-healthcare-green-400">
                      <div className="w-2 h-2 bg-healthcare-green-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      <span className="text-sm">Generating personalized recommendations...</span>
                    </div>
                    <div className="flex items-center space-x-3 text-healthcare-green-700 dark:text-healthcare-green-400">
                      <div className="w-2 h-2 bg-healthcare-green-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                      <span className="text-sm">Preparing safety guidelines...</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-healthcare-green-100 dark:bg-healthcare-green-900/30 rounded-xl p-4">
                    <p className="text-sm text-healthcare-green-800 dark:text-healthcare-green-300 font-medium">
                      ⚡ Using advanced AI to provide comprehensive medical analysis
                    </p>
                    <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400 mt-1">
                      This typically takes 10-30 seconds for thorough analysis
                    </p>
                  </div>
                </div>
              </div>
            )}
            {symptomResults && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-healthcare-green-50 via-indigo-50 to-purple-50 dark:from-healthcare-green-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-healthcare-green-200 dark:border-healthcare-green-800 shadow-xl">
                  <h4 className="text-2xl font-bold text-healthcare-green-800 dark:text-healthcare-green-300 mb-6 flex items-center">
                    <Brain className="w-7 h-7 mr-3" />
                    🧠 AI Medical Analysis
                  </h4>
                  
                  <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Possible Conditions */}
                    <div className="lg:col-span-1">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center text-lg">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                        🔍 Possible Conditions
                      </h5>
                      <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin pr-2">
                        {symptomResults.possibleConditions?.map((condition, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                            <div className="flex justify-between items-start mb-3">
                              <span className="font-semibold text-gray-900 dark:text-white text-base">{condition.name}</span>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                condition.severity === 'mild' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                condition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {condition.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{condition.description}</p>
                            
                            {condition.commonSymptoms && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Common symptoms:</p>
                                <div className="flex flex-wrap gap-1">
                                  {condition.commonSymptoms.slice(0, 3).map((symptom, i) => (
                                    <span key={i} className="text-xs bg-healthcare-green-100 dark:bg-healthcare-green-900/30 text-healthcare-green-700 dark:text-healthcare-green-300 px-2 py-1 rounded-full">
                                      {symptom}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {condition.typicalDuration && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Duration: {condition.typicalDuration}
                              </p>
                            )}
                            
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-healthcare-green-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${condition.probability}%` }}
                                ></div>
                              </div>
                              <span className="ml-3 text-sm text-healthcare-green-600 dark:text-healthcare-green-400 font-semibold">{condition.probability}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OTC Medicine Recommendations */}
                    <div className="lg:col-span-1">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center text-lg">
                        <Pill className="w-5 h-5 mr-2 text-green-500" />
                        💊 Medicine Recommendations
                      </h5>
                      <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin pr-2">
                        {symptomResults.otcMedicines?.map((medicine, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:scale-[1.02]">
                            <div className="flex justify-between items-start mb-3">
                              <span className="font-semibold text-gray-900 dark:text-white text-base">{medicine.name}</span>
                              <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full font-medium">
                                OTC
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm mb-3">
                              <div className="grid grid-cols-1 gap-2">
                                <p><strong className="text-purple-600 dark:text-purple-400">Dosage:</strong> {medicine.dosage}</p>
                                <p><strong className="text-healthcare-green-600 dark:text-healthcare-green-400">Frequency:</strong> {medicine.frequency}</p>
                                <p><strong className="text-orange-600 dark:text-orange-400">Max Daily:</strong> {medicine.maxDaily}</p>
                                {medicine.purpose && (
                                  <p><strong className="text-green-600 dark:text-green-400">Purpose:</strong> {medicine.purpose}</p>
                                )}
                              </div>
                            </div>

                            {medicine.warnings && medicine.warnings.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1 flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Warnings:
                                </p>
                                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                  {medicine.warnings.map((warning, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {medicine.sideEffects && medicine.sideEffects.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Side effects:</p>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                  {medicine.sideEffects.join(', ')}
                                </div>
                              </div>
                            )}

                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">💰 Available OTC</span>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Recommended</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Red Flags and Emergency Signs */}
                    <div className="lg:col-span-2 xl:col-span-1">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center text-lg">
                        <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
                        ⚠️ Emergency Warning Signs
                      </h5>
                      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-2">
                        {symptomResults.redFlags?.map((flag, index) => (
                          <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-red-800 dark:text-red-300 font-medium leading-relaxed">{flag}</span>
                            </div>
                          </div>
                        ))}
                        
                        <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 mt-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-red-800 dark:text-red-300 text-sm">EMERGENCY ACTION</span>
                          </div>
                          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                            If you experience any of these symptoms, seek immediate medical attention or call emergency services.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Self-Care and Follow-up Advice */}
                  {(symptomResults.selfCareAdvice || symptomResults.followUpAdvice) && (
                    <div className="mt-8 grid md:grid-cols-2 gap-6">
                      {/* Self-Care Advice */}
                      {symptomResults.selfCareAdvice && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                          <h6 className="font-bold text-green-800 dark:text-green-300 mb-4 flex items-center">
                            <Heart className="w-5 h-5 mr-2" />
                            🏠 Self-Care Recommendations
                          </h6>
                          <ul className="space-y-2">
                            {symptomResults.selfCareAdvice.map((advice, index) => (
                              <li key={index} className="text-sm text-green-700 dark:text-green-400 flex items-start">
                                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                {advice}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up Advice */}
                      {symptomResults.followUpAdvice && (
                        <div className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 border border-healthcare-green-200 dark:border-healthcare-green-800 rounded-xl p-6">
                          <h6 className="font-bold text-healthcare-green-800 dark:text-healthcare-green-300 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            📅 Follow-up Guidance
                          </h6>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start">
                              <Clock className="w-4 h-4 mr-2 mt-0.5 text-healthcare-green-600 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-healthcare-green-800 dark:text-healthcare-green-300">When to see a doctor: </span>
                                <span className="text-healthcare-green-700 dark:text-healthcare-green-400">{symptomResults.followUpAdvice.timeframe}</span>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Activity className="w-4 h-4 mr-2 mt-0.5 text-healthcare-green-600 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-healthcare-green-800 dark:text-healthcare-green-300">Urgency level: </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  symptomResults.followUpAdvice.urgency === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  symptomResults.followUpAdvice.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {symptomResults.followUpAdvice.urgency}
                                </span>
                              </div>
                            </div>
                            {symptomResults.followUpAdvice.specialistNeeded && (
                              <div className="flex items-start">
                                <Stethoscope className="w-4 h-4 mr-2 mt-0.5 text-healthcare-green-600 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-healthcare-green-800 dark:text-healthcare-green-300">Specialist: </span>
                                  <span className="text-healthcare-green-700 dark:text-healthcare-green-400">{symptomResults.followUpAdvice.specialistNeeded}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Medical Disclaimer */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>
                      <div>
                        <h6 className="font-bold text-amber-800 dark:text-amber-300 mb-3 text-lg">⚕️ Important Medical Disclaimer</h6>
                        <div className="text-sm text-amber-700 dark:text-amber-400 space-y-2 leading-relaxed">
                          <p>• This AI analysis is for <strong>informational and educational purposes only</strong> and should not replace professional medical advice, diagnosis, or treatment.</p>
                          <p>• Always consult qualified healthcare providers for proper medical evaluation, diagnosis, and personalized treatment plans.</p>
                          <p>• Seek immediate medical attention if you experience any emergency symptoms or if your condition worsens.</p>
                          <p>• Medicine recommendations are general guidelines - consult a pharmacist or doctor before taking any medication, especially if you have allergies or other medical conditions.</p>
                          <p>• This tool does not have access to your complete medical history, current medications, or individual health factors that may affect recommendations.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden legacy Medicine Tracker UI (removed) */}
        {false && (
          <div className="p-6 space-y-6">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-healthcare-green-500" />
                  <p className="text-gray-600 dark:text-gray-400">Loading your personalized medical profile...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-5xl mb-4">🩺</div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Personalized Medicine Tracker
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                    AI analyzes your complete medical profile to provide personalized medicine recommendations, safety alerts, and lifestyle guidance.
                  </p>
                  <button
                    onClick={() => setShowProfileEditor(!showProfileEditor)}
                    className="mt-4 px-6 py-2 bg-healthcare-green-500 hover:bg-healthcare-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {showProfileEditor ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                </div>

                {showProfileEditor && (
                  <ProfileEditorModal
                    userProfile={userProfile}
                    onSave={updatePersonalizedProfile}
                    onCancel={() => setShowProfileEditor(false)}
                    isUpdating={isUpdatingProfile}
                  />
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Medical Profile Overview */}
                  <div className="bg-gradient-to-br from-healthcare-green-50 via-indigo-50 to-purple-50 dark:from-healthcare-green-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-healthcare-green-200 dark:border-healthcare-green-800 shadow-xl">
                    <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <User className="w-7 h-7 mr-3 text-healthcare-green-600" />
                      Medical Profile
                    </h4>
                    
                    <div className="space-y-6">
                      {/* Allergies */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                          Known Allergies
                        </h5>
                        {userProfile.allergies?.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {userProfile.allergies.map((allergy, index) => (
                              <div key={index} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-2 rounded-full text-sm font-medium">
                                ⚠️ {typeof allergy === 'string' ? allergy : allergy.name}
                                {typeof allergy !== 'string' && allergy.severity && (
                                  <span className="ml-1 text-xs">({allergy.severity})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No allergies recorded</p>
                        )}
                      </div>

                      {/* Current Medications */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <Pill className="w-5 h-5 mr-2 text-purple-500" />
                          Current Medications
                        </h5>
                        {userProfile.currentMedications?.length > 0 ? (
                          <div className="space-y-3">
                            {userProfile.currentMedications.map((medication, index) => (
                              <div key={index} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                <div className="font-medium text-purple-800 dark:text-purple-300">
                                  💊 {typeof medication === 'string' ? medication : medication.name}
                                  {typeof medication !== 'string' && medication.dosage && (
                                    <span className="ml-2 text-sm text-purple-600 dark:text-purple-400">
                                      {medication.dosage} - {medication.frequency}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No medications recorded</p>
                        )}
                      </div>

                      {/* Past Diseases & Chronic Conditions */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-green-500" />
                          Medical History
                        </h5>
                        {(userProfile.pastDiseases?.length > 0 || userProfile.chronicConditions?.length > 0) ? (
                          <div className="space-y-2">
                            {userProfile.pastDiseases?.map((disease, index) => (
                              <div key={index} className="flex items-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                                <span className="font-medium">
                                  {typeof disease === 'string' ? disease : disease.name}
                                  {typeof disease !== 'string' && disease.status && (
                                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                                      ({disease.status})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                            {userProfile.chronicConditions?.map((condition, index) => (
                              <div key={index} className="flex items-center bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 flex-shrink-0"></div>
                                <span className="font-medium">
                                  {typeof condition === 'string' ? condition : condition.name}
                                  <span className="ml-2 text-sm text-orange-600 dark:text-orange-400">(chronic)</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No medical history recorded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations & Risk Assessment */}
                  <div className="space-y-6">
                    {/* Drug Interactions */}
                    {drugInteractions?.length > 0 && (
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                          Drug Interaction Warnings
                        </h4>
                        <div className="space-y-3">
                          {drugInteractions.map((interaction, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {interaction.medications?.join(' + ')}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  interaction.severity === 'high' ? 'bg-red-100 text-red-800' :
                                  interaction.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {interaction.severity} severity
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {interaction.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {interaction.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Personalized Recommendations */}
                    {aiRecommendations && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Brain className="w-6 h-6 mr-3 text-green-600" />
                          AI Personalized Recommendations
                        </h4>
                        
                        {aiRecommendations.preventiveCare?.length > 0 && (
                          <div className="mb-6">
                            <h5 className="font-semibold mb-3 text-green-800 dark:text-green-300">🛡️ Preventive Care</h5>
                            <div className="space-y-2">
                              {aiRecommendations.preventiveCare.map((care, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-white">{care.recommendation}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{care.reason}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ml-3 ${
                                      care.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      care.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {care.frequency}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiRecommendations.healthMonitoring?.length > 0 && (
                          <div className="mb-6">
                            <h5 className="font-semibold mb-3 text-healthcare-green-800 dark:text-healthcare-green-300">📊 Health Monitoring</h5>
                            <div className="space-y-2">
                              {aiRecommendations.healthMonitoring.map((monitoring, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-healthcare-green-200 dark:border-healthcare-green-700">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-white">{monitoring.parameter}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{monitoring.reason}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-healthcare-green-100 text-healthcare-green-800 rounded text-xs ml-3">
                                      {monitoring.frequency}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiRecommendations.medicationAlerts?.length > 0 && (
                          <div>
                            <h5 className="font-semibold mb-3 text-orange-800 dark:text-orange-300">⚠️ Medication Alerts</h5>
                            <div className="space-y-2">
                              {aiRecommendations.medicationAlerts.map((alert, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-white">{alert.alert}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.action}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ml-3 ${
                                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {alert.severity}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lifestyle Recommendations */}
                    {lifestyleRecommendations?.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Lightbulb className="w-6 h-6 mr-3 text-purple-600" />
                          Lifestyle Recommendations
                        </h4>
                        <div className="space-y-3">
                          {lifestyleRecommendations.map((lifestyle, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-purple-800 dark:text-purple-300">
                                  {lifestyle.category}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  lifestyle.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  lifestyle.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {lifestyle.frequency}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white mb-2">{lifestyle.recommendation}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{lifestyle.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Assessment */}
                    {riskAssessment && (
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Target className="w-6 h-6 mr-3 text-gray-600" />
                          Risk Assessment
                        </h4>
                        
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Overall Risk Level</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              riskAssessment.overallRiskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              riskAssessment.overallRiskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {riskAssessment.overallRiskLevel}
                            </span>
                          </div>
                        </div>

                        {riskAssessment.individualRisks?.length > 0 && (
                          <div className="space-y-3">
                            {riskAssessment.individualRisks.map((risk, index) => (
                              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-gray-900 dark:text-white">{risk.factor}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    risk.level === 'high' ? 'bg-red-100 text-red-800' :
                                    risk.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {risk.level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{risk.reason}</p>
                                {risk.preventiveMeasures && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    Prevention: {risk.preventiveMeasures.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Get Medicine Recommendations Button */}
                <div className="text-center mt-8">
                  <button
                    onClick={() => getMedicineRecommendations('general health check', 'preventive care')}
                    disabled={isLoadingMedicineRecs}
                    className="px-8 py-3 bg-gradient-to-r from-healthcare-green-500 to-purple-500 hover:from-healthcare-green-600 hover:to-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoadingMedicineRecs ? (
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    ) : (
                      <Pill className="w-5 h-5 inline mr-2" />
                    )}
                    Get AI Medicine Recommendations
                  </button>
                </div>

                {/* Medicine Recommendations Display */}
                {medicineRecommendations && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-teal-200 dark:border-teal-800">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Microscope className="w-6 h-6 mr-3 text-teal-600" />
                      AI Medicine Recommendations
                    </h4>
                    
                    {medicineRecommendations.safeMedicines?.length > 0 && (
                      <div className="mb-6">
                        <h5 className="font-semibold mb-3 text-green-800 dark:text-green-300">✅ Safe Medicines</h5>
                        <div className="space-y-3">
                          {medicineRecommendations.safeMedicines.map((medicine, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">{medicine.name}</span>
                                <span className="text-sm text-green-600 dark:text-green-400">{medicine.dosage}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <strong>Frequency:</strong> {medicine.frequency} | <strong>Duration:</strong> {medicine.duration}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{medicine.reason}</p>
                              <p className="text-xs text-green-600 dark:text-green-400">✓ {medicine.safetyNote}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {medicineRecommendations.avoidMedicines?.length > 0 && (
                      <div className="mb-6">
                        <h5 className="font-semibold mb-3 text-red-800 dark:text-red-300">❌ Medicines to Avoid</h5>
                        <div className="space-y-2">
                          {medicineRecommendations.avoidMedicines.map((medicine, index) => (
                            <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
                              <span className="font-medium text-red-800 dark:text-red-300">{medicine.name}</span>
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{medicine.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {medicineRecommendations.warnings?.length > 0 && (
                      <div className="mb-6">
                        <h5 className="font-semibold mb-3 text-orange-800 dark:text-orange-300">⚠️ Important Warnings</h5>
                        <div className="space-y-2">
                          {medicineRecommendations.warnings.map((warning, index) => (
                            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                              <div className="flex justify-between items-start">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300 flex-1">{warning.warning}</p>
                                <span className={`px-2 py-1 rounded text-xs ml-3 ${
                                  warning.severity === 'high' ? 'bg-red-100 text-red-800' :
                                  warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {warning.severity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {medicineRecommendations.monitoringAdvice?.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-3 text-healthcare-green-800 dark:text-healthcare-green-300">📊 Monitoring Advice</h5>
                        <div className="space-y-2">
                          {medicineRecommendations.monitoringAdvice.map((advice, index) => (
                            <div key={index} className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-lg p-3 border border-healthcare-green-200 dark:border-healthcare-green-700">
                              <div className="flex justify-between items-start">
                                <p className="text-sm text-healthcare-green-800 dark:text-healthcare-green-300 flex-1">{advice.advice}</p>
                                <span className="px-2 py-1 bg-healthcare-green-100 text-healthcare-green-800 rounded text-xs ml-3">
                                  {advice.frequency}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Enhanced Prescription OCR Section */}
        {activeSection === 'prescription' && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Prescription OCR & Extraction
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                Upload a prescription image and automatically extract medicine information with AI-powered OCR technology.
              </p>
            </div>

            {/* File Upload Section */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800 shadow-xl">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                <Camera className="w-6 h-6 mr-3 text-purple-600" />
                Upload Your Prescription
              </h4>
              
              <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl p-8 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="prescription-upload"
                />
                <label htmlFor="prescription-upload" className="cursor-pointer">

                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Click to upload prescription image
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supports JPG, PNG, HEIC formats • Max size: 10MB
                  </p>
                </label>
              </div>

              {uploadedImage && (
                <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📄 Uploaded: {uploadedImage.name}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{width: isExtracting ? '60%' : '100%'}}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {ocrError && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-6 h-6 mr-3 text-red-600" />
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-300">
                    Processing Error
                  </h4>
                </div>
                <p className="text-red-700 dark:text-red-400">{ocrError}</p>
              </div>
            )}

            {/* Processing Status */}
            {isExtracting && (
              <div className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-2xl p-8 border border-healthcare-green-200 dark:border-healthcare-green-800 text-center">
                <Loader2 className="animate-spin w-12 h-12 mx-auto mb-4 text-healthcare-green-600" />
                <p className="text-lg font-medium text-healthcare-green-800 dark:text-healthcare-green-300">
                  🔍 Processing prescription with AI-powered OCR...
                </p>
                <p className="text-sm text-healthcare-green-600 dark:text-healthcare-green-400 mt-2">
                  Please wait while we extract medicine information
                </p>
                <div className="w-full bg-healthcare-green-200 dark:bg-healthcare-green-800 rounded-full h-2 mt-4">
                  <div className="bg-healthcare-green-600 h-2 rounded-full transition-all duration-500" style={{width: `${ocrProgress}%`}}></div>
                </div>
              </div>
            )}

            {/* Extracted Medicines Display */}
            {extractedMedicines.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Pill className="w-6 h-6 mr-3 text-green-600" />
                    💊 Extracted Medicines ({extractedMedicines.length})
                  </h4>
                  <div className="flex items-center gap-3">
                    {prescriptionData?.aiAnalysis && (
                      <div className="flex items-center bg-gradient-to-r from-purple-100 to-healthcare-green-100 dark:from-purple-900/30 dark:to-healthcare-green-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-healthcare-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                          🤖 AI Enhanced
                        </span>
                      </div>
                    )}
                    {prescriptionData?.confidence && (
                      <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          prescriptionData.confidence > 0.8 ? 'bg-green-500' :
                          prescriptionData.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {Math.round(prescriptionData.confidence * 100)}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis Info Banner */}
                {prescriptionData?.aiAnalysis && prescriptionData?.processingMethod && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-healthcare-green-100 to-purple-100 dark:from-healthcare-green-900/20 dark:to-purple-900/20 rounded-xl border border-healthcare-green-200 dark:border-healthcare-green-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-healthcare-green-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">AI</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-healthcare-green-800 dark:text-healthcare-green-300">
                            Enhanced with {prescriptionData.processingMethod}
                          </p>
                          <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400">
                            Medicine names corrected and verified for accuracy
                          </p>
                        </div>
                      </div>
                      {prescriptionData?.notes && (
                        <button 
                          onClick={() => alert(prescriptionData.notes)}
                          className="text-healthcare-green-600 hover:text-healthcare-green-800 dark:text-healthcare-green-400 dark:hover:text-healthcare-green-200"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {extractedMedicines.map((medicine, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-4">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                              {medicine.name}
                            </h5>
                            {medicine.genericName && medicine.genericName !== medicine.name && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                Generic: {medicine.genericName}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-gray-600 dark:text-gray-400 font-medium">
                                {medicine.dosage}
                              </p>
                              {medicine.form && medicine.form !== 'Not specified' && (
                                <span className="bg-healthcare-green-100 dark:bg-healthcare-green-900/30 text-healthcare-green-800 dark:text-healthcare-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                  {medicine.form}
                                </span>
                              )}
                              {medicine.route && medicine.route !== 'Oral' && (
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                                  {medicine.route}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">
                              💊 Medicine
                            </span>
                          </div>
                          {medicine.confidence && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              medicine.confidence > 0.8 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : medicine.confidence > 0.6 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {Math.round(medicine.confidence * 100)}% sure
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-healthcare-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {medicine.frequency || 'As prescribed'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {medicine.duration || 'As prescribed'}
                          </span>
                        </div>
                      </div>

                      {medicine.instructions && medicine.instructions !== 'Follow doctor\'s instructions' && (
                        <div className="mt-4 p-3 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-lg">
                          <div className="flex items-start">
                            <Info className="w-4 h-4 mr-2 text-healthcare-green-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-healthcare-green-800 dark:text-healthcare-green-300 mb-1">
                                Special Instructions:
                              </p>
                              <p className="text-sm text-healthcare-green-700 dark:text-healthcare-green-400">
                                {medicine.instructions}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action buttons for extracted medicines */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      const medicineNames = extractedMedicines.map(m => m.name).join(', ');
                      navigator.clipboard.writeText(medicineNames);
                      alert('Medicine names copied to clipboard!');
                    }}
                    className="bg-healthcare-green-500 hover:bg-healthcare-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Clipboard className="w-4 h-4" />
                    Copy Medicine Names
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Navigate to medicine search with extracted medicines
                      const searchTerms = extractedMedicines.map(m => m.name).join(' ');
                      if (onNavigateToMedicines) {
                        onNavigateToMedicines(searchTerms);
                      } else {
                        // Fallback for when component is used standalone
                        window.open(`/medicines?search=${encodeURIComponent(searchTerms)}`, '_blank');
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Find These Medicines
                  </button>

                  <button 
                    onClick={() => {
                      // Add medicines to reminders
                      const newReminders = extractedMedicines.map(med => ({
                        id: Date.now() + Math.random(),
                        medicine: med.name,
                        dosage: med.dosage,
                        timing: ['Morning', 'Evening'],
                        duration: med.duration || 'As prescribed',
                        notes: med.instructions || 'Follow doctor\'s instructions'
                      }));
                      setReminders([...reminders, ...newReminders]);
                      setActiveSection('reminders');
                      alert(`Added ${newReminders.length} medicine(s) to your reminders!`);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Set Reminders
                  </button>

                  {prescriptionData?.aiAnalysis && (
                    <button 
                      onClick={() => {
                        const detailedInfo = extractedMedicines.map((med, index) => 
                          `${index + 1}. ${med.name}\n` +
                          `   Generic: ${med.genericName || 'N/A'}\n` +
                          `   Dosage: ${med.dosage}\n` +
                          `   Form: ${med.form || 'N/A'}\n` +
                          `   Frequency: ${med.frequency || 'As prescribed'}\n` +
                          `   Duration: ${med.duration || 'As prescribed'}\n` +
                          `   Route: ${med.route || 'N/A'}\n` +
                          `   Instructions: ${med.instructions || 'Follow doctor\'s instructions'}\n` +
                          `   Confidence: ${Math.round((med.confidence || 0) * 100)}%`
                        ).join('\n\n');
                        
                        navigator.clipboard.writeText(`AI-Enhanced Prescription Analysis\n\n${detailedInfo}`);
                        alert('Detailed medicine information copied to clipboard!');
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Copy Full Details
                    </button>
                  )}
                </div>

                {/* Enhanced prescription details */}
                {prescriptionData && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Prescription Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {prescriptionData.doctorName !== 'Not found' && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {prescriptionData.doctorName}
                          </span>
                        </div>
                      )}
                      {prescriptionData.hospitalName !== 'Not found' && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Hospital:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {prescriptionData.hospitalName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Date:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {prescriptionData.date}
                        </span>
                      </div>
                      {prescriptionData.patientName && prescriptionData.patientName !== 'Not specified' && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Patient:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {prescriptionData.patientName}
                          </span>
                        </div>
                      )}
                      {prescriptionData.processingMethod && (
                        <div className="flex items-center">
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                            Processed via: {prescriptionData.processingMethod}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Raw Text Display (Collapsible) */}
            {extractedText && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-gray-600" />
                    📋 Raw Extracted Text
                  </h4>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showRawText ? 'rotate-180' : ''}`} />
                </button>
                
                {showRawText && (
                  <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto scrollbar-thin">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {extractedText}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Medicine Reminders Section */}
        {activeSection === 'reminders' && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Smart Medicine Reminders
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                Never miss a dose! Set up intelligent reminders for your medications with personalized scheduling.
              </p>
            </div>

            {/* Add New Reminder */}
            <div className="bg-gradient-to-br from-healthcare-green-50 via-indigo-50 to-purple-50 dark:from-healthcare-green-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-healthcare-green-200 dark:border-healthcare-green-800 shadow-xl">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                <Plus className="w-6 h-6 mr-3 text-healthcare-green-600" />
                 Add New Reminder
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    value={newReminder.medicine}
                    onChange={(e) => setNewReminder({...newReminder, medicine: e.target.value})}
                    placeholder="e.g., Amoxicillin"
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={newReminder.dosage}
                    onChange={(e) => setNewReminder({...newReminder, dosage: e.target.value})}
                    placeholder="e.g., 500mg"
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newReminder.duration}
                    onChange={(e) => setNewReminder({...newReminder, duration: e.target.value})}
                    placeholder="e.g., 7 days"
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={newReminder.notes}
                    onChange={(e) => setNewReminder({...newReminder, notes: e.target.value})}
                    placeholder="e.g., Take with food"
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={addMedicineReminder}
                disabled={!newReminder.medicine || !newReminder.dosage}
                className="mt-6 bg-gradient-to-r from-healthcare-green-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-healthcare-green-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
              >
                Add Reminder
              </button>
            </div>

            {/* Current Reminders */}
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <Bell className="w-6 h-6 mr-3 text-orange-500" />
                Your Medicine Reminders ({reminders.length})
              </h4>
              
              <div className="grid gap-4 max-h-96 overflow-y-auto scrollbar-thin">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center text-lg">
                          <Pill className="w-5 h-5 mr-2 text-healthcare-green-600" />
                          {reminder.medicine}
                        </h5>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">💊 Dosage:</span> {reminder.dosage}
                            </div>
                            <div>
                              <span className="font-medium">⏰ Timing:</span> {reminder.timing.join(', ')}
                            </div>
                            {reminder.duration && (
                              <div>
                                <span className="font-medium">📅 Duration:</span> {reminder.duration}
                              </div>
                            )}
                            {reminder.notes && (
                              <div>
                                <span className="font-medium">📝 Notes:</span> {reminder.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-4 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Profile Editor Modal Component
const ProfileEditorModal = ({ userProfile, onSave, onCancel, isUpdating }) => {
  const [editedProfile, setEditedProfile] = useState({
    allergies: userProfile.allergies || [],
    pastDiseases: userProfile.pastDiseases || [],
    currentMedications: userProfile.currentMedications || [],
    chronicConditions: userProfile.chronicConditions || [],
    bloodType: userProfile.bloodType || '',
    emergencyContact: userProfile.emergencyContact || {},
    lifestyleFactors: userProfile.lifestyleFactors || {}
  });

  const [newAllergy, setNewAllergy] = useState({ name: '', severity: 'moderate' });
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '' });
  const [newDisease, setNewDisease] = useState({ name: '', status: 'resolved' });
  const [newCondition, setNewCondition] = useState({ name: '', severity: 'moderate' });

  const addAllergy = () => {
    if (newAllergy.name.trim()) {
      setEditedProfile({
        ...editedProfile,
        allergies: [...editedProfile.allergies, newAllergy]
      });
      setNewAllergy({ name: '', severity: 'moderate' });
    }
  };

  const removeAllergy = (index) => {
    setEditedProfile({
      ...editedProfile,
      allergies: editedProfile.allergies.filter((_, i) => i !== index)
    });
  };

  const addMedication = () => {
    if (newMedication.name.trim() && newMedication.dosage.trim() && newMedication.frequency.trim()) {
      setEditedProfile({
        ...editedProfile,
        currentMedications: [...editedProfile.currentMedications, newMedication]
      });
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index) => {
    setEditedProfile({
      ...editedProfile,
      currentMedications: editedProfile.currentMedications.filter((_, i) => i !== index)
    });
  };

  const addDisease = () => {
    if (newDisease.name.trim()) {
      setEditedProfile({
        ...editedProfile,
        pastDiseases: [...editedProfile.pastDiseases, newDisease]
      });
      setNewDisease({ name: '', status: 'resolved' });
    }
  };

  const removeDisease = (index) => {
    setEditedProfile({
      ...editedProfile,
      pastDiseases: editedProfile.pastDiseases.filter((_, i) => i !== index)
    });
  };

  const handleSave = () => {
    onSave(editedProfile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Medical Profile</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Allergies Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Allergies
            </h4>
            
            <div className="space-y-2">
              {editedProfile.allergies.map((allergy, index) => (
                <div key={index} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <span className="text-red-800 dark:text-red-300">
                    {typeof allergy === 'string' ? allergy : allergy.name}
                    {typeof allergy !== 'string' && allergy.severity && (
                      <span className="ml-2 text-xs">({allergy.severity})</span>
                    )}
                  </span>
                  <button
                    onClick={() => removeAllergy(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Allergy name"
                value={newAllergy.name}
                onChange={(e) => setNewAllergy({ ...newAllergy, name: e.target.value })}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="anaphylactic">Anaphylactic</option>
              </select>
              <button
                onClick={addAllergy}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Medications Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Pill className="w-5 h-5 mr-2 text-purple-500" />
              Current Medications
            </h4>
            
            <div className="space-y-2">
              {editedProfile.currentMedications.map((medication, index) => (
                <div key={index} className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="text-purple-800 dark:text-purple-300">
                    <div className="font-medium">
                      {typeof medication === 'string' ? medication : medication.name}
                    </div>
                    {typeof medication !== 'string' && (
                      <div className="text-sm">
                        {medication.dosage} - {medication.frequency}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeMedication(index)}
                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Medication name"
                value={newMedication.name}
                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dosage"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={addMedication}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Past Diseases Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-500" />
              Past Medical Conditions
            </h4>
            
            <div className="space-y-2">
              {editedProfile.pastDiseases.map((disease, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <span className="text-green-800 dark:text-green-300">
                    {typeof disease === 'string' ? disease : disease.name}
                    {typeof disease !== 'string' && disease.status && (
                      <span className="ml-2 text-xs">({disease.status})</span>
                    )}
                  </span>
                  <button
                    onClick={() => removeDisease(index)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Condition name"
                value={newDisease.name}
                onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={newDisease.status}
                onChange={(e) => setNewDisease({ ...newDisease, status: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="resolved">Resolved</option>
                <option value="ongoing">Ongoing</option>
                <option value="monitored">Monitored</option>
              </select>
              <button
                onClick={addDisease}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Basic Information
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Blood Type
              </label>
              <select
                value={editedProfile.bloodType}
                onChange={(e) => setEditedProfile({ ...editedProfile, bloodType: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={editedProfile.emergencyContact.name || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  emergencyContact: { ...editedProfile.emergencyContact, name: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Phone
              </label>
              <input
                type="text"
                value={editedProfile.emergencyContact.phone || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  emergencyContact: { ...editedProfile.emergencyContact, phone: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-6 py-2 bg-healthcare-green-500 text-white rounded-lg hover:bg-healthcare-green-600 disabled:opacity-50 flex items-center"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isUpdating ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSmartDoctorClean;

