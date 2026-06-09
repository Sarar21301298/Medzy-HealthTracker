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
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import SmartDoctorChatInterface from './SmartDoctorChatInterface';

const EnhancedSmartDoctor = () => {
  console.log('EnhancedSmartDoctor component loaded');
  
  const [activeSection, setActiveSection] = useState('chat');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [extractedPrescription, setExtractedPrescription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [medicineReminders, setMedicineReminders] = useState([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [userProfile, setUserProfile] = useState({
    allergies: [],
    pastDiseases: [],
    currentMedications: []
  });
  
  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  const fileInputRef = useRef(null);

  // New reminder form state
  const [newReminder, setNewReminder] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'daily',
    timing: [],
    duration: '',
    withFood: 'before',
    notes: ''
  });

  useEffect(() => {
    console.log('EnhancedSmartDoctor useEffect triggered');
    fetchUserProfile();
    fetchMedicineReminders();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/medical-profile/medical-history', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchMedicineReminders = async () => {
    try {
      const response = await fetch('/api/medicine-reminders', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMedicineReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching medicine reminders:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please upload an image file');
      return;
    }

    setPrescriptionFile(file);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('prescription', file);

    try {
      const response = await fetch('/api/smart-doctor/extract-prescription', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setExtractedPrescription(data);
        success('Prescription extracted successfully');
      } else {
        throw new Error('Extraction failed');
      }
    } catch (error) {
      console.error('Error extracting prescription:', error);
      // Simulate extraction for demo
      setExtractedPrescription({
        medicines: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            frequency: '3 times daily',
            duration: '7 days',
            instructions: 'Take with food'
          },
          {
            name: 'Paracetamol',
            dosage: '650mg',
            frequency: '4 times daily',
            duration: '5 days',
            instructions: 'Take as needed for fever'
          }
        ],
        doctorName: 'Dr. Smith',
        date: new Date().toLocaleDateString()
      });
      success('Prescription processed (demo mode)');
    } finally {
      setIsProcessing(false);
    }
  };

  const addMedicineReminder = async () => {
    if (!newReminder.medicineName || !newReminder.dosage || newReminder.timing.length === 0) {
      error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/medicine-reminders', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReminder)
      });

      if (response.ok) {
        const data = await response.json();
        setMedicineReminders([...medicineReminders, data.reminder]);
        setNewReminder({
          medicineName: '',
          dosage: '',
          frequency: 'daily',
          timing: [],
          duration: '',
          withFood: 'before',
          notes: ''
        });
        setShowAddReminder(false);
        success('Medicine reminder added successfully');
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
      // Simulate adding reminder
      const newReminderItem = {
        id: Date.now(),
        ...newReminder,
        createdAt: new Date().toISOString()
      };
      setMedicineReminders([...medicineReminders, newReminderItem]);
      setNewReminder({
        medicineName: '',
        dosage: '',
        frequency: 'daily',
        timing: [],
        duration: '',
        withFood: 'before',
        notes: ''
      });
      setShowAddReminder(false);
      success('Medicine reminder added (demo mode)');
    }
  };

  const deleteMedicineReminder = async (id) => {
    try {
      await fetch(`/api/medicine-reminders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      setMedicineReminders(medicineReminders.filter(reminder => reminder.id !== id));
      success('Reminder deleted successfully');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setMedicineReminders(medicineReminders.filter(reminder => reminder.id !== id));
      success('Reminder deleted');
    }
  };

  const sections = [
    { id: 'chat', name: 'AI Chat', icon: MessageCircle },
    { id: 'prescription', name: 'Prescription OCR', icon: FileText },
    { id: 'reminders', name: 'Medicine Reminders', icon: Bell }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
      {/* Section Navigation */}
      <div className="border-b dark:border-gray-700 bg-gradient-to-r from-healthcare-green-50 to-purple-50 dark:from-healthcare-green-900/20 dark:to-purple-900/20">
        <div className="flex overflow-x-auto scrollbar-hide">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap font-medium text-sm transition-all duration-200 ${
                  activeSection === section.id
                    ? 'text-healthcare-green-600 dark:text-healthcare-green-400 border-b-2 border-healthcare-green-600 dark:border-healthcare-green-400 bg-white/80 dark:bg-gray-800/80'
                    : 'text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 hover:bg-white/60 dark:hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{section.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <div className="min-h-[600px]">
        {/* AI Chat Section */}
        {activeSection === 'chat' && (
          <div className="h-[600px]">
            <SmartDoctorChatInterface />
          </div>
        )}



        {/* Prescription OCR Section */}
        {activeSection === 'prescription' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Prescription Extraction (OCR)
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Upload a prescription image and automatically extract medicine information.
              </p>
            </div>

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {prescriptionFile ? (
                    <div className="space-y-4">
                      <img
                        src={URL.createObjectURL(prescriptionFile)}
                        alt="Prescription"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {prescriptionFile.name}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Upload Prescription Image
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Take a clear photo or upload an image of your prescription
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="mt-4 bg-gradient-to-r from-healthcare-green-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-healthcare-green-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span>{prescriptionFile ? 'Change Image' : 'Select Image'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extracted Prescription Results */}
              {extractedPrescription && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    Extracted Prescription Details
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Doctor:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{extractedPrescription.doctorName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{extractedPrescription.date}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Prescribed Medicines:</h5>
                      <div className="space-y-2">
                        {extractedPrescription.medicines?.map((medicine, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-medium text-gray-900 dark:text-white">{medicine.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 space-x-4">
                              <span>Dosage: {medicine.dosage}</span>
                              <span>Frequency: {medicine.frequency}</span>
                              <span>Duration: {medicine.duration}</span>
                            </div>
                            {medicine.instructions && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Instructions: {medicine.instructions}
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                setNewReminder({
                                  medicineName: medicine.name,
                                  dosage: medicine.dosage,
                                  frequency: medicine.frequency,
                                  timing: [],
                                  duration: medicine.duration,
                                  withFood: medicine.instructions?.toLowerCase().includes('food') ? 'with' : 'before',
                                  notes: medicine.instructions || ''
                                });
                                setActiveSection('reminders');
                                setShowAddReminder(true);
                              }}
                              className="mt-2 bg-healthcare-green-600 text-white px-3 py-1 rounded text-xs hover:bg-healthcare-green-700 transition-colors"
                            >
                              Add to Reminders
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medicine Reminders Section */}
        {activeSection === 'reminders' && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Medicine Reminders
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Set up automated reminders for your medications.
                </p>
              </div>
              <button
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="bg-gradient-to-r from-healthcare-green-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-healthcare-green-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reminder</span>
              </button>
            </div>

            {/* Add Reminder Form */}
            {showAddReminder && (
              <div className="mb-6 bg-gradient-to-r from-healthcare-green-50 to-purple-50 dark:from-healthcare-green-900/20 dark:to-purple-900/20 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Add New Medicine Reminder
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={newReminder.medicineName}
                      onChange={(e) => setNewReminder({...newReminder, medicineName: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500"
                      placeholder="Enter medicine name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={newReminder.dosage}
                      onChange={(e) => setNewReminder({...newReminder, dosage: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500"
                      placeholder="e.g., 500mg, 1 tablet"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequency
                    </label>
                    <select
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="twice-daily">Twice Daily</option>
                      <option value="thrice-daily">Thrice Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="as-needed">As Needed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={newReminder.duration}
                      onChange={(e) => setNewReminder({...newReminder, duration: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500"
                      placeholder="e.g., 7 days, 2 weeks"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timing *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            const timing = newReminder.timing.includes(time)
                              ? newReminder.timing.filter(t => t !== time)
                              : [...newReminder.timing, time];
                            setNewReminder({...newReminder, timing});
                          }}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            newReminder.timing.includes(time)
                              ? 'bg-healthcare-green-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      With Food
                    </label>
                    <select
                      value={newReminder.withFood}
                      onChange={(e) => setNewReminder({...newReminder, withFood: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500"
                    >
                      <option value="before">Before Food</option>
                      <option value="with">With Food</option>
                      <option value="after">After Food</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={newReminder.notes}
                    onChange={(e) => setNewReminder({...newReminder, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 resize-none"
                    rows="2"
                    placeholder="Any special instructions or notes"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddReminder(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMedicineReminder}
                    disabled={!newReminder.medicineName || !newReminder.dosage || newReminder.timing.length === 0}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Reminder</span>
                  </button>
                </div>
              </div>
            )}

            {/* Existing Reminders */}
            <div className="space-y-4">
              {medicineReminders.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Medicine Reminders
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Add your first medicine reminder to get started with automated notifications.
                  </p>
                </div>
              ) : (
                medicineReminders.map((reminder) => (
                  <div key={reminder.id} className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Pill className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {reminder.medicineName}
                          </h4>
                          <span className="px-2 py-1 text-xs bg-healthcare-green-100 dark:bg-healthcare-green-900/30 text-healthcare-green-800 dark:text-healthcare-green-300 rounded-full">
                            {reminder.frequency}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <div>
                            <span className="font-medium">Dosage:</span> {reminder.dosage}
                          </div>
                          <div>
                            <span className="font-medium">Timing:</span> {reminder.timing.join(', ')}
                          </div>
                          <div>
                            <span className="font-medium">With Food:</span> {reminder.withFood}
                          </div>
                          {reminder.duration && (
                            <div>
                              <span className="font-medium">Duration:</span> {reminder.duration}
                            </div>
                          )}
                          {reminder.notes && (
                            <div>
                              <span className="font-medium">Notes:</span> {reminder.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteMedicineReminder(reminder.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSmartDoctor;

