import React, { useState } from 'react';
import { 
  Search, Heart, Shield, Users, MessageCircle, Phone, Mail, MapPin, Clock, 
  Star, ArrowRight, Menu, X, AlertTriangle, Pill, TrendingUp, Zap,
  CheckCircle2, Truck, BarChart3, FileText, Eye, Lock, ChevronDown,
  Activity, Stethoscope, Capsules
} from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useDarkMode } from '../context/DarkModeContext';

const HomepageModernTemplate = ({ onGetStarted, onSignIn, user, onGoToDashboard, isGuest = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(0);
  const { isDarkMode } = useDarkMode();

  // Service categories for medicine
  const services = [
    {
      number: '01',
      title: 'Search Medicines',
      description: 'Find any medicine by name, brand, or category. Compare prices across multiple pharmacies instantly.'
    },
    {
      number: '02',
      title: 'Women\'s Health',
      description: 'Specialized medicines for women\'s health. Discretion and privacy guaranteed with home delivery.'
    },
    {
      number: '03',
      title: 'Pediatric Care',
      description: 'Safe, verified medicines for children. Expert guidance for pediatric health concerns.'
    },
    {
      number: '04',
      title: 'Chronic Diseases',
      description: 'Regular medications for diabetes, hypertension, and other chronic conditions made easy.'
    },
    {
      number: '05',
      title: 'Mental Health',
      description: 'Psychiatric medicines with complete confidentiality and professional guidance available 24/7.'
    },
    {
      number: '06',
      title: 'Emergency Supply',
      description: 'Urgent medicines delivered within 2 hours. Always there when you need it most.'
    }
  ];

  const faqItems = [
    {
      question: 'How do I search for medicines on MedZy?',
      answer: 'Simply enter the medicine name, brand name, or health condition in our search bar. You\'ll see all available options with prices, availability, and pharmacy locations. Filter by price, rating, or nearest pharmacy for the best deals.'
    },
    {
      question: 'Are the medicines on MedZy verified?',
      answer: 'Yes, all medicines and pharmacies on MedZy are verified and licensed. We work only with registered pharmaceutical suppliers to ensure 100% authenticity and safety.'
    },
    {
      question: 'Can I get prescriptions verified through MedZy?',
      answer: 'Yes! Upload your prescription, and our system verifies it. You can then order the prescribed medicines immediately with proper documentation.'
    },
    {
      question: 'Is my medical information secure?',
      answer: 'Your data is protected with enterprise-grade encryption. We comply with all healthcare privacy regulations and never share your information with third parties.'
    },
    {
      question: 'What health concerns can I get help with?',
      answer: 'Our AI doctor helps with general health concerns, symptom analysis, and medication guidance. For serious conditions, we connect you with licensed healthcare professionals.'
    }
  ];

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Search & Find',
      description: 'Quick access to 10,000+ medicines with instant price comparison'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: '24/7 Availability',
      description: 'Order anytime, get delivery within 2 hours in your area'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure & Private',
      description: 'Your medical data is encrypted and protected with highest standards'
    },
    {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: 'Easy & Accessible',
      description: 'Simple booking process, verified pharmacies, expert support'
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} sticky top-0 z-50 border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-healthcare-green-600 p-2 rounded-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text-healthcare hidden sm:inline">MedZy</span>
            </button>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>Services</a>
              <a href="#how-it-works" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>How it Works</a>
              <a href="#faq" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>FAQ</a>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onGoToDashboard}
                    className="btn-healthcare btn-healthcare-primary"
                  >
                    Dashboard
                  </button>
                  <DarkModeToggle />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onSignIn}
                    className="px-4 py-2 text-healthcare-green-600 hover:text-healthcare-green-700 font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="btn-healthcare btn-healthcare-primary"
                  >
                    Get Started
                  </button>
                  <DarkModeToggle />
                </div>
              )}
            </div>
            
            <div className="md:hidden flex items-center space-x-2">
              <DarkModeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className={`pb-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col space-y-3 pt-4">
                <a href="#services" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Services</a>
                <a href="#how-it-works" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>How it Works</a>
                <a href="#faq" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>FAQ</a>
                {user ? (
                  <button onClick={onGoToDashboard} className="w-full btn-healthcare btn-healthcare-primary">
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button onClick={onSignIn} className="w-full btn-healthcare btn-healthcare-secondary">
                      Sign In
                    </button>
                    <button onClick={onGetStarted} className="w-full btn-healthcare btn-healthcare-primary">
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Medi Cure Style */}
      <section className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                We bring the pharmacy to your <span className="italic text-healthcare-green-600">doorstep</span>
              </h1>
              
              <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                At MedZy, we connect you with verified pharmacies, help you find affordable medicines, and guide you with AI-powered health insights, anytime, anywhere.
              </p>

              {/* Search Bar */}
              <div className="relative mb-8">
                <input
                  type="text"
                  placeholder="Search for medicines or health concerns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-healthcare w-full"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <>
                    <button
                      onClick={onGoToDashboard}
                      className="btn-healthcare btn-healthcare-primary group"
                    >
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onGetStarted}
                      className="btn-healthcare btn-healthcare-primary group"
                    >
                      Start Free Search
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-6 py-3 rounded-full border-2 border-healthcare-green-200 text-healthcare-green-600 hover:bg-healthcare-green-50 dark:border-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:bg-healthcare-green-900/20 font-semibold transition-all"
                    >
                      Learn More
                    </button>
                  </>
                )}
              </div>

              {/* Stats below buttons */}
              <div className="flex gap-8 mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                <div>
                  <div className="text-2xl font-bold text-healthcare-green-600">10K+</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Medicines</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-healthcare-green-600">500+</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pharmacies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-healthcare-green-600">2hrs</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery</div>
                </div>
              </div>
            </div>

            {/* Right Side - Doctor/Healthcare Image Placeholder */}
            <div className={`relative${isDarkMode ? ' bg-gray-700' : ' bg-gray-100'} rounded-3xl p-8 flex items-center justify-center aspect-square order-first lg:order-last`}>
              <div className="text-center">
                <Activity className="h-24 w-24 mx-auto mb-4 text-healthcare-green-600" />
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Healthcare Image</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Doctor/Health Icon Display</p>
              </div>
              {/* Floating badges */}
              <div className="absolute top-8 right-8 bg-white dark:bg-gray-600 rounded-full p-3 shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-healthcare-green-600" />
              </div>
              <div className="absolute bottom-8 left-8 bg-white dark:bg-gray-600 rounded-full p-3 shadow-lg">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Below Hero */}
      <section className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} py-16 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`p-8 rounded-2xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
              >
                <div className={`p-4 w-fit mx-auto rounded-xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'} text-healthcare-green-600 dark:text-healthcare-green-400`}>
                  {feature.icon}
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Medi Cure Style (Green Background) */}
      <section id="services" className="bg-healthcare-green-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our medicine <span className="italic">services</span>
            </h2>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              Your health needs are unique. That's why we've built MedZy around six key areas of care designed for real life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
              >
                <div className="bg-healthcare-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mb-6 text-lg">
                  {service.number}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {service.title}
                </h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              How MedZy <span className="italic text-healthcare-green-600">works</span>
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              From concern to wellness in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Search Medicines', desc: 'Find any medicine by name or health condition' },
              { step: '02', title: 'Compare Prices', desc: 'Check prices across verified pharmacies' },
              { step: '03', title: 'Verify Prescription', desc: 'Upload and verify your prescription instantly' },
              { step: '04', title: 'Get Delivery', desc: 'Receive medicines at your doorstep' }
            ].map((item, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-8 text-center`}>
                <div className="bg-healthcare-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-lg mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Medi Cure Style */}
      <section id="faq" className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} py-20`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Heading */}
            <div>
              <h2 className={`text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Frequently <span className="italic text-healthcare-green-600">asked</span> questions
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
              </p>
            </div>

            {/* Right: FAQ Items */}
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-xl overflow-hidden transition-all duration-300 ${
                    expandedFaq === index
                      ? 'bg-healthcare-green-600 text-white'
                      : `${isDarkMode ? 'bg-gray-700' : 'bg-white'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`
                  }`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}
                    className="w-full px-6 py-4 flex justify-between items-center font-medium hover:opacity-90"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="px-6 pb-4 border-t border-opacity-20 border-current text-sm">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-healthcare-green-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Medicine shouldn't be complicated. <span className="italic">Let MedZy make it simple.</span>
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Take control of your health today. Search, compare, and order your medicines now.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-healthcare-green-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-900'} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Pill className="h-6 w-6" />
                <span className="text-xl font-bold">MedZy</span>
              </div>
              <p className="text-gray-400">Your trusted platform for affordable, accessible medicines.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Search Medicines</a></li>
                <li><a href="#" className="hover:text-white">Price Compare</a></li>
                <li><a href="#" className="hover:text-white">AI Doctor</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Help</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 MedZy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomepageModernTemplate;

