import React, { useState } from 'react';
import { Search, ArrowRight, Menu, X, Pill, CheckCircle2, Star, ChevronDown, Activity, Clock, Shield } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useDarkMode } from '../context/DarkModeContext';
import { useTranslation } from '../context/TranslationContext';

const HomepageTemplateTest = ({ onGetStarted, onSignIn, user, onGoToDashboard }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  const services = [
    { number: '01', titleKey: 'homepage.searchMedicines', descKey: 'homepage.searchMedicinDesc' },
    { number: '02', titleKey: 'homepage.womensHealth', descKey: 'homepage.womensHealthDesc' },
    { number: '03', titleKey: 'homepage.pediatricCare', descKey: 'homepage.pediatricCareDesc' },
    { number: '04', titleKey: 'homepage.chronicDiseases', descKey: 'homepage.chronicDiseasesDesc' },
    { number: '05', titleKey: 'homepage.mentalHealth', descKey: 'homepage.mentalHealthDesc' },
    { number: '06', titleKey: 'homepage.emergencySupply', descKey: 'homepage.emergencySupplyDesc' }
  ];

  const faqItems = [
    { questionKey: 'homepage.howSearchWorks', answerKey: 'homepage.howSearchAnswer' },
    { questionKey: 'homepage.areMedicinesVerified', answerKey: 'homepage.areMedicinesAnswer' },
    { questionKey: 'homepage.canVerifyPrescriptions', answerKey: 'homepage.canVerifyAnswer' },
    { questionKey: 'homepage.isDataSecure', answerKey: 'homepage.isDataSecureAnswer' }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} sticky top-0 z-50 border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-healthcare-green-600 p-2 rounded-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold text-healthcare-green-600 hidden sm:inline">MedZy</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} font-medium`}>{t('homepage.services')}</a>
              <a href="#how-it-works" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} font-medium`}>{t('homepage.howItWorks')}</a>
              <a href="#faq" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} font-medium`}>{t('homepage.faq')}</a>
              
              <div className="flex items-center space-x-3">
                {user ? (
                  <>
                    <button onClick={onGoToDashboard} className="btn-healthcare btn-healthcare-primary">{t('homepage.goToDashboard')}</button>
                  </>
                ) : (
                  <>
                    <button onClick={onSignIn} className="px-4 py-2 text-healthcare-green-600 hover:text-healthcare-green-700 font-medium">{t('homepage.signIn')}</button>
                    <button onClick={onGetStarted} className="btn-healthcare btn-healthcare-primary">{t('homepage.getStarted')}</button>
                  </>
                )}
                <LanguageSwitcher />
                <DarkModeToggle />
              </div>
            </div>
            
            <div className="md:hidden flex items-center space-x-2">
              <LanguageSwitcher />
              <DarkModeToggle />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className={`pb-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col space-y-3 pt-4">
                <a href="#services" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('homepage.services')}</a>
                <a href="#how-it-works" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('homepage.howItWorks')}</a>
                <a href="#faq" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('homepage.faq')}</a>
                {user ? (
                  <button onClick={onGoToDashboard} className="w-full btn-healthcare btn-healthcare-primary">{t('homepage.goToDashboard')}</button>
                ) : (
                  <>
                    <button onClick={onSignIn} className="w-full btn-healthcare btn-healthcare-secondary">{t('homepage.signIn')}</button>
                    <button onClick={onGetStarted} className="w-full btn-healthcare btn-healthcare-primary">{t('homepage.getStarted')}</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('homepage.heroTitle')}
              </h1>
              
              <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('homepage.heroDescription')}
              </p>

              <div className="relative mb-8">
                <input type="text" placeholder={t('homepage.searchPlaceholder')} className="input-healthcare w-full" />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <button onClick={onGoToDashboard} className="btn-healthcare btn-healthcare-primary">
                    {t('homepage.goToDashboard')}
                  </button>
                ) : (
                  <>
                    <button onClick={onGetStarted} className="btn-healthcare btn-healthcare-primary">
                      {t('homepage.startFreeSearch')}
                    </button>
                    <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 rounded-full border-2 border-healthcare-green-200 text-healthcare-green-600 hover:bg-healthcare-green-50 dark:border-healthcare-green-700 dark:text-healthcare-green-400 dark:hover:bg-healthcare-green-900/20 font-semibold">
                      {t('homepage.learnMore')}
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-8 mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                <div>
                  <div className="text-2xl font-bold text-healthcare-green-600">10K+</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('homepage.medicines')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-healthcare-green-600">500+</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('homepage.pharmacies')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-healthcare-green-600">2hrs</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('homepage.delivery')}</div>
                </div>
              </div>
            </div>

            <div className={`relative ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-3xl overflow-hidden aspect-square`}>
              <img 
                src="/healthcare-hero.png" 
                alt="MedZy Healthcare Services" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} py-16 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-8 rounded-2xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={`p-4 w-fit mx-auto rounded-xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'}`}>
                <Search className="h-8 w-8 text-healthcare-green-600" />
              </div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search & Find</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>10,000+ medicines with instant price comparison</p>
            </div>
            <div className={`p-8 rounded-2xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={`p-4 w-fit mx-auto rounded-xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'}`}>
                <Clock className="h-8 w-8 text-healthcare-green-600" />
              </div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>24/7 Availability</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order anytime, delivery within 2 hours</p>
            </div>
            <div className={`p-8 rounded-2xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={`p-4 w-fit mx-auto rounded-xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'}`}>
                <Shield className="h-8 w-8 text-healthcare-green-600" />
              </div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Secure & Private</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your data protected with encryption</p>
            </div>
            <div className={`p-8 rounded-2xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={`p-4 w-fit mx-auto rounded-xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'}`}>
                <CheckCircle2 className="h-8 w-8 text-healthcare-green-600" />
              </div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Easy & Accessible</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Simple process, verified pharmacies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-healthcare-green-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our medicine <span className="italic">services</span>
            </h2>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              Your health needs are unique. We've built MedZy around six key areas of care designed for real life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 hover:shadow-lg transition-all`}>
                <div className="bg-healthcare-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mb-6 text-lg">
                  {service.number}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t(service.titleKey)}</h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t(service.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              How MedZy <span className="italic text-healthcare-green-600">works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Search Medicines', desc: 'Find by name or health condition' },
              { step: '02', title: 'Compare Prices', desc: 'Check prices across pharmacies' },
              { step: '03', title: 'Verify Prescription', desc: 'Upload and verify instantly' },
              { step: '04', title: 'Get Delivery', desc: 'Receive at your doorstep' }
            ].map((item, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-8 text-center`}>
                <div className="bg-healthcare-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-lg mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} py-20`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className={`text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Frequently <span className="italic text-healthcare-green-600">asked</span> questions
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Have questions? We've got answers. Contact us if you need more help.
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div key={index} className={`rounded-xl overflow-hidden transition-all ${expandedFaq === index ? 'bg-healthcare-green-600 text-white' : `${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}`}>
                  <button onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)} className="w-full px-6 py-4 flex justify-between items-center font-medium hover:opacity-90">
                    <span>{t(item.questionKey)}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="px-6 pb-4 border-t border-opacity-20 border-current text-sm">
                      {t(item.answerKey)}
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
          <button onClick={onGetStarted} className="bg-white text-healthcare-green-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100">
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Pill className="h-6 w-6" />
                <span className="text-xl font-bold">MedZy</span>
              </div>
              <p className="text-gray-400">Your trusted platform for affordable medicines.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Search</a></li>
                <li><a href="#" className="hover:text-white">AI Doctor</a></li>
                <li><a href="#" className="hover:text-white">Reminders</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Help</a></li>
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

export default HomepageTemplateTest;

