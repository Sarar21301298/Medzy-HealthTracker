import React, { useState } from 'react';
import { Stethoscope, Heart, Shield, Users, MessageCircle, Phone, Mail, MapPin, Clock, Star, ArrowRight, Menu, X, AlertTriangle } from 'lucide-react';
import AIDoctorChatbot from './AIDoctorChatbot';
import DarkModeToggle from './DarkModeToggle';
import ReviewsSlider from './ReviewsSlider';
import { useDarkMode } from '../context/DarkModeContext';

const Homepage = ({ onGetStarted, onSignIn, user, onGoToDashboard, isGuest = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode } = useDarkMode();
  const features = [
    {
      icon: <Heart className="h-8 w-8 text-healthcare-green-600" />,
      title: "Health Management",
      description: "Comprehensive health tracking and medication management system for better wellness"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure & Private",
      description: "Your health data is protected with enterprise-grade security and encryption"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Multi-Role Access",
      description: "Designed for customers, pharmacy vendors, and healthcare professionals"
    },
    {
      icon: <Stethoscope className="h-8 w-8 text-red-600" />,
      title: "AI Doctor Assistant",
      description: "Get instant medical guidance from our MedZy AI-powered virtual doctor for symptom analysis"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-orange-600" />,
      title: "24/7 Support",
      description: "Get help anytime with our comprehensive support system and live chat"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Healthcare Professional",
      content: "MedZy has revolutionized how we manage patient medications and health records.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Pharmacy Owner",
      content: "The vendor dashboard makes inventory management incredibly efficient.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Patient",
      content: "Finally, a platform that puts patient care and convenience first.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              title="Back to Top"
            >
              <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MedZy</h1>
            </button>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">🎯 Features</a>
              <a href="#reviews" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">⭐ Reviews</a>
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">ℹ️ About</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">📞 Contact</a>
              
              {user ? (
                // Logged in user options
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    👋 Welcome, {user.firstName}!
                  </span>
                  <button
                    onClick={onGoToDashboard}
                    className="bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-6 py-2 rounded-lg hover:from-healthcare-green-700 hover:to-green-600 transition-all duration-200 font-medium hover:scale-105 transform"
                  >
                    📊 Go to Dashboard
                  </button>
                  <DarkModeToggle />
                </div>
              ) : (
                // Guest user options
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onSignIn}
                    className="bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-6 py-2 rounded-lg hover:from-healthcare-green-700 hover:to-green-600 transition-all duration-200 font-medium hover:scale-105 transform"
                  >
                    Sign In
                  </button>
                  <DarkModeToggle />
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <DarkModeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4 pt-4">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">🎯 Features</a>
                <a href="#reviews" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">⭐ Reviews</a>
                <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">ℹ️ About</a>
                <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-healthcare-green-600 dark:hover:text-healthcare-green-400 transition-colors font-medium">📞 Contact</a>
                
                {user ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300 py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      👋 Welcome, {user.firstName}!
                    </div>
                    <button
                      onClick={onGoToDashboard}
                      className="w-full bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-healthcare-green-700 hover:to-green-600 transition-all duration-200 font-medium"
                    >
                      📊 Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onGetStarted}
                    className="w-full bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-healthcare-green-700 hover:to-green-600 transition-all duration-200 font-medium"
                  >
                    �Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-healthcare-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-4 rounded-full w-20 h-20 mx-auto mb-8 flex items-center justify-center">
              <Heart className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {user ? `Welcome back, ${user.firstName}!` : 'Your Health,'}
              <span className="bg-gradient-to-r from-healthcare-green-600 to-green-500 bg-clip-text text-transparent">
                {user ? ' Ready to manage your health?' : ' Our Priority'}
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              🏥 {user 
                ? `Continue your healthcare journey with MedZy's comprehensive platform. Access your dashboard, manage your health records, and stay connected with your healthcare providers.`
                : 'MedZy is a comprehensive healthcare management platform that connects patients, pharmacies, and healthcare providers in one secure, easy-to-use system.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <button
                    onClick={onGoToDashboard}
                    className="bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-healthcare-green-700 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 transform"
                  >
                    <span>📊 Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    🎯 Explore Features
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onGetStarted}
                    className="bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-healthcare-green-700 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 transform"
                  >
                    <span>🚀 Get Started for Free</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  
                  <button 
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    📖 Learn More
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose MedZy?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built with cutting-edge technology to provide the best healthcare management experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Doctor Showcase Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="h-4 w-4 mr-2" />
                Featured Technology
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Meet Your AI Doctor Assistant
              </h2>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get instant medical guidance powered by advanced AI. Our virtual doctor analyzes your symptoms 
                and provides professional health recommendations 24/7, completely free.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg mr-4">
                    <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Instant Symptom Analysis</h3>
                    <p className="text-gray-600 dark:text-gray-300">Describe your symptoms and get immediate AI-powered health insights</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-2 rounded-lg mr-4">
                    <Shield className="h-5 w-5 text-healthcare-green-600 dark:text-healthcare-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Safe & Private</h3>
                    <p className="text-gray-600 dark:text-gray-300">Your health information is kept private and secure</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-4">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Available 24/7</h3>
                    <p className="text-gray-600 dark:text-gray-300">Get medical guidance anytime, anywhere, completely free</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Important:</strong> AI guidance is for informational purposes only. 
                    Always consult healthcare professionals for serious medical concerns.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right: Visual/Demo */}
            <div className="relative">
              <div className="bg-gradient-to-br from-healthcare-green-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-gray-200 dark:border-gray-600">
                <div className="text-center mb-6">
                  <div className="bg-white dark:bg-gray-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="h-8 w-8 text-healthcare-green-600 dark:text-healthcare-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Try AI Doctor Now</h3>
                  <p className="text-gray-600 dark:text-gray-300">Click the chat button below to start your consultation</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-healthcare-green-600 text-white px-4 py-2 rounded-lg rounded-bl-none max-w-xs">
                        <p className="text-sm">I have a headache and feeling tired. What could be wrong?</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg rounded-br-none max-w-xs">
                        <p className="text-sm">Based on your symptoms, this could be tension headache or dehydration. I recommend rest, hydration, and OTC pain relief...</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                    <button className="bg-gradient-to-r from-healthcare-green-600 to-green-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-healthcare-green-700 hover:to-green-600 transition-all">
                      Start Your Consultation
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full animate-bounce">
                <Heart className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-healthcare-green-500 text-white p-3 rounded-full animate-pulse">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-healthcare-green-600 to-green-500 dark:from-healthcare-green-800 dark:to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-healthcare-green-100 dark:text-healthcare-green-200">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-healthcare-green-100 dark:text-healthcare-green-200">Partner Pharmacies</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-healthcare-green-100 dark:text-healthcare-green-200">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Trusted by healthcare professionals and patients alike</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Slider Section */}
      <ReviewsSlider />

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-healthcare-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">🏥 About MedZy</h2>
              <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                <p>
                  MedZy is a revolutionary healthcare management platform designed to bridge the gap between 
                  patients, healthcare providers, and pharmacies. Our mission is to make healthcare more 
                  accessible, efficient, and patient-centered.
                </p>
                <p>
                  Founded with the vision of transforming healthcare delivery, we combine cutting-edge 
                  technology with deep healthcare expertise to create solutions that truly make a difference 
                  in people's lives.
                </p>
                <p>
                  Whether you're managing medications, seeking medical support, or running a pharmacy, 
                  MedZy provides the tools and platform you need to deliver exceptional healthcare experiences.
                </p>
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                  <div className="text-2xl font-bold text-healthcare-green-600 dark:text-healthcare-green-400 mb-1">2025</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Founded</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Support</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">🎯 Our Core Values</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-white bg-opacity-20 rounded-full p-1 mt-1">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Patient-First Approach</h4>
                      <p className="text-sm opacity-90">Every decision we make prioritizes patient care and outcomes.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-white bg-opacity-20 rounded-full p-1 mt-1">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Security & Privacy</h4>
                      <p className="text-sm opacity-90">Your health data is protected with the highest security standards.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-white bg-opacity-20 rounded-full p-1 mt-1">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Collaborative Care</h4>
                      <p className="text-sm opacity-90">Connecting all stakeholders for better health outcomes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">We're here to help you with any questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8 text-healthcare-green-600 dark:text-healthcare-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h3>
              <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sun-Thu 9AM-6PM(GMT+6)</p>
            </div>

                        <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-300">support@medzy.health</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Response within 24 hours</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Office Location</h3>
              <p className="text-gray-600 dark:text-gray-300">Gulshan Healthcare Ave</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dhaka, BD 1212</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-3 mb-4 hover:opacity-80 transition-opacity"
                title="Back to Top"
              >
                <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-2 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold"> MedZy</h3>
              </button>
              <p className="text-gray-400">
                Your trusted healthcare management platform, connecting patients and providers.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2025 MedZy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Doctor Chatbot */}
      <AIDoctorChatbot />
    </div>
  );
};

export default Homepage;
