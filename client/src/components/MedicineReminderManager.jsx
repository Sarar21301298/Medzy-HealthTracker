import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Clock, Bell, BellOff, Pill, Calendar, Target, 
  CheckCircle, XCircle, AlertCircle, Zap, Settings,
  TrendingUp, Brain, Smartphone, Mail, MessageSquare
} from 'lucide-react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const MedicineReminderManager = () => {
  const [reminders, setReminders] = useState([]);
  const [todaysReminders, setTodaysReminders] = useState([]);
  const [adherenceData, setAdherenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  // Form states
  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: { amount: '', unit: 'mg' },
    frequency: 'once',
    timing: ['morning'],
    withFood: 'any',
    notes: '',
    duration: {
      startDate: new Date().toISOString().split('T')[0],
      isIndefinite: false
    },
    reminderSettings: {
      pushNotification: true,
      email: false,
      sms: false,
      snoozeMinutes: 10,
      maxSnoozes: 3
    }
  });

  const [aiRecommendations, setAiRecommendations] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remindersRes, todayRes, adherenceRes] = await Promise.all([
        axios.get('/api/medicine-reminders', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/medicine-reminders/today', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/medicine-reminders/adherence?period=weekly', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setReminders(remindersRes.data.reminders);
      setTodaysReminders(todayRes.data.reminders);
      setAdherenceData(adherenceRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/medicine-reminders', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setReminders([response.data.reminder, ...reminders]);
      setAiRecommendations(response.data.aiRecommendations);
      setShowCreateModal(false);
      resetForm();
      fetchData(); // Refresh all data
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder. Please try again.');
    }
  };

  const handleUpdateReminder = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `/api/medicine-reminders/${selectedReminder._id}`, 
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setReminders(reminders.map(r => 
        r._id === selectedReminder._id ? response.data.reminder : r
      ));
      setShowEditModal(false);
      setSelectedReminder(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating reminder:', error);
      alert('Failed to update reminder. Please try again.');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await axios.delete(`/api/medicine-reminders/${reminderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setReminders(reminders.filter(r => r._id !== reminderId));
      fetchData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Failed to delete reminder. Please try again.');
    }
  };

  const handleMarkAsTaken = async (reminderId, scheduledTime) => {
    try {
      await axios.post(`/api/medicine-reminders/${reminderId}/taken`, {
        scheduledTime,
        notes: ''
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      fetchData(); // Refresh data to update adherence
    } catch (error) {
      console.error('Error marking as taken:', error);
      alert('Failed to mark as taken. Please try again.');
    }
  };

  const handleSnoozeReminder = async (reminderId, scheduledTime, snoozeMinutes = 10) => {
    try {
      await axios.post(`/api/medicine-reminders/${reminderId}/snooze`, {
        scheduledTime,
        snoozeMinutes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      fetchData();
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      alert('Failed to snooze reminder. Please try again.');
    }
  };

  const handleSkipReminder = async (reminderId, scheduledTime, reason = '') => {
    try {
      await axios.post(`/api/medicine-reminders/${reminderId}/skip`, {
        scheduledTime,
        reason
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      fetchData();
    } catch (error) {
      console.error('Error skipping reminder:', error);
      alert('Failed to skip reminder. Please try again.');
    }
  };

  const getAIRecommendations = async (reminderId) => {
    try {
      const response = await axios.get(`/api/medicine-reminders/${reminderId}/ai-recommendations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setAiRecommendations(response.data.aiRecommendations);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      medicineName: '',
      dosage: { amount: '', unit: 'mg' },
      frequency: 'once',
      timing: ['morning'],
      withFood: 'any',
      notes: '',
      duration: {
        startDate: new Date().toISOString().split('T')[0],
        isIndefinite: false
      },
      reminderSettings: {
        pushNotification: true,
        email: false,
        sms: false,
        snoozeMinutes: 10,
        maxSnoozes: 3
      }
    });
    setAiRecommendations(null);
  };

  const openEditModal = (reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      timing: reminder.timing,
      withFood: reminder.withFood,
      notes: reminder.notes || '',
      duration: reminder.duration,
      reminderSettings: reminder.reminderSettings
    });
    setShowEditModal(true);
  };

  const getAdherenceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    if (rate >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const frequencyOptions = [
    { value: 'once', label: 'Once daily' },
    { value: 'twice', label: 'Twice daily' },
    { value: 'three_times', label: 'Three times daily' },
    { value: 'four_times', label: 'Four times daily' },
    { value: 'as_needed', label: 'As needed' }
  ];

  const timingOptions = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'night', label: 'Night' },
    { value: 'before_breakfast', label: 'Before Breakfast' },
    { value: 'after_breakfast', label: 'After Breakfast' },
    { value: 'before_lunch', label: 'Before Lunch' },
    { value: 'after_lunch', label: 'After Lunch' },
    { value: 'before_dinner', label: 'Before Dinner' },
    { value: 'after_dinner', label: 'After Dinner' },
    { value: 'bedtime', label: 'Bedtime' }
  ];

  const dosageUnits = ['mg', 'ml', 'tablet', 'capsule', 'drop', 'tsp', 'tbsp'];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Pill className="mr-3 text-healthcare-green-600" />
                Medicine Reminders
              </h1>
              <p className="text-gray-600 mt-2">AI-powered medication management with smart reminders</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-healthcare-green-600 text-white px-6 py-3 rounded-lg hover:bg-healthcare-green-700 flex items-center"
            >
              <Plus className="mr-2" size={20} />
              Add Reminder
            </button>
          </div>
        </div>

        {/* Adherence Overview */}
        {adherenceData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="mr-2 text-green-600" />
              Weekly Adherence Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getAdherenceColor(adherenceData.summary.overallAdherenceRate)}`}>
                  {adherenceData.summary.overallAdherenceRate}%
                </div>
                <div className="text-gray-600">Overall Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{adherenceData.summary.totalTaken}</div>
                <div className="text-gray-600">Taken</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{adherenceData.summary.totalMissed}</div>
                <div className="text-gray-600">Missed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-healthcare-green-600">{adherenceData.summary.totalScheduled}</div>
                <div className="text-gray-600">Total Scheduled</div>
              </div>
            </div>
            
            {adherenceData.insights && adherenceData.insights.length > 0 && (
              <div className="mt-6 space-y-3">
                {adherenceData.insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg flex items-center ${
                    insight.type === 'success' ? 'bg-green-50 text-green-800' :
                    insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                    insight.type === 'alert' ? 'bg-orange-50 text-orange-800' :
                    insight.type === 'critical' ? 'bg-red-50 text-red-800' :
                    'bg-healthcare-green-50 text-healthcare-green-800'
                  }`}>
                    <span className="mr-2">{insight.icon}</span>
                    {insight.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'today', label: "Today's Schedule", icon: Clock },
            { id: 'all', label: 'All Reminders', icon: Bell },
            { id: 'adherence', label: 'Adherence Report', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                activeTab === tab.id
                  ? 'bg-healthcare-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="mr-2" size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Today's Reminders */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
            {todaysReminders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">No reminders scheduled for today</p>
              </div>
            ) : (
              todaysReminders.map((reminder) => (
                <div key={reminder._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{reminder.medicineName}</h3>
                      <p className="text-gray-600">
                        {reminder.dosage.amount} {reminder.dosage.unit}
                        {reminder.withFood !== 'any' && ` • Take ${reminder.withFood} meal`}
                      </p>
                      {reminder.notes && (
                        <p className="text-sm text-gray-500 mt-1">{reminder.notes}</p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${getAdherenceColor(reminder.adherenceRate)} bg-gray-50`}>
                      {reminder.adherenceRate}% adherence
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reminder.todaysSchedule.map((schedule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="mr-3 text-gray-400" size={16} />
                          <span className="font-medium">{schedule.timeLabel}</span>
                          {schedule.notificationSent && (
                            <CheckCircle className="ml-2 text-green-600" size={16} />
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleMarkAsTaken(reminder._id, schedule.scheduledTime)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Mark Taken
                          </button>
                          <button
                            onClick={() => handleSnoozeReminder(reminder._id, schedule.scheduledTime)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => handleSkipReminder(reminder._id, schedule.scheduledTime)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Reminders */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">All Reminders</h2>
            {reminders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 mb-4">No reminders set up yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-healthcare-green-600 text-white px-6 py-3 rounded-lg hover:bg-healthcare-green-700"
                >
                  Create Your First Reminder
                </button>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-bold text-gray-900 mr-3">{reminder.medicineName}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${reminder.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {reminder.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {reminder.dosage.amount} {reminder.dosage.unit} • {frequencyOptions.find(f => f.value === reminder.frequency)?.label}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="mr-1" size={14} />
                        {reminder.timing.map(time => timingOptions.find(t => t.value === time)?.label).join(', ')}
                        {reminder.withFood !== 'any' && ` • ${reminder.withFood} meal`}
                      </div>
                      {reminder.notes && (
                        <p className="text-sm text-gray-500">{reminder.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getAdherenceColor(reminder.adherenceRate || 0)}`}>
                          {reminder.adherenceRate || 0}%
                        </div>
                        <div className="text-xs text-gray-500">Adherence</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => getAIRecommendations(reminder._id)}
                          className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
                          title="Get AI Recommendations"
                        >
                          <Brain size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(reminder)}
                          className="bg-healthcare-green-600 text-white p-2 rounded hover:bg-healthcare-green-700"
                          title="Edit Reminder"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder._id)}
                          className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                          title="Delete Reminder"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings Display */}
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Smartphone className="mr-1" size={14} />
                      Push: {reminder.reminderSettings?.pushNotification ? 'On' : 'Off'}
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-1" size={14} />
                      Email: {reminder.reminderSettings?.email ? 'On' : 'Off'}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="mr-1" size={14} />
                      SMS: {reminder.reminderSettings?.sms ? 'On' : 'Off'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Adherence Report Tab */}
        {activeTab === 'adherence' && adherenceData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Adherence Report</h2>
            
            <div className="space-y-4">
              {adherenceData.medications.map((med) => (
                <div key={med.medicationId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg">{med.medicineName}</h3>
                    <div className={`text-xl font-bold ${getAdherenceColor(med.adherenceRate)}`}>
                      {med.adherenceRate}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-healthcare-green-600">{med.scheduled}</div>
                      <div className="text-sm text-gray-500">Scheduled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{med.taken}</div>
                      <div className="text-sm text-gray-500">Taken</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{med.missed}</div>
                      <div className="text-sm text-gray-500">Missed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Reminder Modal */}
      <Modal 
        isOpen={showCreateModal || showEditModal} 
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedReminder(null);
          resetForm();
        }}
        title={showEditModal ? 'Edit Medicine Reminder' : 'Create Medicine Reminder'}
      >
        <form onSubmit={showEditModal ? handleUpdateReminder : handleCreateReminder} className="space-y-6">
          {/* Medicine Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicine Name *
            </label>
            <input
              type="text"
              value={formData.medicineName}
              onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              required
            />
          </div>

          {/* Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage Amount *
              </label>
              <input
                type="text"
                value={formData.dosage.amount}
                onChange={(e) => setFormData({
                  ...formData, 
                  dosage: {...formData.dosage, amount: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                placeholder="e.g., 500, 1, 2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                value={formData.dosage.unit}
                onChange={(e) => setFormData({
                  ...formData, 
                  dosage: {...formData.dosage, unit: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              >
                {dosageUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              required
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Timing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timingOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.timing.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData, 
                          timing: [...formData.timing, option.value]
                        });
                      } else {
                        setFormData({
                          ...formData, 
                          timing: formData.timing.filter(t => t !== option.value)
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Food Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Instructions
            </label>
            <select
              value={formData.withFood}
              onChange={(e) => setFormData({...formData, withFood: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
            >
              <option value="any">No specific requirement</option>
              <option value="before">Take before meals</option>
              <option value="after">Take after meals</option>
              <option value="with">Take with meals</option>
            </select>
          </div>

          {/* Notification Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Preferences
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderSettings.pushNotification}
                  onChange={(e) => setFormData({
                    ...formData,
                    reminderSettings: {
                      ...formData.reminderSettings,
                      pushNotification: e.target.checked
                    }
                  })}
                  className="mr-3"
                />
                <Smartphone className="mr-2" size={16} />
                Push Notifications
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderSettings.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    reminderSettings: {
                      ...formData.reminderSettings,
                      email: e.target.checked
                    }
                  })}
                  className="mr-3"
                />
                <Mail className="mr-2" size={16} />
                Email Reminders
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderSettings.sms}
                  onChange={(e) => setFormData({
                    ...formData,
                    reminderSettings: {
                      ...formData.reminderSettings,
                      sms: e.target.checked
                    }
                  })}
                  className="mr-3"
                />
                <MessageSquare className="mr-2" size={16} />
                SMS Reminders
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              placeholder="Additional notes or instructions..."
            />
          </div>

          {/* AI Recommendations Display */}
          {aiRecommendations && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                <Brain className="mr-2" size={16} />
                AI Recommendations
              </h4>
              <div className="space-y-2">
                {aiRecommendations.map((rec, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">
                      Take {rec.time} • {rec.withFood ? `${rec.withFood} meal` : 'Any time'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{rec.reasoning}</div>
                    {rec.specialInstructions && (
                      <div className="text-xs text-purple-700 mt-1 font-medium">
                        💡 {rec.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700"
            >
              {showEditModal ? 'Update Reminder' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicineReminderManager;

