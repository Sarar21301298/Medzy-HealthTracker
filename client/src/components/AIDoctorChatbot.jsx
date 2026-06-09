import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Stethoscope, 
  Heart, 
  Minimize2, 
  Maximize2,
  X,
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
  Star
} from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

// Enhanced AI Doctor Service with structured questionnaire
class AIDocService {
  constructor() {
    // Direct Gemini API integration - no settings needed
    this.geminiApiKey = 'AIzaSyABGuU0fO7Yt9OUdCVbLzgFS17UV0X6Gzk';
    this.selectedAPI = 'gemini';
    
    // Medical questionnaire structure
    this.questions = [
      {
        id: 'main_symptom',
        question: "What is your main symptom or concern today?",
        type: 'text',
        required: true,
        placeholder: "e.g., headache, fever, stomach pain, cough..."
      },
      {
        id: 'pain_level',
        question: "On a scale of 1-10, how would you rate your discomfort level?",
        type: 'scale',
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      {
        id: 'duration',
        question: "How long have you been experiencing this symptom?",
        type: 'select',
        required: true,
        options: [
          "Less than 1 hour",
          "1-6 hours",
          "6-24 hours", 
          "1-3 days",
          "3-7 days",
          "1-2 weeks",
          "More than 2 weeks"
        ]
      },
      {
        id: 'additional_symptoms',
        question: "Do you have any of these additional symptoms?",
        type: 'multiple',
        required: false,
        options: [
          "Fever or chills",
          "Nausea or vomiting", 
          "Fatigue or weakness",
          "Difficulty breathing",
          "Dizziness",
          "Loss of appetite",
          "Sleep problems",
          "None of the above"
        ]
      },
      {
        id: 'medical_history',
        question: "Do you have any existing medical conditions or take regular medications?",
        type: 'text',
        required: false,
        placeholder: "e.g., diabetes, high blood pressure, allergies, current medications..."
      },
      {
        id: 'age_group',
        question: "What is your age group?",
        type: 'select',
        required: true,
        options: [
          "Under 18",
          "18-30",
          "31-50", 
          "51-65",
          "Over 65"
        ]
      }
    ];
  }

  async askGemini(patientData) {
    const prompt = this.createDiagnosticPrompt(patientData);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are Dr. AI from MedZy, a professional virtual healthcare assistant. Analyze the following patient data and provide a comprehensive medical assessment.

Patient Information:
${prompt}

Please structure your response as follows:

**SYMPTOM ANALYSIS:**
- Brief analysis of reported symptoms
- Severity assessment based on pain level and duration

**POSSIBLE CONDITIONS:** (2-3 most likely)
- Primary diagnosis with probability
- Secondary possibilities  
- Risk factors to consider

**RECOMMENDED TREATMENT:**
- Immediate care instructions
- Specific medications with dosages
- Home remedies and lifestyle changes
- When to seek emergency care

**FOLLOW-UP INSTRUCTIONS:**
- What to monitor
- When to see a doctor
- Red flag symptoms to watch for

**URGENCY LEVEL:** Low/Moderate/High/Emergency

Always include appropriate medical disclaimers and be empathetic but professional. End with "- MedZy AI Healthcare Assistant"`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  createDiagnosticPrompt(patientData) {
    return `
PATIENT ASSESSMENT DATA:

Main Symptom: ${patientData.main_symptom}
Pain/Discomfort Level: ${patientData.pain_level}/10
Duration: ${patientData.duration}
Additional Symptoms: ${patientData.additional_symptoms || 'None reported'}
Medical History: ${patientData.medical_history || 'None reported'}
Age Group: ${patientData.age_group}

Please provide a comprehensive medical analysis based on this information.
`;
  }

  async getAIResponse(patientData) {
    try {
      // Always use Gemini API with integrated key
      return await this.askGemini(patientData);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getSimulatedResponse(patientData);
    }
  }

  getSimulatedResponse(patientData) {
    const { main_symptom, pain_level, duration, additional_symptoms, age_group } = patientData;
    
    return `🩺 **MEDZY AI MEDICAL ASSESSMENT REPORT**

**SYMPTOM ANALYSIS:**
Based on your reported symptoms of "${main_symptom}" with a pain level of ${pain_level}/10 lasting ${duration}, I'm providing the following assessment:

**POSSIBLE CONDITIONS:**
1. **Primary Consideration**: Common condition related to ${main_symptom}
2. **Secondary Possibility**: Stress-related or lifestyle factors
3. **Monitor For**: Any progression or worsening of symptoms

**RECOMMENDED TREATMENT:**

🏠 **Immediate Care:**
• Rest and avoid strenuous activities
• Stay well hydrated (8-10 glasses of water)
• Apply appropriate heat/cold therapy

💊 **Suggested Medications:**
• **Over-the-counter pain relief**: 
  - Ibuprofen: 400mg every 6-8 hours (with food)
  - OR Acetaminophen: 500-1000mg every 6 hours
• **For additional symptoms**: Based on specific needs

🌿 **Natural Remedies:**
• Adequate rest (7-9 hours sleep)
• Gentle stretching or relaxation techniques
• Healthy diet with anti-inflammatory foods

**FOLLOW-UP INSTRUCTIONS:**
• Monitor symptoms for the next 24-48 hours
• Keep a symptom diary noting any changes
• Seek medical attention if symptoms worsen or persist beyond 3-5 days

**URGENCY LEVEL:** ${pain_level >= 8 ? '🔴 **HIGH**' : pain_level >= 5 ? '🟡 **MODERATE**' : '🟢 **LOW**'}

${pain_level >= 8 ? '🚨 **Seek immediate medical attention for severe symptoms**' : ''}

⚠️ **Medical Disclaimer**: This assessment is for informational purposes only. Please consult with a qualified healthcare professional for proper diagnosis and treatment, especially if symptoms persist or worsen.

**- Dr. AI, MedZy Healthcare Platform**`;
  }
}

const aiDocService = new AIDocService();

const AIDoctorChatbot = () => {
  const { darkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Questionnaire state
  const [currentStep, setCurrentStep] = useState(0);
  const [patientData, setPatientData] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startQuestionnaire = () => {
    setShowQuestionnaire(true);
    setCurrentStep(0);
    setPatientData({});
    setSelectedOptions([]);
    setMessages([{
      type: 'bot',
      content: `👋 **Welcome to AI Doctor Consultation!**

I'll guide you through a few simple questions to better understand your symptoms and provide personalized medical guidance.

**What to expect:**
✅ 6 simple questions (one at a time)
🩺 Professional symptom analysis
💊 Personalized treatment recommendations
📋 Clear follow-up instructions

Let's begin with your consultation...`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleQuestionnaireAnswer = (answer) => {
    const currentQuestion = aiDocService.questions[currentStep];
    const newPatientData = { ...patientData, [currentQuestion.id]: answer };
    setPatientData(newPatientData);

    // Add user's answer to messages
    const userMessage = {
      type: 'user',
      content: typeof answer === 'object' ? answer.join(', ') : answer.toString(),
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Move to next question or show analysis
    if (currentStep < aiDocService.questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOptions([]);
      
      // Add next question to messages
      setTimeout(() => {
        const nextQuestion = aiDocService.questions[currentStep + 1];
        const botMessage = {
          type: 'bot',
          content: `**Question ${currentStep + 2}/6:** ${nextQuestion.question}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } else {
      // All questions answered, show analysis
      setShowQuestionnaire(false);
      setShowAnalysis(true);
      generateAnalysis(newPatientData);
    }
  };

  const generateAnalysis = async (data) => {
    setIsLoading(true);
    
    const analysisMessage = {
      type: 'bot',
      content: `🔄 **Analyzing your symptoms...**

I'm now processing all your answers to provide a comprehensive medical assessment. This will include:

• Detailed symptom analysis
• Possible conditions assessment  
• Treatment recommendations
• Medication suggestions with dosages
• Follow-up care instructions

Please wait a moment...`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, analysisMessage]);

    try {
      const aiResponse = await aiDocService.getAIResponse(data);
      
      const botMessage = {
        type: 'bot',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev.slice(0, -1), botMessage]);
      setShowAnalysis(true); // Set analysis complete flag
    } catch (error) {
      console.error('Error generating analysis:', error);
      
      const errorMessage = {
        type: 'bot',
        content: '⚠️ I apologize, but I encountered an issue while analyzing your symptoms. Please try again or consult with a healthcare professional if you have urgent medical concerns.',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultipleChoice = (option) => {
    if (option === "None of the above") {
      setSelectedOptions(["None of the above"]);
    } else {
      setSelectedOptions(prev => {
        const filtered = prev.filter(item => item !== "None of the above");
        if (filtered.includes(option)) {
          return filtered.filter(item => item !== option);
        } else {
          return [...filtered, option];
        }
      });
    }
  };

  const currentQuestion = aiDocService.questions[currentStep];

  const resetConsultation = () => {
    setShowQuestionnaire(false);
    setShowAnalysis(false);
    setCurrentStep(0);
    setPatientData({});
    setSelectedOptions([]);
    setMessages([]);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsOpen(true);
            // Don't auto-start questionnaire, let user see welcome screen first
          }}
          className="bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-700 hover:from-healthcare-green-700 hover:to-healthcare-green-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group relative"
          title="Start MedZy AI Doctor Consultation"
        >
          <Stethoscope className="w-6 h-6" />
          <div className="absolute -top-12 right-0 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            MedZy AI Doctor Consultation
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center space-x-3 max-w-xs">
          <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-2 rounded-full">
            <Stethoscope className="w-5 h-5 text-healthcare-green-600 dark:text-healthcare-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 dark:text-white">AI Doctor</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">MedZy AI ready to help</p>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-96 max-w-[90vw] h-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Doctor</h3>
              <p className="text-xs opacity-90">Powered by MedZy AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <button
                onClick={resetConsultation}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors flex items-center space-x-1"
                title="Start New Consultation"
              >
                <Clipboard className="w-3 h-3" />
                <span className="text-xs hidden sm:inline">New</span>
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !showQuestionnaire && (
            <div className="text-center py-8">
              <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-healthcare-green-600 dark:text-healthcare-green-400" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">AI Doctor Ready</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">Get personalized medical guidance through our interactive consultation</p>
              
              <button
                onClick={startQuestionnaire}
                className="bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-700 text-white px-6 py-3 rounded-xl font-medium hover:from-healthcare-green-700 hover:to-healthcare-green-800 transition-all duration-300 flex items-center space-x-2 mx-auto mb-4"
              >
                <Clipboard className="w-5 h-5" />
                <span>Start Medical Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">6 simple questions • Professional analysis • Treatment guidance</p>
            </div>
          )}

          {/* Show New Consultation button when analysis is complete */}
          {showAnalysis && messages.length > 0 && (
            <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={resetConsultation}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center space-x-2 mx-auto"
              >
                <Clipboard className="w-5 h-5" />
                <span>Start New Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Need help with different symptoms?</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.type === 'user'
                    ? 'bg-healthcare-green-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && (
                    <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-1 rounded-full mt-1 flex-shrink-0">
                      <Bot className="w-4 h-4 text-healthcare-green-600 dark:text-healthcare-green-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 opacity-70 ${message.type === 'user' ? 'text-healthcare-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.timestamp}
                    </div>
                  </div>
                  {message.type === 'user' && (
                    <div className="bg-healthcare-green-500 p-1 rounded-full mt-1 flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm p-4 max-w-[85%]">
                <div className="flex items-center space-x-3">
                  <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-1 rounded-full">
                    <Bot className="w-4 h-4 text-healthcare-green-600 dark:text-healthcare-green-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-healthcare-green-600 dark:text-healthcare-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Analyzing your symptoms...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Questionnaire Interface */}
        {showQuestionnaire && currentQuestion && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800 dark:text-white flex items-center text-sm">
                  <Clipboard className="w-3 h-3 mr-1" />
                  Q{currentStep + 1}/6
                </h4>
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 text-healthcare-green-600 dark:text-healthcare-green-400 px-2 py-1 rounded-full text-xs font-medium">
                  {Math.round(((currentStep + 1) / aiDocService.questions.length) * 100)}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                <div 
                  className="bg-healthcare-green-600 dark:bg-healthcare-green-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / aiDocService.questions.length) * 100}%` }}
                ></div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">{currentQuestion.question}</p>
            </div>

            {/* Question Types */}
            {currentQuestion.type === 'text' && (
              <div className="space-y-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent text-sm resize-none"
                  rows="2"
                />
                <button
                  onClick={() => {
                    if (inputMessage.trim()) {
                      handleQuestionnaireAnswer(inputMessage.trim());
                      setInputMessage('');
                    }
                  }}
                  disabled={!inputMessage.trim()}
                  className="w-full bg-healthcare-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-healthcare-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {currentQuestion.type === 'scale' && (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-1">
                  {currentQuestion.options.map((num) => (
                    <button
                      key={num}
                      onClick={() => handleQuestionnaireAnswer(num)}
                      className="bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-healthcare-green-500 hover:bg-healthcare-green-50 dark:hover:bg-healthcare-green-900/20 p-2 rounded-lg text-center font-medium transition-colors text-sm text-gray-900 dark:text-white"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>No pain</span>
                  <span>Severe pain</span>
                </div>
              </div>
            )}

            {currentQuestion.type === 'select' && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionnaireAnswer(option)}
                    className="w-full text-left p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-healthcare-green-500 hover:bg-healthcare-green-50 dark:hover:bg-healthcare-green-900/20 rounded-lg transition-colors text-sm text-gray-900 dark:text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-3">
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMultipleChoice(option)}
                      className={`w-full text-left p-2 border rounded-lg transition-colors text-sm ${
                        selectedOptions.includes(option)
                          ? 'bg-healthcare-green-100 border-healthcare-green-500 text-healthcare-green-700'
                          : 'bg-white border-gray-300 hover:border-healthcare-green-500 hover:bg-healthcare-green-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedOptions.includes(option) 
                            ? 'bg-healthcare-green-600 border-healthcare-green-600' 
                            : 'border-gray-400'
                        }`}>
                          {selectedOptions.includes(option) && (
                            <CheckCircle className="w-2 h-2 text-white" />
                          )}
                        </div>
                        <span className="flex-1">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleQuestionnaireAnswer(selectedOptions.length > 0 ? selectedOptions : ["None of the above"])}
                  className="w-full bg-healthcare-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-healthcare-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-500 text-center">
                  {selectedOptions.length > 0 ? `${selectedOptions.length} selected` : 'Select all that apply'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Regular Input Area (when not in questionnaire) */}
        {!showQuestionnaire && !isLoading && (
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            {messages.length > 0 && !showAnalysis && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={resetConsultation}
                  className="text-healthcare-green-600 text-sm hover:text-healthcare-green-700 transition-colors flex items-center space-x-1"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Start New Consultation</span>
                </button>
              </div>
            )}
            
            <div className="flex items-center space-x-1 text-xs text-gray-500 justify-center">
              <ShieldAlert className="w-3 h-3" />
              <span>AI-powered medical guidance by MedZy AI • For informational purposes only</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDoctorChatbot;

