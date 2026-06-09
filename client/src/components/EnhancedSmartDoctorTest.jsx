import React from 'react';
import { 
  MessageCircle, 
  Stethoscope, 
  Activity, 
  FileText, 
  Bell 
} from 'lucide-react';
import SmartDoctorChatInterface from './SmartDoctorChatInterface';

const EnhancedSmartDoctorTest = () => {
  console.log('EnhancedSmartDoctorTest component rendered');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Enhanced Smart Doctor - Test Version
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This is a test version to verify the component is loading correctly.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Prescription OCR</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Extract medicine info from prescriptions</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Medicine Reminders</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Set up automated medication reminders</p>
              </div>
            </div>
          </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Medicine Reminders</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Set up automated medication reminders</p>
            </div>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Chat Interface
          </h3>
          <div className="h-[400px] border rounded-lg">
            <SmartDoctorChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSmartDoctorTest;

